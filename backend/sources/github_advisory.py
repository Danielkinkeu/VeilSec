# backend/sources/github_advisory.py

import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sources.base import BaseSource
from config import settings


class GitHubAdvisorySource(BaseSource):
    """
    Source GitHub Security Advisories
    Failles dans les packages open source (npm, pip, maven, etc.)
    Gratuite. Token optionnel pour augmenter les limites.
    """

    nom = "github"
    GRAPHQL_URL = "https://api.github.com/graphql"

    # Ecosystèmes surveillés
    ECOSYSTEMS = ["NPM", "PIP", "MAVEN", "COMPOSER", "RUBYGEMS", "RUST", "GO"]

    async def fetch(self) -> List[Dict[Any, Any]]:
        """Utilise l'API GraphQL de GitHub pour récupérer les advisories récents."""

        depuis = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

        query = """
        query($since: DateTime!) {
          securityAdvisories(
            orderBy: {field: PUBLISHED_AT, direction: DESC}
            publishedSince: $since
            first: 50
          ) {
            nodes {
              ghsaId
              summary
              description
              severity
              publishedAt
              references { url }
              cvss { score vectorString }
              cwes(first: 3) { nodes { cweId name } }
              vulnerabilities(first: 5) {
                nodes {
                  package { name ecosystem }
                  vulnerableVersionRange
                  firstPatchedVersion { identifier }
                }
              }
            }
          }
        }
        """

        headers = {
            "Content-Type": "application/json",
        }

        # Ajouter le token si disponible (augmente les limites)
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.GRAPHQL_URL,
                    json={"query": query, "variables": {"since": depuis}},
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()

                if "errors" in data:
                    print(f" [{self.nom}] Erreur GraphQL : {data['errors']}")
                    return []

                nodes = data.get("data", {}).get("securityAdvisories", {}).get("nodes", [])
                return nodes

        except Exception as e:
            print(f" [{self.nom}] Erreur : {e}")
            return []

    def normalize(self, data: Dict[Any, Any]) -> Dict[Any, Any]:
        try:
            ghsa_id = data.get("ghsaId", "")
            if not ghsa_id:
                return None

            # Score CVSS
            score_cvss = None
            cvss = data.get("cvss", {})
            if cvss and cvss.get("score"):
                score_cvss = float(cvss["score"])

            # Criticité depuis severity GitHub ou score CVSS
            severity_map = {
                "CRITICAL": "CRITIQUE",
                "HIGH": "HAUTE",
                "MODERATE": "MOYENNE",
                "LOW": "FAIBLE",
            }
            severity = data.get("severity", "")
            criticite = severity_map.get(severity, self._get_criticite(score_cvss))

            # CWE
            cwe = None
            cwes = data.get("cwes", {}).get("nodes", [])
            if cwes:
                cwe = cwes[0].get("cweId")

            # Systèmes / packages affectés
            systemes = []
            vulns = data.get("vulnerabilities", {}).get("nodes", [])
            for v in vulns:
                pkg = v.get("package", {})
                nom_pkg = pkg.get("name", "")
                ecosystem = pkg.get("ecosystem", "")
                if nom_pkg:
                    systemes.append(f"{ecosystem}/{nom_pkg}".strip("/"))

            # Lien de référence
            refs = data.get("references", [])
            lien = refs[0]["url"] if refs else f"https://github.com/advisories/{ghsa_id}"

            # Date de publication
            date_pub = None
            date_str = data.get("publishedAt", "")
            if date_str:
                try:
                    date_pub = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except:
                    pass

            return {
                "id": ghsa_id,
                "source": self.nom,
                "titre": f"{ghsa_id} — {data.get('summary', 'Advisory GitHub')}",
                "description": data.get("description", data.get("summary", "")),
                "lien": lien,
                "score_cvss": score_cvss,
                "criticite": criticite,
                "systemes": systemes[:10],
                "cwe": cwe,
                "auteur": "GitHub Advisory Database",
                "date_publication": date_pub,
                "actif_exploit": False,
                "nouveau": True,
            }

        except Exception as e:
            print(f"  [{self.nom}] Erreur normalisation : {e}")
            return None