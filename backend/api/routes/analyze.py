# backend/api/routes/analyze.py

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, ClassVar
from datetime import datetime, timedelta
import hashlib

from database.db import SessionLocal
from database.models import CVE
from enrichment import get_deepseek
from config import settings

router = APIRouter(prefix="/api/analyze", tags=["Analyse Stack"])

# ─── Rate limiting simple en mémoire ──────────────────────────────────────────
# Justification sécurité : évite les abus et les coûts excessifs
# On utilise un hash de l'IP pour ne pas stocker l'IP réelle
_rate_limit_store: Dict[str, list] = {}


def _check_rate_limit(ip: str) -> bool:
    """
    Vérifie si l'IP n'a pas dépassé la limite d'analyses.
    On stocke un hash de l'IP, jamais l'IP réelle.
    Justification RGPD : minimisation des données.
    """
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]
    now = datetime.utcnow()
    window = now - timedelta(hours=1)

    if ip_hash not in _rate_limit_store:
        _rate_limit_store[ip_hash] = []

    # Nettoyer les entrées expirées
    _rate_limit_store[ip_hash] = [
        t for t in _rate_limit_store[ip_hash] if t > window
    ]

    if len(_rate_limit_store[ip_hash]) >= settings.STACK_RATE_LIMIT:
        return False

    _rate_limit_store[ip_hash].append(now)
    return True


# ─── Schémas de validation ────────────────────────────────────────────────────

class StackRequest(BaseModel):
    """
    Données de stack envoyées par le frontend.
    
    Règles de sécurité :
    - Uniquement des noms de technologies connues
    - Pas d'IP, pas de noms d'entreprise, pas de données personnelles
    - Longueur limitée pour éviter les injections
    """
    os: Optional[List[str]] = []
    os_versions: Optional[List[str]] = []
    serveurs_web: Optional[List[str]] = []
    langages: Optional[List[str]] = []
    bases_de_donnees: Optional[List[str]] = []
    frameworks: Optional[List[str]] = []
    infrastructure: Optional[List[str]] = []
    cms: Optional[List[str]] = []

    # Technologies autorisées — liste blanche stricte
    TECHNOLOGIES_AUTORISEES: ClassVar[Dict] = {
        "os": [
            "linux", "ubuntu", "debian", "centos", "redhat", "fedora",
            "windows", "windows server", "macos", "alpine"
        ],
        "serveurs_web": [
            "apache", "nginx", "iis", "caddy", "lighttpd", "tomcat"
        ],
        "langages": [
            "php", "python", "java", "nodejs", "node.js", "ruby",
            "go", "rust", ".net", "perl", "c", "c++"
        ],
        "bases_de_donnees": [
            "mysql", "postgresql", "mongodb", "redis", "mssql",
            "sqlite", "mariadb", "oracle", "elasticsearch"
        ],
        "frameworks": [
            "django", "flask", "laravel", "symfony", "spring",
            "express", "rails", "wordpress", "drupal", "joomla"
        ],
        "infrastructure": [
            "docker", "kubernetes", "openssl", "jenkins", "gitlab",
            "nginx", "haproxy", "vmware", "openssh"
        ],
    }

    @field_validator('*', mode='before')
    @classmethod
    def sanitize_list(cls, v):
        """
        Sanitise chaque valeur de la liste.
        Justification sécurité : évite les injections et les données
        sensibles passées par erreur ou malveillance.
        """
        if not isinstance(v, list):
            return v
        sanitized = []
        for item in v:
            if isinstance(item, str):
                # Nettoyer et limiter la longueur
                clean = item.strip().lower()[:50]
                # Supprimer les caractères dangereux
                clean = ''.join(c for c in clean if c.isalnum() or c in '.-_ ')
                if clean:
                    sanitized.append(clean)
        return sanitized[:10]  # max 10 items par catégorie

    def to_search_terms(self) -> List[str]:
        """Convertit la stack en termes de recherche."""
        terms = []
        for field in [
            self.os, self.os_versions, self.serveurs_web,
            self.langages, self.bases_de_donnees,
            self.frameworks, self.infrastructure, self.cms
        ]:
            terms.extend(field or [])
        return list(set(terms))  # dédupliquer

    def is_empty(self) -> bool:
        """Vérifie que la stack n'est pas vide."""
        return not any([
            self.os, self.serveurs_web, self.langages,
            self.bases_de_donnees, self.frameworks,
            self.infrastructure, self.cms
        ])


# ─── Endpoint principal ───────────────────────────────────────────────────────

