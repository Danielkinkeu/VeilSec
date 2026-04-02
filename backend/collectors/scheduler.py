# backend/collectors/scheduler.py

import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import settings
from sources.nvd import NVDSource
from normalizer.pipeline import NormalizerPipeline, NormalizerPipeline as Pipeline

from sources.cisa import CISASource
from sources.github_advisory import GitHubAdvisorySource
from sources.exploitdb import ExploitDBSource


# Instance globale du scheduler
scheduler = AsyncIOScheduler()


async def run_source(source, pipeline: NormalizerPipeline):
    """
    Exécute le cycle complet pour une source :
    collecte → normalisation → pipeline → enrichissement
    """
    nom = source.nom

    # Marquer la source comme en cours
    Pipeline.update_source_status(nom, statut="running")

    try:
        # 1. Collecter et normaliser
        normalized_data = await source.collect()

        if not normalized_data:
            print(f"  [{nom}] Aucune donnée collectée")
            Pipeline.update_source_status(nom, statut="success", nb_cve=0)
            return

        # 2. Passer dans le pipeline (validation + déduplication + sauvegarde)
        stats = pipeline.process(normalized_data)
        nouveaux = stats.get("nouveaux", 0)

        # 3. Enrichir les nouveaux CVE avec l'IA
        if nouveaux > 0:
            asyncio.create_task(enrich_pending(limit=nouveaux))

        # 4. Mettre à jour le statut de la source
        Pipeline.update_source_status(
            nom,
            statut="success",
            nb_cve=nouveaux
        )

    except Exception as e:
        print(f" [{nom}] Erreur durant la collecte : {e}")
        Pipeline.update_source_status(
            nom,
            statut="error",
            erreur=str(e)
        )


async def enrich_pending(limit: int = 10):
    """
    Enrichit les CVE en base qui ne l'ont pas encore été.
    Appelé automatiquement après chaque collecte.
    """
    from enrichment import get_llm
    from database.db import SessionLocal
    from database.models import CVE

    db = SessionLocal()
    cves = db.query(CVE).filter(CVE.enrichi == False).limit(limit).all()
    db.close()

    if not cves:
        return

    llm = get_llm()
    print(f"\n Enrichissement de {len(cves)} CVE avec {llm.nom}...")

    for cve in cves:
        try:
            enrichment = await llm.enrich(cve.to_dict())

            if enrichment.get("enrichi"):
                db = SessionLocal()
                cve_db = db.query(CVE).filter(CVE.id == cve.id).first()
                if cve_db:
                    cve_db.resume_ia         = enrichment["resume_ia"]
                    cve_db.recommandation_ia = enrichment["recommandation_ia"]
                    cve_db.impact_ia         = enrichment.get("impact_ia")
                    cve_db.urgence_ia        = enrichment.get("urgence_ia")
                    cve_db.llm_provider      = enrichment["llm_provider"]
                    cve_db.enrichi           = True
                    db.commit()
                    print(f"   {cve.id} enrichi")
                db.close()

            # Pause pour respecter les rate limits
            await asyncio.sleep(2)

        except Exception as e:
            print(f"   Erreur enrichissement {cve.id} : {e}")
            continue


# =========================================================
# TÂCHES PLANIFIÉES
# =========================================================

async def task_nvd():
    print(f"\n [{datetime.now().strftime('%H:%M:%S')}] Tâche NVD déclenchée")
    pipeline = NormalizerPipeline()
    await run_source(NVDSource(), pipeline)


async def task_cisa():
    print(f"\n [{datetime.now().strftime('%H:%M:%S')}] Tâche CISA déclenchée")
    pipeline = NormalizerPipeline()
    await run_source(CISASource(), pipeline)


async def task_github():
    print(f"\n [{datetime.now().strftime('%H:%M:%S')}] Tâche GitHub Advisory déclenchée")
    pipeline = NormalizerPipeline()
    await run_source(GitHubAdvisorySource(), pipeline)


async def task_exploitdb():
    print(f"\n [{datetime.now().strftime('%H:%M:%S')}] Tâche Exploit-DB déclenchée")
    pipeline = NormalizerPipeline()
    await run_source(ExploitDBSource(), pipeline)


def setup_scheduler():
    """
    Configure et démarre toutes les tâches planifiées.
    Appelé au démarrage de l'application.
    """

    # --- NVD toutes les X heures ---
    scheduler.add_job(
        task_nvd,
        trigger=IntervalTrigger(hours=settings.NVD_INTERVAL_HOURS),
        id="nvd_collector",
        name="Collecte NVD/NIST",
        replace_existing=True,
        max_instances=1,       # éviter les doublons si la tâche est lente
    )

    # CISA KEV
    scheduler.add_job(
        task_cisa,
        trigger=IntervalTrigger(hours=settings.CISA_INTERVAL_HOURS),
        id="cisa_collector",
        name="Collecte CISA KEV",
        replace_existing=True,
        max_instances=1,
    )

    # GitHub Advisory
    scheduler.add_job(
        task_github,
        trigger=IntervalTrigger(hours=settings.GITHUB_INTERVAL_HOURS),
        id="github_collector",
        name="Collecte GitHub Advisory",
        replace_existing=True,
        max_instances=1,
    )

    # Exploit-DB
    scheduler.add_job(
        task_exploitdb,
        trigger=IntervalTrigger(hours=settings.EXPLOITDB_INTERVAL_HOURS),
        id="exploitdb_collector",
        name="Collecte Exploit-DB RSS",
        replace_existing=True,
        max_instances=1,
    )

    scheduler.start()

    print(f"""
╔══════════════════════════════════════╗
║       VeilSec Scheduler démarré    ║
╠══════════════════════════════════════╣
║  NVD      → toutes les {settings.NVD_INTERVAL_HOURS}h            ║
║  CISA     → toutes les {settings.CISA_INTERVAL_HOURS}h           ║
║  GitHub   → toutes les {settings.GITHUB_INTERVAL_HOURS}h            ║
║  Exploit-DB → toutes les {settings.EXPLOITDB_INTERVAL_HOURS}h         ║
╚══════════════════════════════════════╝
    """)


def stop_scheduler():
    """Arrête proprement le scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        print(" Scheduler arrêté")