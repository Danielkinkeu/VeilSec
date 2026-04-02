# backend/enrichment/claude.py

import httpx
from typing import Dict, Any
from enrichment.base import BaseLLM
from config import settings


class ClaudeLLM(BaseLLM):
    """
    Adaptateur Claude — Anthropic (optionnel, payant)
    Modèle : claude-haiku-4-5-20251001 (le moins cher)
    """

    nom = "claude"
    BASE_URL = "https://api.anthropic.com/v1/messages"
    MODEL = "claude-haiku-4-5-20251001"

    async def enrich(self, cve_data: Dict[Any, Any]) -> Dict[Any, Any]:
        if not settings.ANTHROPIC_API_KEY:
            print("  ANTHROPIC_API_KEY manquante dans le .env")
            return self._empty_enrichment()

        prompt = self._build_prompt(cve_data)

        payload = {
            "model": self.MODEL,
            "max_tokens": 500,
            "messages": [{"role": "user", "content": prompt}]
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={
                        "x-api-key": settings.ANTHROPIC_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    }
                )
                response.raise_for_status()
                data = response.json()

                text = (
                    data.get("content", [{}])[0]
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

        except Exception as e:
            print(f" [{self.nom}] Erreur : {e}")
            return self._empty_enrichment()

    def _empty_enrichment(self) -> Dict[str, Any]:
        return {
            "resume_ia": None,
            "recommandation_ia": None,
            "impact_ia": None,
            "urgence_ia": None,
            "llm_provider": None,
            "enrichi": False,
        }