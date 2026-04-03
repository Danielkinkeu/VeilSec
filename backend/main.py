# backend/main.py

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database.db import init_db
from collectors.scheduler import setup_scheduler, stop_scheduler


async def delayed_collections():
    """
    Lance toutes les collectes initiales après un délai de sécurité.
    
    Le délai de 30 secondes permet à Render de détecter le port ouvert
    et de valider que le service est bien démarré avant de lancer
    les collectes réseau qui peuvent être longues.
    
    Tourne entièrement en arrière-plan via asyncio.create_task()
    — ne bloque jamais le démarrage du serveur.
    """
    from collectors.scheduler import (
        task_nvd, task_cisa, task_github, task_exploitdb
    )

    # Attendre que Render détecte le port avant de lancer les collectes
    print("⏳ Attente de 30s avant les collectes initiales...")
    await asyncio.sleep(30)

    print("🚀 Démarrage des collectes initiales en arrière-plan...")
    await task_nvd()
    await task_cisa()
    await task_github()
    await task_exploitdb()
    print("✅ Toutes les collectes initiales terminées")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gère le cycle de vie de l'application FastAPI.
    
    Séquence au démarrage :
    1. Initialisation de la base de données
    2. Démarrage du scheduler de collecte automatique
    3. Lancement des collectes initiales en arrière-plan (après délai)
    
    Séquence à l'arrêt :
    1. Arrêt propre du scheduler
    
    Justification du délai :
    Sur Render (et autres PaaS), le service doit répondre sur le port
    configuré rapidement après le démarrage. Les collectes réseau
    (NVD, CISA, GitHub...) peuvent prendre 30-60 secondes et bloquer
    la détection du port si lancées immédiatement.
    """
    print(f"""
╔══════════════════════════════════════╗
║         🛡️  VeilSec v{settings.VERSION}            ║
║    Vulnerability Intelligence Hub    ║
╚══════════════════════════════════════╝
    """)

    # 1. Initialiser la base de données
    # Crée les tables si elles n'existent pas déjà
    init_db()

    # 2. Démarrer le scheduler de collecte automatique
    # Configure les tâches périodiques (NVD/6h, CISA/12h, etc.)
    setup_scheduler()

    # 3. Lancer les collectes initiales en arrière-plan avec délai
    # create_task() retourne immédiatement — le serveur est disponible
    # pendant que les collectes tournent en parallèle
    asyncio.create_task(delayed_collections())

    print("🟢 Serveur prêt et disponible — collectes programmées dans 30s")

    yield  # Le serveur tourne ici jusqu'à l'arrêt

    # Arrêt propre du scheduler
    stop_scheduler()
    print("👋 VeilSec arrêté proprement")


# ─── Création de l'application FastAPI ────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AI-powered vulnerability intelligence dashboard. "
        "Agrège les CVE depuis NVD, CISA, GitHub Advisory et Exploit-DB, "
        "les enrichit via IA et les présente dans un dashboard interactif."
    ),
    lifespan=lifespan,
)

# ─── Configuration CORS ────────────────────────────────────────────
# Autorise les requêtes depuis le frontend Vercel et le développement local
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",        # Développement local Vite
        "http://localhost:3000",        # Développement local alternatif
        "https://veil-sec.vercel.app",  # Production Vercel
        "https://veilsec.vercel.app",   # Production Vercel (variante)
        "https://*.vercel.app",         # Previews Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Enregistrement des routes ─────────────────────────────────────
from api.routes import cve, stats, sources, analyze

app.include_router(cve.router)       # GET /api/cves, GET /api/cves/:id
app.include_router(stats.router)     # GET /api/stats, GET /api/stats/evolution
app.include_router(sources.router)   # GET /api/sources, POST /api/sources/:nom/trigger
app.include_router(analyze.router)   # POST /api/analyze/stack


# ─── Routes utilitaires ────────────────────────────────────────────

@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    """
    Route de santé — utilisée par Render et UptimeRobot.
    
    Supporte GET et HEAD :
    - GET  : retourne le statut JSON complet
    - HEAD : retourne uniquement les headers (UptimeRobot)
    
    Justification HEAD : UptimeRobot envoie des requêtes HEAD par défaut.
    Sans cette méthode, le monitoring retournait 405 Method Not Allowed.
    """
    return JSONResponse({
        "status": "ok",
        "projet": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
    })


@app.get("/")
async def root():
    """
    Route racine — point d'entrée de l'API.
    Retourne les liens utiles pour la navigation.
    """
    return {
        "message": f"Bienvenue sur {settings.PROJECT_NAME} v{settings.VERSION}",
        "documentation": "/docs",
        "health": "/health",
        "api": {
            "cves": "/api/cves",
            "stats": "/api/stats",
            "sources": "/api/sources",
            "analyze": "/api/analyze/stack",
        }
    }