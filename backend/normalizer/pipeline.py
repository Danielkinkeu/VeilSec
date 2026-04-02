# backend/normalizer/pipeline.py

from typing import List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from database.models import CVE, Source
from database.db import SessionLocal
from database.models import CVE


class NormalizerPipeline:
    """
    Pipeline de traitement des données collectées.
    Reçoit les données normalisées depuis une source
    et les prépare pour la base de données.
    """

    # Champs obligatoires que chaque CVE normalisé doit avoir
    REQUIRED_FIELDS = ["id", "source", "titre", "description"]

    def __init__(self):
        self.stats = {
            "total": 0,
            "nouveaux": 0,
            "mis_a_jour": 0,
            "ignores": 0,
            "invalides": 0,
        }

    def reset_stats(self):
        """Remet les statistiques à zéro avant chaque collecte."""
        for key in self.stats:
            self.stats[key] = 0

    # =========================================================
    # ÉTAPE 1 — VALIDATION
    # =========================================================

    def validate(self, data: Dict[Any, Any]) -> Tuple[bool, str]:
        """
        Vérifie qu'un enregistrement normalisé est valide.
        Retourne (True, "") si valide, (False, "raison") sinon.
        """
        # Vérifier les champs obligatoires
        for field in self.REQUIRED_FIELDS:
            if field not in data or not data[field]:
                return False, f"Champ obligatoire manquant : {field}"

        # Vérifier le format de l'ID CVE
        cve_id = data.get("id", "")
        PREFIXES_VALIDES = ("CVE-", "GHSA-", "EDB-")
        if not any(cve_id.startswith(p) for p in PREFIXES_VALIDES):
            return False, f"Format d'ID invalide : {cve_id}"

        # Vérifier le score CVSS si présent
        score = data.get("score_cvss")
        if score is not None and not (0.0 <= score <= 10.0):
            return False, f"Score CVSS invalide : {score}"

        return True, ""

    # =========================================================
    # ÉTAPE 2 — DÉDUPLICATION
    # =========================================================

    def deduplicate(self, data: Dict[Any, Any], db: Session) -> Tuple[str, Any]:
        """
        Vérifie si le CVE existe déjà en base.
        Retourne :
          - ("nouveau", None)      → n'existe pas, à insérer
          - ("existant", cve_obj)  → existe déjà, à mettre à jour si nécessaire
          - ("ignore", None)       → existe et n'a pas changé, rien à faire
        """
        cve_id = data["id"]
        existant = db.query(CVE).filter(CVE.id == cve_id).first()

        if not existant:
            return "nouveau", None

        # Le CVE existe — on vérifie si des infos importantes ont changé
        # Par exemple : le score CVSS peut être ajouté après la première publication
        a_change = False

        if data.get("score_cvss") and existant.score_cvss is None:
            a_change = True  # un score vient d'être assigné

        if data.get("cwe") and existant.cwe is None:
            a_change = True  # un CWE vient d'être assigné

        if data.get("systemes") and not existant.systemes:
            a_change = True  # des systèmes viennent d'être référencés

        if data.get("actif_exploit") and not existant.actif_exploit:
            a_change = True  # la faille est maintenant activement exploitée

        if a_change:
            return "existant", existant

        return "ignore", existant

    # =========================================================
    # ÉTAPE 3 — SAUVEGARDE
    # =========================================================

    def save_new(self, data: Dict[Any, Any], db: Session) -> CVE:
        """Insère un nouveau CVE en base de données."""
        cve = CVE(
            id=data["id"],
            source=data["source"],
            titre=data["titre"],
            description=data["description"],
            lien=data.get("lien"),
            score_cvss=data.get("score_cvss"),
            criticite=data.get("criticite", "INCONNUE"),
            systemes=data.get("systemes", []),
            cwe=data.get("cwe"),
            auteur=data.get("auteur"),
            date_publication=data.get("date_publication"),
            actif_exploit=data.get("actif_exploit", False),
            nouveau=True,
            enrichi=False,
        )
        db.add(cve)
        return cve

    def update_existing(self, data: Dict[Any, Any], cve: CVE) -> CVE:
        """Met à jour un CVE existant avec les nouvelles informations."""
        # On ne met à jour que les champs qui ont été complétés
        if data.get("score_cvss") and cve.score_cvss is None:
            cve.score_cvss = data["score_cvss"]
            cve.criticite = data.get("criticite", cve.criticite)

        if data.get("cwe") and cve.cwe is None:
            cve.cwe = data["cwe"]

        if data.get("systemes") and not cve.systemes:
            cve.systemes = data["systemes"]

        if data.get("actif_exploit") and not cve.actif_exploit:
            cve.actif_exploit = True

        cve.date_maj = datetime.utcnow()
        return cve

    # =========================================================
    # MÉTHODE PRINCIPALE
    # =========================================================

    def process(self, normalized_data: List[Dict[Any, Any]]) -> Dict[str, int]:
        """
        Traite une liste complète de CVE normalisés.
        C'est la méthode appelée par le scheduler après chaque collecte.
        """
        self.reset_stats()
        self.stats["total"] = len(normalized_data)

        db = SessionLocal()

        try:
            for data in normalized_data:

                # --- Validation ---
                valide, raison = self.validate(data)
                if not valide:
                    print(f"  CVE invalide [{data.get('id', '?')}] : {raison}")
                    self.stats["invalides"] += 1
                    continue

                # --- Déduplication ---
                statut, existant = self.deduplicate(data, db)

                if statut == "nouveau":
                    self.save_new(data, db)
                    self.stats["nouveaux"] += 1

                elif statut == "existant":
                    self.update_existing(data, existant)
                    self.stats["mis_a_jour"] += 1

                elif statut == "ignore":
                    self.stats["ignores"] += 1

            # Commit de toutes les opérations en une seule transaction
            db.commit()

        except Exception as e:
            db.rollback()
            print(f" Erreur pipeline : {e}")
            raise

        finally:
            db.close()

        self._print_rapport()
        return self.stats

    def _print_rapport(self):
        """Affiche un rapport lisible après chaque traitement."""
        print(f"\n{'='*50}")
        print(f"   Rapport Pipeline VeilSec")
        print(f"{'='*50}")
        print(f"  Total traités  : {self.stats['total']}")
        print(f"   Nouveaux    : {self.stats['nouveaux']}")
        print(f"   Mis à jour  : {self.stats['mis_a_jour']}")
        print(f"    Ignorés     : {self.stats['ignores']}")
        print(f"   Invalides   : {self.stats['invalides']}")
        print(f"{'='*50}\n")


    # =========================================================
    # UTILITAIRE — Mise à jour du statut source
    # =========================================================

    @staticmethod
    def update_source_status(
        nom: str,
        statut: str,
        nb_cve: int = 0,
        erreur: str = None
    ):
        """
        Met à jour le statut d'une source dans la table Source.
        Appelé avant et après chaque collecte.
        """
        db = SessionLocal()
        try:
            source = db.query(Source).filter(Source.nom == nom).first()

            if not source:
                # Première fois qu'on voit cette source — on la crée
                source = Source(nom=nom)
                db.add(source)

            source.statut = statut
            source.erreur = erreur

            if statut == "success":
                source.derniere_collecte = datetime.utcnow()
                source.nb_cve_dernier = nb_cve

                 
                total_reel = db.query(CVE).filter(CVE.source == nom).count()
                source.nb_cve_total = total_reel

            db.commit()

        except Exception as e:
            db.rollback()
            print(f" Erreur update source {nom} : {e}")
        finally:
            db.close()