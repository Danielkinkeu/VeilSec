# backend/api/schemas.py

from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


class CVESchema(BaseModel):
    """Format de réponse pour un CVE."""
    id: str
    source: str
    titre: str
    description: Optional[str] = None
    lien: Optional[str] = None
    score_cvss: Optional[float] = None
    criticite: Optional[str] = None
    systemes: Optional[List[str]] = []
    cwe: Optional[str] = None
    auteur: Optional[str] = None
    date_publication: Optional[datetime] = None
    resume_ia: Optional[str] = None
    recommandation_ia: Optional[str] = None
    impact_ia: Optional[str] = None
    urgence_ia: Optional[str] = None
    enrichi: bool = False
    llm_provider: Optional[str] = None
    actif_exploit: bool = False
    nouveau: bool = True
    date_collecte: Optional[datetime] = None

    class Config:
        from_attributes = True


class CVEListResponse(BaseModel):
    """Réponse paginée pour la liste des CVE."""
    total: int
    page: int
    limit: int
    pages: int
    data: List[CVESchema]


class StatsResponse(BaseModel):
    """Statistiques globales du dashboard."""
    total_cve: int
    critiques: int
    hautes: int
    moyennes: int
    faibles: int
    inconnues: int
    enrichis: int
    actifs_exploit: int
    nouveaux_24h: int
    par_source: dict
    par_urgence: dict


class SourceSchema(BaseModel):
    """Format de réponse pour une source."""
    id: int
    nom: str
    actif: bool
    derniere_collecte: Optional[datetime] = None
    nb_cve_total: int
    nb_cve_dernier: int
    statut: str
    erreur: Optional[str] = None

    class Config:
        from_attributes = True