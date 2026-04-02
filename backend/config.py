# backend/config.py

from dotenv import load_dotenv
import os

load_dotenv()

class Settings:

    # === Projet ===
    PROJECT_NAME: str = "VeilSec"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # === Base de données ===
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./veilsec.db")

    # === IA Provider ===
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini | groq | claude

    # === Clés API IA ===
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    # === Clés API Sources ===
    GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")  # optionnel, augmente les limites

    # === Intervalles de collecte (heures) ===
    NVD_INTERVAL_HOURS: int = int(os.getenv("NVD_INTERVAL_HOURS", "6"))
    CISA_INTERVAL_HOURS: int = int(os.getenv("CISA_INTERVAL_HOURS", "12"))
    GITHUB_INTERVAL_HOURS: int = int(os.getenv("GITHUB_INTERVAL_HOURS", "6"))
    EXPLOITDB_INTERVAL_HOURS: int = int(os.getenv("EXPLOITDB_INTERVAL_HOURS", "2"))

    # === Paramètres de collecte ===
    NVD_DAYS_BACK: int = int(os.getenv("NVD_DAYS_BACK", "1"))  # CVE des dernières X jours
    MAX_CVE_PER_RUN: int = int(os.getenv("MAX_CVE_PER_RUN", "100"))  # limite par collecte

# Instance globale — on importe ça partout dans le projet
settings = Settings()