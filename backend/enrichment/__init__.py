# backend/enrichment/__init__.py

from config import settings


def get_llm():
    """
    Retourne l'adaptateur IA selon la config .env
    LLM_PROVIDER = deepseek | gemini | groq | claude
    """
    provider = settings.LLM_PROVIDER.lower()

    if provider == "deepseek":
        from enrichment.deepseek import DeepSeekLLM
        return DeepSeekLLM()

    elif provider == "gemini":
        from enrichment.gemini import GeminiLLM
        return GeminiLLM()

    elif provider == "groq":
        from enrichment.groq import GroqLLM
        return GroqLLM()

    elif provider == "claude":
        from enrichment.claude import ClaudeLLM
        return ClaudeLLM()

    else:
        print(f" Provider '{provider}' inconnu — Groq utilisé par défaut")
        from enrichment.groq import GroqLLM
        return GroqLLM()


def get_deepseek():
    """
    Retourne toujours DeepSeek — utilisé spécifiquement
    pour l'analyse de stack (indépendant du provider par défaut).
    """
    from enrichment.deepseek import DeepSeekLLM
    return DeepSeekLLM()