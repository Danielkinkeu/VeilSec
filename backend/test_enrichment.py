# backend/test_enrichment.py

import asyncio
from sources.nvd import NVDSource
from normalizer.pipeline import NormalizerPipeline
from enrichment import get_llm
from database.db import init_db, SessionLocal
from database.models import CVE


async def main():
    init_db()

    # 1. Collecter et stocker quelques CVE
    source = NVDSource()
    data = await source.collect()
    pipeline = NormalizerPipeline()
    pipeline.process(data)

    # 2. Récupérer 3 CVE non encore enrichis
    db = SessionLocal()
    cves = db.query(CVE).filter(CVE.enrichi == False).limit(3).all()
    db.close()

    if not cves:
        print("  Aucun CVE à enrichir en base")
        return

    # 3. Enrichir avec le provider configuré
    llm = get_llm()
    print(f" Provider IA utilisé : {llm.nom}\n")

    for cve in cves:
        print(f" Enrichissement de {cve.id}...")
        enrichment = await llm.enrich(cve.to_dict())

        # Mettre à jour en base
        db = SessionLocal()
        cve_db = db.query(CVE).filter(CVE.id == cve.id).first()

        if cve_db and enrichment.get("enrichi"):
            cve_db.resume_ia        = enrichment["resume_ia"]
            cve_db.recommandation_ia = enrichment["recommandation_ia"]
            cve_db.llm_provider     = enrichment["llm_provider"]
            cve_db.enrichi          = True
            db.commit()

            print(f" {cve.id} enrichi !")
            print(f"    Résumé      : {enrichment['resume_ia'][:100]}...")
            print(f"     Recommandation : {enrichment['recommandation_ia'][:100]}...")
            print(f"    Impact      : {enrichment.get('impact_ia', 'N/A')}")
            print(f"    Urgence     : {enrichment.get('urgence_ia', 'N/A')}")
        else:
            print(f" Échec enrichissement {cve.id}")

        db.close()
        print()

        # Pause entre les appels pour respecter les rate limits
        await asyncio.sleep(2)

asyncio.run(main())