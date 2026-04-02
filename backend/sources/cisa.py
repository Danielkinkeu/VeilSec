# backend/sources/cisa.py

import httpx
from datetime import datetime
from typing import List, Dict, Any
from sources.base import BaseSource


class CISASource(BaseSource):
    """
    Source CISA KEV (Known Exploited Vulnerabilities)
    Catalogue officiel des vulnérabilités activement exploitées.
    Gratuite, sans clé API.
    URL : https://www.cisa.gov/known-exploited-vulnerabilities-catalog
    """

    nom = "cisa"
    URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    async def fetch(self) -> List[Dict[Any, Any]]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.URL)
                response.raise_for_status()
                data = response.json()
                vulnerabilities = data.get("vulnerabilities", [])
                print(f" [{self.nom}] {len(vulnerabilities)} entrées dans le catalogue KEV")
                return vulnerabilities

        except httpx.TimeoutException:
            print(f" [{self.nom}] Timeout")
            return []
        except Exception as e:
            print(f" [{self.nom}] Erreur : {e}")
            return []

    def normalize(self, data: Dict[Any, Any]) -> Dict[Any, Any]:
        try:
            cve_id = data.get("cveID", "")
            if not cve_id:
                return None

            # Date d'ajout au catalogue CISA
            date_pub = None
            date_str = data.get("dateAdded", None)
            if date_str:
                try:
                    date_pub = datetime.strptime(date_str, "%Y-%m-%d")
                except:
                    pass

            # Date limite de remediation imposée par CISA
            due_date = data.get("dueDate", None)

            titre = f"{cve_id} — {data.get('vulnerabilityName', 'Vulnérabilité exploitée')}"

            description = (
                f"{data.get('shortDescription', '')} "
                f"[Action requise : {data.get('requiredAction', 'Voir advisory CISA')}]"
            ).strip()

            return {
                "id": cve_id,
                "source": self.nom,
                "titre": titre,
                "description": description,
                "lien": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                "score_cvss": None,  # CISA ne fournit pas le score
                "criticite": "CRITIQUE",  # tout CVE dans KEV est critique par définition
                "systemes": [data.get("product", ""), data.get("vendorProject", "")],
                "cwe": None,
                "auteur": data.get("vendorProject", "CISA"),
                "date_publication": date_pub,
                "actif_exploit": True,  # c'est la définition même du catalogue KEV
                "nouveau": True,
                "due_date": due_date,
            }

        except Exception as e:
            print(f"  [{self.nom}] Erreur normalisation : {e}")
            return None