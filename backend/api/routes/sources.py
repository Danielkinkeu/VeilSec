# backend/api/routes/sources.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from database.models import Source
from api.schemas import SourceSchema
from collectors.scheduler import task_nvd, task_cisa, task_github, task_exploitdb

router = APIRouter(prefix="/api/sources", tags=["Sources"])


@router.get("", response_model=List[SourceSchema])
async def get_sources(db: Session = Depends(get_db)):
    """
    Retourne l'état de toutes les sources de données.
    """
    sources = db.query(Source).all()
    return sources


@router.post("/{nom}/trigger")
async def trigger_source(nom: str):
    """
    Déclenche manuellement une collecte pour une source.
    Utile pour forcer une mise à jour depuis le dashboard.
    """
    sources_disponibles = {
        "nvd": task_nvd,
         "cisa":     task_cisa,
        "github":   task_github,
        "exploitdb": task_exploitdb,
    }

    if nom not in sources_disponibles:
        raise HTTPException(
            status_code=404,
            detail=f"Source '{nom}' inconnue. Disponibles : {list(sources_disponibles.keys())}"
        )

    # Lancer la collecte en arrière-plan
    import asyncio
    asyncio.create_task(sources_disponibles[nom]())

    return {
        "message": f"Collecte '{nom}' déclenchée",
        "source": nom
    }