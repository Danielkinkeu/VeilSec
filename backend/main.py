# backend/main.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.db import init_db
from collectors.scheduler import (
    setup_scheduler, stop_scheduler,
    task_nvd, task_cisa, task_github, task_exploitdb
)
from api.routes import cve, stats, sources
import asyncio


async def run_initial_collections():
    """
    Lance toutes les collectes initiales en séquence.
    Tourne entièrement en arrière-plan — ne bloque pas le serveur.
    """
    print(" Collectes initiales en arrière-plan...")
    await task_nvd()
    await task_cisa()
    await task_github()
    await task_exploitdb()
    print(" Toutes les collectes initiales terminées")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gère le cycle de vie de l'application :
    - Au démarrage : init DB + lancer le scheduler + première collecte
    - À l'arrêt : stopper le scheduler proprement
    """
    print(f"""
╔══════════════════════════════════════╗
║           VeilSec v{settings.VERSION}            ║
║    Vulnerability Intelligence Hub    ║
╚══════════════════════════════════════╝
    """)

    # 1. Initialiser la base de données
    init_db()

    # 2. Démarrer le scheduler
    setup_scheduler()

    # 3. Lancer les collectes initiales EN ARRIÈRE-PLAN
    # create_task() retourne immédiatement — le serveur démarre sans attendre
    asyncio.create_task(run_initial_collections())

    print("🚀 Serveur prêt — collectes en cours en arrière-plan")

    yield  # L'application tourne ici

    # À l'arrêt
    stop_scheduler()
    print(" VeilSec arrêté proprement")


# Création de l'application FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered vulnerability intelligence dashboard",
    lifespan=lifespan,
)

app.include_router(cve.router)
app.include_router(stats.router)
app.include_router(sources.router)


# CORS — permet au frontend React de communiquer avec le backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://veilsec.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Route de santé — pour vérifier que le backend tourne
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "projet": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
    }


# Route de test rapide
@app.get("/")
async def root():
    return {
        "message": f"Bienvenue sur {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health",
    }