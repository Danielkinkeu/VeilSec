# backend/database/db.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# PostgreSQL ne nécessite pas check_same_thread
engine = create_engine(
    settings.DATABASE_URL,
    # connect_args seulement pour SQLite
    connect_args={"check_same_thread": False}
    if "sqlite" in settings.DATABASE_URL else {}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from database import models
    Base.metadata.create_all(bind=engine)
    print(" Base de données initialisée")