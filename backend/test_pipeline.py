# backend/test_pipeline.py

import asyncio
from sources.nvd import NVDSource
from normalizer.pipeline import NormalizerPipeline
from database.db import init_db, SessionLocal
from database.models import CVE

async def main():
    # 1. Initialiser la base de données
    print("  Initialisation de la base de données...")
    init_db()

    # 2. Collecter depuis NVD
    source = NVDSource()
    normalized_data = await source.collect()

    # 3. Passer dans le pipeline
    print("\n  Traitement dans le pipeline...")
    pipeline = NormalizerPipeline()
    stats = pipeline.process(normalized_data)

    # 4. Vérifier ce qui est en base
    db = SessionLocal()
    total_en_base = db.query(CVE).count()
    critiques = db.query(CVE).filter(CVE.criticite == "CRITIQUE").count()
    hautes = db.query(CVE).filter(CVE.criticite == "HAUTE").count()
    inconnues = db.query(CVE).filter(CVE.criticite == "INCONNUE").count()

    print(f"  État de la base de données :")
    print(f"   Total CVE en base  : {total_en_base}")
    print(f"    Critiques       : {critiques}")
    print(f"    Hautes          : {hautes}")
    print(f"    Inconnues       : {inconnues}")

    # 5. Afficher un exemple de CVE stocké
    exemple = db.query(CVE).first()
    if exemple:
        print(f"\n Exemple de CVE stocké :")
        print(f"   ID          : {exemple.id}")
        print(f"   Criticité   : {exemple.criticite}")
        print(f"   Source      : {exemple.source}")
        print(f"   Enrichi     : {exemple.enrichi}")
        print(f"   Description : {exemple.description[:80]}...")

    db.close()

    # 6. Relancer pour tester la déduplication
    print("\n Test déduplication — deuxième collecte...")
    normalized_data2 = await source.collect()
    stats2 = pipeline.process(normalized_data2)

    print(" Si 'Ignorés' = 100 et 'Nouveaux' = 0, la déduplication fonctionne !")

asyncio.run(main())