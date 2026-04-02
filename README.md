# 🛡️ VeilSec

> AI-powered vulnerability intelligence dashboard — veille sécuritaire automatisée

## Description
VeilSec agrège les CVE et failles de sécurité depuis plusieurs sources officielles
(NVD, CISA, GitHub Advisory, Exploit-DB), les enrichit via IA et les affiche
dans un dashboard interactif avec niveaux de criticité.

## Stack
- **Backend** : FastAPI + APScheduler + SQLAlchemy
- **Frontend** : React + Tailwind + Recharts
- **IA** : Gemini (défaut) | Groq | Claude (optionnel)

## Sources de données
- NVD/NIST API
- CISA Known Exploited Vulnerabilities
- GitHub Security Advisories
- Exploit-DB RSS

## Installation
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Configuration
Copier `.env.example` en `.env` et remplir les clés API.


