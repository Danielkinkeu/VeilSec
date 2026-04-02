# backend/database/models.py

from sqlalchemy import Column, String, Float, Integer, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from database.db import Base


class CVE(Base):
    """
    Table principale — stocke chaque vulnérabilité collectée et enrichie.
    """
    __tablename__ = "cves"

    # === Identifiants ===
    id          = Column(String, primary_key=True)   # ex: CVE-2024-1234
    source      = Column(String, nullable=False)      # nvd | cisa | github | exploitdb

    # === Informations de base ===
    titre       = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    lien        = Column(String, nullable=True)

    # === Scoring ===
    score_cvss  = Column(Float, nullable=True)       # 0.0 à 10.0
    criticite   = Column(String, nullable=True)      # CRITIQUE | HAUTE | MOYENNE | FAIBLE

    # === Cibles ===
    systemes    = Column(JSON, nullable=True)        # ["Windows", "Apache", "Linux"]
    cwe         = Column(String, nullable=True)      # ex: CWE-79 (type de faille)

    # === Contexte ===
    auteur      = Column(String, nullable=True)      # chercheur ou organisation
    date_publication = Column(DateTime, nullable=True)

    # === Enrichissement IA ===
    resume_ia         = Column(Text, nullable=True)   # résumé généré par l'IA
    recommandation_ia = Column(Text, nullable=True)   # mitigation suggérée par l'IA
    impact_ia   = Column(Text, nullable=True)    # ce que l'attaquant peut faire
    urgence_ia  = Column(String, nullable=True)  # IMMEDIATE | HAUTE | NORMALE | FAIBLE
    enrichi           = Column(Boolean, default=False) # a-t-il été traité par l'IA ?
    llm_provider      = Column(String, nullable=True)  # quel modèle a enrichi ce CVE

    # === Statut ===
    actif_exploit = Column(Boolean, default=False)   # exploité activement (CISA KEV)
    nouveau       = Column(Boolean, default=True)    # apparu dans la dernière collecte

    # === Timestamps ===
    date_collecte = Column(DateTime, server_default=func.now())
    date_maj      = Column(DateTime, onupdate=func.now())

    def __repr__(self):
        return f"<CVE {self.id} | {self.criticite} | {self.source}>"

    def to_dict(self):
        """Convertit le modèle en dictionnaire pour l'API."""
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

    id            = Column(Integer, primary_key=True, autoincrement=True)
    nom           = Column(String, unique=True, nullable=False)  # nvd | cisa | github | exploitdb
    actif         = Column(Boolean, default=True)
    derniere_collecte = Column(DateTime, nullable=True)
    nb_cve_total  = Column(Integer, default=0)    # total collecté depuis le début
    nb_cve_dernier = Column(Integer, default=0)   # collecté lors de la dernière exécution
    statut        = Column(String, default="idle") # idle | running | success | error
    erreur        = Column(Text, nullable=True)    # message d'erreur si échec

    def __repr__(self):
        return f"<Source {self.nom} | {self.statut}>"