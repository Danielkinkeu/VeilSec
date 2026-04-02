# backend/database/models.py

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from sqlalchemy.sql import func
from database.db import Base, engine



# Détecter le type de base pour choisir le bon type JSON
def get_json_type():
    if "postgresql" in str(engine.url):
        return JSONB  # plus performant sur PostgreSQL
    return SQLiteJSON


JsonType = get_json_type() 


class CVE(Base):
    """
    Table principale — stocke chaque vulnérabilité collectée et enrichie.
    """
    __tablename__ = "cves"

    # Identifiants
    id          = Column(String, primary_key=True)
    source      = Column(String, nullable=False)

    # Informations de base
    titre       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    lien        = Column(String, nullable=True)

    # Scoring
    score_cvss  = Column(Float, nullable=True)
    criticite   = Column(String, nullable=True)

    # Cibles
    systemes    = Column(JsonType, nullable=True)
    cwe         = Column(String, nullable=True)

    # Contexte
    auteur      = Column(String, nullable=True)
    date_publication = Column(DateTime(timezone=True), nullable=True)

    # Enrichissement IA
    resume_ia         = Column(Text, nullable=True)
    recommandation_ia = Column(Text, nullable=True)
    impact_ia         = Column(Text, nullable=True)
    urgence_ia        = Column(String, nullable=True)
    enrichi           = Column(Boolean, default=False)
    llm_provider      = Column(String, nullable=True)

    # Statut
    actif_exploit = Column(Boolean, default=False)
    nouveau       = Column(Boolean, default=True)

    # Timestamps
    date_collecte = Column(DateTime(timezone=True), server_default=func.now())
    date_maj      = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CVE {self.id} | {self.criticite} | {self.source}>"

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "titre": self.titre,
            "description": self.description,
            "lien": self.lien,
            "score_cvss": self.score_cvss,
            "criticite": self.criticite,
            "systemes": self.systemes or [],
            "cwe": self.cwe,
            "auteur": self.auteur,
            "date_publication": self.date_publication.isoformat() if self.date_publication else None,
            "resume_ia": self.resume_ia,
            "recommandation_ia": self.recommandation_ia,
            "impact_ia": self.impact_ia,
            "urgence_ia": self.urgence_ia,
            "enrichi": self.enrichi,
            "llm_provider": self.llm_provider,
            "actif_exploit": self.actif_exploit,
            "nouveau": self.nouveau,
            "date_collecte": self.date_collecte.isoformat() if self.date_collecte else None,
        }


class Source(Base):
    """
    Table de suivi des sources — enregistre chaque collecte effectuée.
    Permet de savoir quand une source a été interrogée pour la dernière fois.
    """
    __tablename__ = "sources"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    nom               = Column(String, unique=True, nullable=False)
    actif             = Column(Boolean, default=True)
    derniere_collecte = Column(DateTime(timezone=True), nullable=True)
    nb_cve_total      = Column(Integer, default=0)
    nb_cve_dernier    = Column(Integer, default=0)
    statut            = Column(String, default="idle")
    erreur            = Column(Text, nullable=True)

    def __repr__(self):
        return f"<Source {self.nom} | {self.statut}>"