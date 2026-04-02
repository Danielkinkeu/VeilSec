# backend/test_nvd.py

import asyncio
from sources.nvd import NVDSource

async def main():
    source = NVDSource()
    resultats = await source.collect()

    print(f"\n{'='*60}")
    print(f"  {len(resultats)} CVE collectés depuis NVD")
    print(f"{'='*60}\n")

    # Afficher les 3 premiers
    for cve in resultats[:3]:
        print(f" ID         : {cve['id']}")
        print(f"   Criticité  : {cve['criticite']} (score: {cve['score_cvss']})")
        print(f"   CWE        : {cve['cwe']}")
        print(f"   Systèmes   : {', '.join(cve['systemes'][:3]) or 'Non précisé'}")
        print(f"   Lien       : {cve['lien']}")
        print(f"   Description: {cve['description'][:100]}...")
        print()

asyncio.run(main())