@router.post("/stack")
async def analyze_stack(stack: StackRequest, request: Request):
    """
    Analyse une stack technique et retourne les CVE correspondants
    avec une interprétation IA complète.

    Sécurité :
    - Rate limiting par IP hashée
    - Validation stricte des entrées (liste blanche)
    - Aucune donnée personnelle stockée
    - Sanitisation de toutes les entrées
    - Timeout sur l'appel IA
    """

    # Vérification stack non vide
    if stack.is_empty():
        raise HTTPException(
            status_code=400,
            detail="Veuillez sélectionner au moins une technologie"
        )

    # Rate limiting
    client_ip = request.client.host or "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Trop d'analyses en peu de temps. Réessayez dans une heure."
        )

    # Récupérer les termes de recherche
    search_terms = stack.to_search_terms()
    if not search_terms:
        raise HTTPException(
            status_code=400,
            detail="Stack invalide"
        )

    # Recherche dans TOUTE la base (historique complet)
    db = SessionLocal()
    try:
        matching_cves = []

        for term in search_terms:
            cves = db.query(CVE).filter(
                CVE.description.ilike(f"%{term}%") |
                CVE.titre.ilike(f"%{term}%") |
                CVE.systemes.cast(db.bind.dialect.name == 'postgresql'
                    and __import__('sqlalchemy').Text
                    or __import__('sqlalchemy').Text
                ).ilike(f"%{term}%")
            ).all()

            for cve in cves:
                if not any(c["id"] == cve.id for c in matching_cves):
                    cve_dict = cve.to_dict()
                    # Calculer le score de pertinence
                    cve_dict["pertinence"] = _calculate_relevance(
                        cve_dict, search_terms
                    )
                    matching_cves.append(cve_dict)

        # Trier par pertinence puis par score CVSS
        matching_cves.sort(
            key=lambda x: (x.get("pertinence", 0), x.get("score_cvss") or 0),
            reverse=True
        )

        total_matches = len(matching_cves)

        # Limiter pour l'analyse IA
        cves_for_ai = matching_cves[:settings.STACK_MAX_CVES_ANALYZE]

        # Statistiques rapides
        stats = _compute_stats(matching_cves)

    finally:
        db.close()

    # Analyse IA avec DeepSeek
    ai_analysis = {}
    if matching_cves and settings.DEEPSEEK_API_KEY:
        try:
            deepseek = get_deepseek()

            # Construire le stack_dict correctement
            # en filtrant les valeurs vides
            stack_dict = {}
            if stack.os or stack.os_versions:
                stack_dict["Systèmes d'exploitation"] = stack.os + stack.os_versions
            if stack.serveurs_web:
                stack_dict["Serveurs web"] = stack.serveurs_web
            if stack.langages:
                stack_dict["Langages"] = stack.langages
            if stack.bases_de_donnees:
                stack_dict["Bases de données"] = stack.bases_de_donnees
            if stack.frameworks:
                stack_dict["Frameworks"] = stack.frameworks
            if stack.infrastructure:
                stack_dict["Infrastructure"] = stack.infrastructure
            if stack.cms:
                stack_dict["CMS"] = stack.cms

            print(f" Stack envoyée à DeepSeek : {stack_dict}")
            print(f" Nombre de CVE envoyés : {len(cves_for_ai)}")

            ai_analysis = await deepseek.analyze_stack(
                stack_dict,
                cves_for_ai
            )
            
            print(f"🔍 Clés analyse reçues : {list(ai_analysis.keys())}")

        except Exception as e:
            print(f"  Erreur analyse DeepSeek : {e}")
            ai_analysis = {"error": "Analyse IA temporairement indisponible"}

    # Réponse finale
    # Note : on ne logge PAS la stack dans les logs serveur
    return JSONResponse(content={
        "total_vulnerabilites": total_matches,
        "statistiques": stats,
        "vulnerabilites": matching_cves[:50],  # max 50 dans la réponse
        "analyse_ia": ai_analysis,
        "meta": {
            "technologies_analysees": len(search_terms),
            "periode_couverte": "historique complet",
            "avertissement": (
                "Cette analyse est basée sur vos déclarations et ne "
                "remplace pas un audit de sécurité professionnel. "
                "Vos données n'ont pas été conservées sur nos serveurs."
            )
        }
    })


# ─── Fonctions utilitaires ────────────────────────────────────────────────────

def _calculate_relevance(cve: Dict, terms: List[str]) -> float:
    """
    Calcule un score de pertinence entre un CVE et la stack.
    Plus de termes matchent → score plus élevé.
    """
    score = 0.0
    text = " ".join([
        cve.get("description", ""),
        cve.get("titre", ""),
        " ".join(cve.get("systemes", []) or []),
    ]).lower()

    for term in terms:
        if term.lower() in text:
            score += 1.0
            # Bonus si dans le titre
            if term.lower() in cve.get("titre", "").lower():
                score += 0.5
            # Bonus si dans les systèmes
            if any(term.lower() in s.lower()
                   for s in (cve.get("systemes") or [])):
                score += 0.5

    return score


def _compute_stats(cves: List[Dict]) -> Dict:
    """Calcule les statistiques rapides sur les CVE matchés."""
    if not cves:
        return {
            "critiques": 0, "hautes": 0,
            "moyennes": 0, "faibles": 0,
            "actifs_exploit": 0, "enrichis": 0
        }

    return {
        "critiques": sum(1 for c in cves if c.get("criticite") == "CRITIQUE"),
        "hautes": sum(1 for c in cves if c.get("criticite") == "HAUTE"),
        "moyennes": sum(1 for c in cves if c.get("criticite") == "MOYENNE"),
        "faibles": sum(1 for c in cves if c.get("criticite") == "FAIBLE"),
        "actifs_exploit": sum(1 for c in cves if c.get("actif_exploit")),
        "enrichis": sum(1 for c in cves if c.get("enrichi")),
    }