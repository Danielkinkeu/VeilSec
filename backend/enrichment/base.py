# backend/enrichment/base.py

from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseLLM(ABC):
    """
    Contrat de base que chaque adaptateur IA doit respecter.
    Peu importe le modèle utilisé, l'interface est toujours la même.
    """

    nom: str = "base"

    @abstractmethod
    async def enrich(self, cve_data: Dict[Any, Any]) -> Dict[Any, Any]:
        """
        Reçoit un CVE normalisé et retourne les enrichissements IA :
        - resume      : résumé clair en français
        - recommandation : conseils de mitigation
        """
        pass

    def _build_prompt(self, cve_data: Dict[Any, Any]) -> str:
        """
        Construit le prompt envoyé au modèle IA.
        Commun à tous les adaptateurs.
        """
        systemes = ", ".join(cve_data.get("systemes", [])) or "Non précisé"
        score = cve_data.get("score_cvss", "Non disponible")
        criticite = cve_data.get("criticite", "INCONNUE")
        cwe = cve_data.get("cwe", "Non précisé")

        return f"""Tu es un expert en cybersécurité. Analyse cette vulnérabilité et réponds UNIQUEMENT en JSON valide, sans texte avant ou après.

VULNÉRABILITÉ :
- ID         : {cve_data.get('id')}
- Score CVSS : {score}/10 ({criticite})
- Type (CWE) : {cwe}
- Systèmes   : {systemes}
- Description: {cve_data.get('description', '')[:500]}

Réponds avec ce JSON exact :
{{
  "resume": "Résumé clair en 2-3 phrases en français, compréhensible par un non-expert",
  "recommandation": "Actions concrètes de mitigation en 2-3 phrases en français",
  "impact": "Ce que l'attaquant peut faire si la faille est exploitée (1 phrase)",
  "urgence": "IMMEDIATE | HAUTE | NORMALE | FAIBLE"
}}"""

    def _parse_response(self, text: str) -> Dict[str, str]:
        """
        Parse la réponse JSON du modèle.
        Gère les cas où le modèle ajoute du texte autour du JSON.
        """
        import json
        import re

        # Nettoyer les balises markdown si présentes
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Tenter d'extraire le JSON avec une regex
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass

            # Retourner des valeurs par défaut si le parsing échoue
            return {
                "resume": "Analyse IA non disponible",
                "recommandation": "Consulter le lien officiel pour les détails",
                "impact": "Impact non déterminé",
                "urgence": "NORMALE"
            }