# backend/api/routes/cve.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from database.db import get_db
from database.models import CVE
from api.schemas import CVESchema, CVEListResponse

router = APIRouter(prefix="/api/cves", tags=["CVE"])


@router.get("", response_model=CVEListResponse)
async def get_cves(
    # Filtres
    criticite: Optional[str] = Query(None, description="CRITIQUE|HAUTE|MOYENNE|FAIBLE|INCONNUE"),
    source: Optional[str] = Query(None, description="nvd|cisa|github|exploitdb"),
    enrichi: Optional[bool] = Query(None, description="true|false"),
    actif_exploit: Optional[bool] = Query(None, description="true|false"),
    nouveau: Optional[bool] = Query(None, description="true|false"),
    search: Optional[str] = Query(None, description="Recherche dans l'ID et la description"),
    # Pagination
    page: int = Query(1, ge=1, description="Numéro de page"),
    limit: int = Query(20, ge=1, le=100, description="Résultats par page"),
    # Tri
    sort_by: str = Query("date_collecte", description="date_collecte|score_cvss|criticite"),
    order: str = Query("desc", description="asc|desc"),
    db: Session = Depends(get_db)
):
    """
    Retourne la liste paginée des CVE avec filtres.
    """
    query = db.query(CVE)

    # --- Filtres ---
    if criticite:
        query = query.filter(CVE.criticite == criticite.upper())
    if source:
        query = query.filter(CVE.source == source.lower())
    if enrichi is not None:
        query = query.filter(CVE.enrichi == enrichi)
    if actif_exploit is not None:
        query = query.filter(CVE.actif_exploit == actif_exploit)
    if nouveau is not None:
        query = query.filter(CVE.nouveau == nouveau)
    if search:
        query = query.filter(
            CVE.id.ilike(f"%{search}%") |
            CVE.description.ilike(f"%{search}%") |
            CVE.titre.ilike(f"%{search}%")
        )

    # --- Tri ---
    sort_column = getattr(CVE, sort_by, CVE.date_collecte)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # --- Pagination ---
    total = query.count()
    pages = math.ceil(total / limit)
    offset = (page - 1) * limit
    cves = query.offset(offset).limit(limit).all()

    return CVEListResponse(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        data=cves
    )


@router.get("/{cve_id}", response_model=CVESchema)
async def get_cve(cve_id: str, db: Session = Depends(get_db)):
    """
    Retourne le détail d'un CVE par son ID.
    """
    cve = db.query(CVE).filter(CVE.id == cve_id).first()
    if not cve:
        raise HTTPException(status_code=404, detail=f"CVE {cve_id} non trouvé")
    return cve


@router.get("/critiques/actifs", response_model=CVEListResponse)
async def get_critiques_actifs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Raccourci — retourne les CVE critiques activement exploités.
    Utile pour la section alertes du dashboard.
    """
    query = db.query(CVE).filter(
        CVE.criticite == "CRITIQUE",
        CVE.actif_exploit == True
    ).order_by(CVE.date_collecte.desc())

    total = query.count()
    cves = query.limit(limit).all()

    return CVEListResponse(
        total=total,
        page=1,
        limit=limit,
        pages=1,
        data=cves
    )