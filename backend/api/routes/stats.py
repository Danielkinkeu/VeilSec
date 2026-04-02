# backend/api/routes/stats.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database.db import get_db
from database.models import CVE
from api.schemas import StatsResponse

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])


@router.get("", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """
    Retourne les statistiques globales pour le dashboard.
    """
    # Comptages par criticité
    total       = db.query(CVE).count()
    critiques   = db.query(CVE).filter(CVE.criticite == "CRITIQUE").count()
    hautes      = db.query(CVE).filter(CVE.criticite == "HAUTE").count()
    moyennes    = db.query(CVE).filter(CVE.criticite == "MOYENNE").count()
    faibles     = db.query(CVE).filter(CVE.criticite == "FAIBLE").count()
    inconnues   = db.query(CVE).filter(CVE.criticite == "INCONNUE").count()
    enrichis    = db.query(CVE).filter(CVE.enrichi == True).count()
    actifs      = db.query(CVE).filter(CVE.actif_exploit == True).count()

    # Nouveaux dans les dernières 24h
    hier = datetime.utcnow() - timedelta(hours=24)
    nouveaux_24h = db.query(CVE).filter(CVE.date_collecte >= hier).count()

    # Répartition par source
    sources_raw = db.query(
        CVE.source,
        func.count(CVE.id).label("count")
    ).group_by(CVE.source).all()
    par_source = {s.source: s.count for s in sources_raw}

    # Répartition par urgence IA
    urgences_raw = db.query(
        CVE.urgence_ia,
        func.count(CVE.id).label("count")
    ).filter(CVE.urgence_ia != None).group_by(CVE.urgence_ia).all()
    par_urgence = {u.urgence_ia: u.count for u in urgences_raw}

    return StatsResponse(
        total_cve=total,
        critiques=critiques,
        hautes=hautes,
        moyennes=moyennes,
        faibles=faibles,
        inconnues=inconnues,
        enrichis=enrichis,
        actifs_exploit=actifs,
        nouveaux_24h=nouveaux_24h,
        par_source=par_source,
        par_urgence=par_urgence,
    )


@router.get("/evolution")
async def get_evolution(
    jours: int = 7,
    db: Session = Depends(get_db)
):
    """
    Retourne l'évolution du nombre de CVE par jour sur X jours.
    Utile pour le graphique de tendance du dashboard.
    """
    resultats = []

    for i in range(jours - 1, -1, -1):
        date = datetime.utcnow() - timedelta(days=i)
        debut = date.replace(hour=0, minute=0, second=0, microsecond=0)
        fin = date.replace(hour=23, minute=59, second=59)

        count = db.query(CVE).filter(
            CVE.date_collecte >= debut,
            CVE.date_collecte <= fin
        ).count()

        critiques = db.query(CVE).filter(
            CVE.date_collecte >= debut,
            CVE.date_collecte <= fin,
            CVE.criticite == "CRITIQUE"
        ).count()

        resultats.append({
            "date": debut.strftime("%Y-%m-%d"),
            "total": count,
            "critiques": critiques,
        })

    return {"evolution": resultats, "jours": jours}