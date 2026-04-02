# backend/sources/nvd.py

import httpx
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sources.base import BaseSource
from config import settings


class NVDSource(BaseSource):
    """
    Source NVD (National Vulnerability Database) — NIST
    API officielle : https://nvd.nist.gov/developers/vulnerabilities
    Gratuite, sans clé API requise (mais limitée à 5 req/30s sans clé)
    """

    nom = "nvd"
    BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

    async def fetch(self) -> List[Dict[Any, Any]]:
        """
        Récupère les CVE publiés dans les dernières X heures depuis NVD.
        """
        # Calcul de la fenêtre temporelle
        maintenant = datetime.now(timezone.utc)
        debut = maintenant - timedelta(days=settings.NVD_DAYS_BACK)

        # Format attendu par l'API NVD
        date_format = "%Y-%m-%dT%H:%M:%S.000"
        params = {
            "pubStartDate": debut.strftime(date_format),
            "pubEndDate": maintenant.strftime(date_format),
            "resultsPerPage": settings.MAX_CVE_PER_RUN,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()
                # L'API NVD retourne les CVE dans "vulnerabilities"
                return data.get("vulnerabilities", [])

        except httpx.TimeoutException:
            print(f" [{self.nom}] Timeout — NVD met trop de temps à répondre")
            return []
        except httpx.HTTPStatusError as e:
            print(f" [{self.nom}] Erreur HTTP {e.response.status_code}")
            return []
        except Exception as e:
            print(f" [{self.nom}] Erreur inattendue : {e}")
            return []

    def normalize(self, data: Dict[Any, Any]) -> Dict[Any, Any]:
        """
        Traduit un CVE brut NVD vers le format universel VeilSec.
        """
        try:
            cve = data.get("cve", {})

            # === Identifiant ===
            cve_id = cve.get("id", "")
            if not cve_id:
                return None

            # === Description (on prend la version anglaise) ===
            descriptions = cve.get("descriptions", [])
            description = next(
                (d["value"] for d in descriptions if d.get("lang") == "en"),
                "Aucune description disponible"
            )

            # === Score CVSS (on privilégie v3.1, sinon v3.0, sinon v2) ===
            score_cvss = None
            metrics = cve.get("metrics", {})

            if "cvssMetricV31" in metrics:
                score_cvss = metrics["cvssMetricV31"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV30" in metrics:
                score_cvss = metrics["cvssMetricV30"][0]["cvssData"]["baseScore"]
            elif "cvssMetricV2" in metrics:
                score_cvss = metrics["cvssMetricV2"][0]["cvssData"]["baseScore"]

            # === CWE (type de vulnérabilité) ===
            cwe = None
            weaknesses = cve.get("weaknesses", [])
            if weaknesses:
                descriptions_cwe = weaknesses[0].get("description", [])
                if descriptions_cwe:
                    cwe = descriptions_cwe[0].get("value", None)

            # === Systèmes affectés (CPE) ===
            systemes = []
            configurations = cve.get("configurations", [])
            for config in configurations:
                for node in config.get("nodes", []):
                    for cpe_match in node.get("cpeMatch", []):
                        cpe = cpe_match.get("criteria", "")
                        # Format CPE : cpe:2.3:a:vendor:product:version...
                        parts = cpe.split(":")
                        if len(parts) >= 5:
                            vendor = parts[3].replace("_", " ").title()
                            product = parts[4].replace("_", " ").title()
                            systeme = f"{vendor} {product}".strip()
                            if systeme and systeme not in systemes:
                                systemes.append(systeme)

            # Limiter à 10 systèmes max pour ne pas surcharger
            systemes = systemes[:10]

            # === Date de publication ===
            date_pub = None
            date_str = cve.get("published", None)
            if date_str:
                try:
                    date_pub = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except:
                    pass

            # === Titre (on génère depuis l'ID + CWE si pas de titre officiel) ===
            titre = f"{cve_id}"
            if cwe:
                titre += f" — {cwe}"

            # === Format universel VeilSec ===
            return {
                "id": cve_id,
                "source": self.nom,
                "titre": titre,
                "description": description,
                "lien": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                "score_cvss": score_cvss,
                "criticite": self._get_criticite(score_cvss),
                "systemes": systemes,
                "cwe": cwe,
                "auteur": "NVD/NIST",
                "date_publication": date_pub,
                "actif_exploit": False,  # NVD ne le précise pas, CISA le fera
                "nouveau": True,
            }

        except Exception as e:
            print(f"  [{self.nom}] Erreur lors de la normalisation : {e}")
            return None