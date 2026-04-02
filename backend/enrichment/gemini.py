# backend/enrichment/gemini.py

import httpx
import asyncio
from typing import Dict, Any
from enrichment.base import BaseLLM
from config import settings


class GeminiLLM(BaseLLM):
    """
    Adaptateur Gemini — Google AI Studio
    Gratuit : 15 req/min, 1500 req/jour
    Docs : https://ai.google.dev/
    """

    nom = "gemini"
    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
    MODEL = "gemini-2.0-flash"

    async def enrich(self, cve_data: Dict[Any, Any]) -> Dict[Any, Any]:
        """
        Enrichit un CVE via l'API Gemini.
        """
        if not settings.GEMINI_API_KEY:
            print("  GEMINI_API_KEY manquante dans le .env")
            return self._empty_enrichment()

        prompt = self._build_prompt(cve_data)
        url = f"{self.BASE_URL}/{self.MODEL}:generateContent"

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,      # réponses plus déterministes
                "maxOutputTokens": 500,  # on n'a pas besoin de plus
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    params={"key": settings.GEMINI_API_KEY}
                )
                response.raise_for_status()
                data = response.json()

                # Extraire le texte de la réponse Gemini
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )

                parsed = self._parse_response(text)

                return {
                    "resume_ia": parsed.get("resume", ""),
                    "recommandation_ia": parsed.get("recommandation", ""),
                    "impact_ia": parsed.get("impact", ""),
                    "urgence_ia": parsed.get("urgence", "NORMALE"),
                    "llm_provider": self.nom,
                    "enrichi": True,
                }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                print(f"  [{self.nom}] Rate limit atteint — pause 60s")
                await asyncio.sleep(60)
            else:
                print(f" [{self.nom}] Erreur HTTP {e.response.status_code}")
            return self._empty_enrichment()

        except Exception as e:
            print(f" [{self.nom}] Erreur : {e}")
            return self._empty_enrichment()

    def _empty_enrichment(self) -> Dict[str, Any]:
        """Retourne un enrichissement vide en cas d'erreur."""
        return {
            "resume_ia": None,
            "recommandation_ia": None,
            "impact_ia": None,
            "urgence_ia": None,
            "llm_provider": None,
            "enrichi": False,
        }