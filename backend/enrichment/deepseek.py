# backend/enrichment/deepseek.py

import httpx
from typing import Dict, Any
from enrichment.base import BaseLLM
from config import settings


class DeepSeekLLM(BaseLLM):
    """
    Adaptateur DeepSeek — IA chinoise haute performance
    Modèle : deepseek-chat (V3) ou deepseek-reasoner (R1)
    Quasi gratuit : $0.27/MTok input, $1.10/MTok output
    Docs : https://platform.deepseek.com/docs
    
    Choix sécurité :
    - On n'envoie jamais de données personnelles
    - Uniquement des données techniques CVE
    - Avertissement utilisateur dans l'interface
    """

    nom = "deepseek"
    BASE_URL = "https://api.deepseek.com/v1/chat/completions"
    MODEL_CHAT = "deepseek-chat"       # V3 — rapide et précis
    MODEL_REASON = "deepseek-reasoner" # R1 — raisonnement profond

    async def enrich(self, cve_data: Dict[Any, Any]) -> Dict[Any, Any]:
        """Enrichissement CVE individuel — utilise deepseek-chat (rapide)"""
        if not settings.DEEPSEEK_API_KEY:
            print("⚠️  DEEPSEEK_API_KEY manquante dans le .env")
            return self._empty_enrichment()

        prompt = self._build_prompt(cve_data)
        return await self._call_api(prompt, model=self.MODEL_CHAT)


    async def analyze_stack(self, stack_data: Dict, cves: list) -> Dict[str, Any]:
        """Analyse complète d'une stack utilisateur avec DeepSeek-R1."""
        if not settings.DEEPSEEK_API_KEY:
            return {"error": "DeepSeek non configuré"}

        prompt = self._build_stack_prompt(stack_data, cves)

        # Appel direct sans passer par _call_api pour éviter la confusion
        payload = {
            "model": self.MODEL_CHAT,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Tu es un expert en cybersécurité offensif et défensif. "
                        "Tu analyses des stacks techniques et leurs vulnérabilités associées. "
                        "Tu réponds UNIQUEMENT avec le JSON demandé, sans texte avant ou après."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": 2000,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                        "Content-Type": "application/json",
                    }
                )
                response.raise_for_status()
                data = response.json()

                text = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )

                print(f"🔍 [deepseek-stack] Texte brut : {text[:200]}")

                parsed = self._parse_response(text)
                print(f"🔍 [deepseek-stack] Clés : {list(parsed.keys())}")

                # Vérifier qu'on a bien le bon format
                if "score_risque_global" in parsed:
                    parsed["llm_provider"] = self.nom
                    return parsed

                # Si DeepSeek a retourné autre chose, forcer une nouvelle tentative
                # avec un prompt encore plus direct
                print(f"⚠️  [deepseek-stack] Mauvais format, nouvelle tentative...")
                return await self._retry_stack_analysis(stack_data, cves)

        except Exception as e:
            print(f"❌ [deepseek-stack] Erreur : {e}")
            return {"error": str(e)}


    async def _retry_stack_analysis(
        self,
        stack_data: Dict,
        cves: list
    ) -> Dict[str, Any]:
        """
        Deuxième tentative avec un prompt ultra simplifié
        si la première échoue.
        """
        cves_summary = "\n".join([
            f"- {c.get('id')} | Score: {c.get('score_cvss', 'N/A')} | {c.get('titre', '')[:60]}"
            for c in cves[:10]
        ])

        stack_str = ", ".join([
            item
            for items in stack_data.values()
            for item in (items if isinstance(items, list) else [items])
            if item
        ])

        prompt = f"""Stack technique : {stack_str}

        Top vulnérabilités ({len(cves)} au total) :
        {cves_summary}

        Réponds avec exactement ce JSON (rien d'autre) :
        {{
        "score_risque_global": 8,
        "niveau_risque": "ÉLEVÉ",
        "resume_exposition": "Résumé en 2-3 phrases",
        "vecteurs_attaque": [
            {{"titre": "Nom", "description": "Description", "cve_associes": ["CVE-XXXX"], "criticite": "CRITIQUE"}}
        ],
        "impact_potentiel": "Ce qu'un attaquant peut faire",
        "recommandations": {{
            "immediat": ["Action 1"],
            "cette_semaine": ["Action 2"],
            "ce_mois": ["Action 3"]
        }},
        "points_positifs": ["Point positif"],
        "avertissement": "Analyse IA, non substituable à un audit professionnel."
        }}"""

        payload = {
            "model": self.MODEL_CHAT,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 1500,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.BASE_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                        "Content-Type": "application/json",
                    }
                )
                response.raise_for_status()
                data = response.json()
                text = (
                    data.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )
                print(f"🔍 [deepseek-retry] Texte : {text[:300]}")
                parsed = self._parse_response(text)
                parsed["llm_provider"] = self.nom
                return parsed
        except Exception as e:
            print(f"❌ [deepseek-retry] Erreur : {e}")
            return {
                "score_risque_global": 0,
                "niveau_risque": "INCONNU",
                "resume_exposition": "Analyse IA temporairement indisponible.",
                   "vecteurs_attaque": [],
                "impact_potentiel": "Non déterminé",
                "recommandations": {
                    "immediat": ["Consulter un expert en sécurité"],
                    "cette_semaine": [],
                    "ce_mois": []
                },
                "points_positifs": [],
                "avertissement": "Analyse IA indisponible.",
               "llm_provider": self.nom,
                "error": str(e)
            }

    async def _call_api(
        self,
        prompt: str,
        model: str,
        max_tokens: int = 500
        ) -> Dict[str, Any]:
            """Appel générique à l'API DeepSeek."""

            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Tu es un expert en cybersécurité. "
                            "Tu analyses des vulnérabilités et fournis "
                            "des recommandations concrètes et précises. "
                            "Tu réponds toujours en JSON valide uniquement."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.1,
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"},
            }

            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        self.BASE_URL,
                        json=payload,
                        headers={
                            "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                            "Content-Type": "application/json",
                        }
                    )
                    response.raise_for_status()
                    data = response.json()

                    text = (
                        data.get("choices", [{}])[0]
                        .get("message", {})
                        .get("content", "")
                    )

                    parsed = self._parse_response(text)


                    # Log pour debug
                    print(f" [deepseek] Réponse reçue : {list(parsed.keys())}")

                    # Enrichissement CVE individuel (contient "resume")
                    if "resume" in parsed:
                        return {
                            "resume_ia": parsed.get("resume", ""),
                            "recommandation_ia": parsed.get("recommandation", ""),
                            "impact_ia": parsed.get("impact", ""),
                            "urgence_ia": parsed.get("urgence", "NORMALE"),
                            "llm_provider": self.nom,
                            "enrichi": True,
                        }

                    # Analyse de stack (contient "score_risque_global")
                    if "score_risque_global" in parsed:
                        parsed["llm_provider"] = self.nom
                        return parsed

                    # Réponse inattendue — on retourne quand même
                    print(f"  [deepseek] Format de réponse inattendu : {parsed}")
                    parsed["llm_provider"] = self.nom
                    return parsed

            except httpx.TimeoutException:
                print(f" [{self.nom}] Timeout — modèle trop lent")
                return self._empty_enrichment()
            except httpx.HTTPStatusError as e:
                print(f" [{self.nom}] Erreur HTTP {e.response.status_code} : {e.response.text}")
                return self._empty_enrichment()
            except Exception as e:
                print(f" [{self.nom}] Erreur : {e}")
                return self._empty_enrichment()

    def _build_stack_prompt(
        self,
        stack: Dict,
        cves: list
    ) -> str:
        """
        Construit le prompt d'analyse de stack.
        
        Sécurité : on ne passe que des informations techniques.
        Jamais d'IP, de noms d'entreprise ou de données personnelles.
        """

        # Résumé des CVE les plus critiques (max 20)
        cves_critiques = sorted(
            cves,
            key=lambda x: x.get("score_cvss") or 0,
            reverse=True
        )[:20]

        cves_summary = "\n".join([
            f"- {c.get('id')} | Score: {c.get('score_cvss', 'N/A')} "
            f"| {c.get('cwe', 'N/A')} | {c.get('titre', '')[:80]}"
            for c in cves_critiques
        ])

        stack_summary = "\n".join([
            f"- {categorie}: {', '.join(items) if isinstance(items, list) else items}"
            for categorie, items in stack.items()
            if items
        ])

        return f"""Analyse cette stack technique et les vulnérabilités associées.

STACK TECHNIQUE DÉCLARÉE :
{stack_summary}

VULNÉRABILITÉS IDENTIFIÉES ({len(cves)} au total) :
{cves_summary}

Réponds UNIQUEMENT avec ce JSON :
{{
  "score_risque_global": <nombre de 0 à 10>,
  "niveau_risque": "<CRITIQUE|ÉLEVÉ|MODÉRÉ|FAIBLE>",
  "resume_exposition": "<2-3 phrases résumant l'exposition globale en français>",
  "vecteurs_attaque": [
    {{
      "titre": "<nom du vecteur>",
      "description": "<explication simple>",
      "cve_associes": ["CVE-XXXX", "CVE-YYYY"],
      "criticite": "<CRITIQUE|HAUTE|MOYENNE|FAIBLE>"
    }}
  ],
  "impact_potentiel": "<ce qu'un attaquant peut faire concrètement>",
  "recommandations": {{
    "immediat": ["<action 1>", "<action 2>"],
    "cette_semaine": ["<action 1>", "<action 2>"],
    "ce_mois": ["<action 1>", "<action 2>"]
  }},
  "points_positifs": ["<ce qui est bien dans cette stack>"],
  "avertissement": "Cette analyse est générée par IA et ne remplace pas un audit professionnel."
}}"""

    def _empty_enrichment(self) -> Dict[str, Any]:
        return {
            "resume_ia": None,
            "recommandation_ia": None,
            "impact_ia": None,
            "urgence_ia": None,
            "llm_provider": None,
            "enrichi": False,
        }