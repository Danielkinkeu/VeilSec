# backend/enrichment/groq.py

import httpx
from typing import Dict, Any
from enrichment.base import BaseLLM
from config import settings


class GroqLLM(BaseLLM):
    """
    Adaptateur Groq — Ultra rapide, gratuit
    Modèle : llama-3.3-70b-versatile
    Docs : https://console.groq.com/
    """

    nom = "groq"
    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
    MODEL = "llama-3.3-70b-versatile"

    async def enrich(self, cve_data: Dict[Any, Any]) -> Dict[Any, Any]:
        if not settings.GROQ_API_KEY:
            print("  GROQ_API_KEY manquante dans le .env")
            return self._empty_enrichment()

        prompt = self._build_prompt(cve_data)

        payload = {
            "model": self.MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 500,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
                )
                response.raise_for_status()
                data = response.json()

                text = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
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