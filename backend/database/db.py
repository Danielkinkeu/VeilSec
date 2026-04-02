# backend/database/db.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Création du moteur de base de données
engine = create_engine(
    settings.DATABASE_URL,
    # Nécessaire uniquement pour SQLite (pas thread-safe par défaut)
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# Session factory — utilisée pour toutes les opérations en base
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Classe de base dont hériteront tous les modèles
Base = declarative_base()


def get_db():
    """
    Générateur de session — utilisé comme dépendance dans FastAPI.
    Garantit que la session est toujours fermée après usage.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Crée toutes les tables en base de données au démarrage.
    Si les tables existent déjà, elles ne sont pas recréées.
    """
    from database import models  # import ici pour éviter les imports circulaires
    Base.metadata.create_all(bind=engine)
    print(" Base de données initialisée")