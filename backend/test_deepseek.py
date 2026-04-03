# backend/test_deepseek.py
import asyncio
from enrichment.deepseek import DeepSeekLLM

async def main():
    ds = DeepSeekLLM()
    
    stack = {
        "Systèmes": ["linux"],
        "Serveurs web": ["apache"],
        "Langages": ["php"],
        "Bases de données": ["mysql"]
    }
    
    cves = [
        {"id": "CVE-2021-44228", "score_cvss": 10.0, "cwe": "CWE-917", 
         "titre": "Log4Shell RCE", "description": "Apache Log4j2 RCE via JNDI"},
        {"id": "CVE-2021-41773", "score_cvss": 9.8, "cwe": "CWE-22",
         "titre": "Apache Path Traversal", "description": "Apache HTTP Server path traversal"},
    ]
    
    print(" Envoi du prompt à DeepSeek...")
    result = await ds.analyze_stack(stack, cves)
    
    print(f"\n Résultat complet :")
    import json
    print(json.dumps(result, ensure_ascii=False, indent=2))

asyncio.run(main())