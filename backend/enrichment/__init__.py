# backend/enrichment/__init__.py

from config import settings


def get_llm():
    """
    Retourne l'adaptateur IA selon la config .env
    LLM_PROVIDER = gemini | groq | claude
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "gemini":
        from enrichment.gemini import GeminiLLM
        return GeminiLLM()

    elif provider == "groq":
        from enrichment.groq import GroqLLM
        return GroqLLM()

    elif provider == "claude":
        from enrichment.claude import ClaudeLLM
        return ClaudeLLM()

    else:
        print(f"  Provider '{provider}' inconnu — Gemini utilisé par défaut")
        from enrichment.gemini import GeminiLLM
        return GeminiLLM()