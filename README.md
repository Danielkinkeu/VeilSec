# 🛡️ VeilSec — Vulnerability Intelligence Hub

> Plateforme de veille sécuritaire alimentée par IA — restez informé des dernières vulnérabilités et analysez l'exposition de votre infrastructure.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Python](https://img.shields.io/badge/python-3.12-green)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![License](https://img.shields.io/badge/license-MIT-yellow)
![RGPD](https://img.shields.io/badge/RGPD-conforme-brightgreen)

---

## 📋 Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Sources de données](#sources-de-données)
- [Stack technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Sécurité & RGPD](#sécurité--rgpd)
- [Roadmap](#roadmap)

---

## 🎯 Présentation

VeilSec est une plateforme open source de **veille sécuritaire automatisée** qui agrège les vulnérabilités (CVE) depuis plusieurs sources officielles, les enrichit via intelligence artificielle et les présente dans un dashboard interactif.

### Pourquoi VeilSec ?

La veille sécuritaire est une compétence fondamentale en cybersécurité. VeilSec résout le problème numéro 1 des outils existants : **l'information non contextualisée**. Au lieu d'afficher 1756 CVE indifférenciés, VeilSec vous montre uniquement les vulnérabilités qui concernent **votre infrastructure spécifique**.
```
Sans VeilSec          Avec VeilSec
─────────────         ─────────────────────────────
1756 CVE              "23 vulnérabilités vous concernent"
→ bruit               "3 sont critiques sur votre stack"
→ découragement       "Voici quoi faire maintenant"
→ abandon             → action immédiate
```

---

## ✨ Fonctionnalités

### 🔍 Veille automatisée
- Collecte automatique depuis **4 sources officielles** toutes les 2 à 12 heures
- Recherche dans l'**historique complet** (pas uniquement les CVE récents)
- Déduplication intelligente — un CVE = une entrée, peu importe la source
- Mise à jour progressive des scores CVSS et CWE

### 🤖 Enrichissement IA
- **Résumé en français** de chaque vulnérabilité
- **Analyse d'impact** : ce qu'un attaquant peut faire concrètement
- **Recommandations** de mitigation personnalisées
- **Score d'urgence** : IMMEDIATE / HAUTE / NORMALE / FAIBLE
- Multi-provider : Groq (défaut) | DeepSeek | Gemini | Claude

### 🛡️ Analyse de stack personnalisée (v2.0)
- Déclarez votre stack technique en 30 secondes
- VeilSec trouve toutes les CVE qui vous concernent sur l'historique complet
- **Analyse globale DeepSeek** : score de risque, vecteurs d'attaque, recommandations priorisées
- **Zero Data** : vos données restent dans votre navigateur, jamais sur nos serveurs
- Profils prédéfinis : LAMP, Cloud, Microsoft, Python, E-Commerce, Java

### 📊 Dashboard interactif
- Vue d'ensemble avec métriques en temps réel
- Catégorisation par niveau d'urgence, type de menace et système ciblé
- Graphiques d'évolution temporelle
- Recherche avancée multi-critères avec export CSV

### 🔒 Security First & RGPD
- Aucune donnée utilisateur stockée en base
- SessionStorage uniquement — suppression automatique à la fermeture
- Rate limiting sur tous les endpoints sensibles
- Validation stricte des entrées (liste blanche)
- Conformité RGPD native (Article 5, 25)

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────┐
│  Sources de données                                  │
│  NVD/NIST · CISA KEV · GitHub Advisory · Exploit-DB │
└──────────────────────┬──────────────────────────────┘
                       ↓ collecte automatique (2-12h)
┌─────────────────────────────────────────────────────┐
│  Backend FastAPI (Python 3.12)                       │
│  ├── Scheduler APScheduler                          │
│  ├── Pipeline normalisation + déduplication         │
│  ├── Enrichissement IA (Groq / DeepSeek / Gemini)   │
│  └── API REST                                       │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Base de données PostgreSQL                          │
│  CVE · Sources · Métadonnées                        │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│  Frontend React + Tailwind (Vercel)                  │
│  ├── Dashboard général                              │
│  ├── CVE List + Recherche avancée                   │
│  ├── Analyse de stack personnalisée                 │
│  └── État des sources                               │
└─────────────────────────────────────────────────────┘

Monitoring : UptimeRobot → ping /health toutes les 5min
```

---

## 📡 Sources de données

| Source | Type | Fréquence | Description |
|--------|------|-----------|-------------|
| **NVD/NIST** | API REST | Toutes les 6h | Base CVE officielle avec scores CVSS |
| **CISA KEV** | JSON | Toutes les 12h | Vulnérabilités activement exploitées |
| **GitHub Advisory** | GraphQL | Toutes les 6h | Failles dans les packages open source |
| **Exploit-DB** | RSS | Toutes les 2h | Exploits publics disponibles |

---

## 🛠️ Stack technique

### Backend
```
Python 3.12          Langage principal
FastAPI 0.115        Framework API REST
APScheduler 3.10     Scheduler de tâches
SQLAlchemy 2.0       ORM base de données
PostgreSQL           Base de données production
SQLite               Base de données développement
httpx                Client HTTP async
feedparser           Lecture flux RSS
```

### Frontend
```
React 18             Framework UI
Vite                 Build tool
Tailwind CSS         Styling
Recharts             Graphiques
Lucide React         Icônes
Axios                Client HTTP
```

### Intelligence Artificielle
```
Groq + Llama 3.3     Enrichissement CVE (gratuit, défaut)
DeepSeek V3          Analyse de stack (quasi gratuit)
Gemini 2.0 Flash     Alternatif gratuit
Claude Haiku         Optionnel (payant)
```

### Infrastructure
```
Render               Hébergement backend (free tier)
Vercel               Hébergement frontend (gratuit)
PostgreSQL Render    Base de données (free tier)
UptimeRobot          Monitoring + anti-sleep (gratuit)
GitHub               CI/CD automatique
```

---

## 🚀 Installation

### Prérequis
```bash
Python 3.12+
Node.js 20+
Git
```

### 1. Cloner le projet
```bash
git clone https://github.com/Danielkinkeu/VeilSec.git
cd VeilSec
```

### 2. Backend
```bash
cd backend

# Créer l'environnement virtuel
python -m venv env
source env/bin/activate  # Linux/macOS
# env\Scripts\activate   # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

### 3. Frontend
```bash
cd frontend
npm install
```

### 4. Lancer en développement
```bash
# Terminal 1 — Backend
cd backend
source env/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Accéder à **http://localhost:5173**

---

## ⚙️ Configuration

### Variables d'environnement (`.env`)
```bash
# === Base de données ===
DATABASE_URL=sqlite:///./veilsec.db          # Dev
# DATABASE_URL=postgresql://...              # Production

# === IA Provider ===
LLM_PROVIDER=groq                            # groq | deepseek | gemini | claude

# === Clés API IA ===
GROQ_API_KEY=                                # Gratuit — https://console.groq.com
DEEPSEEK_API_KEY=                            # Quasi gratuit — https://platform.deepseek.com
GEMINI_API_KEY=                              # Gratuit — https://aistudio.google.com
ANTHROPIC_API_KEY=                           # Optionnel — payant

# === Sources de données ===
GITHUB_TOKEN=                                # Optionnel — augmente les limites GitHub

# === Intervalles de collecte (heures) ===
NVD_INTERVAL_HOURS=6
CISA_INTERVAL_HOURS=12
GITHUB_INTERVAL_HOURS=6
EXPLOITDB_INTERVAL_HOURS=2
NVD_DAYS_BACK=1
MAX_CVE_PER_RUN=100

# === Sécurité ===
STACK_MAX_CVES_ANALYZE=50                    # CVE max envoyés à l'IA par analyse
STACK_RATE_LIMIT=10                          # Analyses max par heure par IP
```

### Obtenir les clés API gratuites

| Service | URL | Limite gratuite |
|---------|-----|-----------------|
| Groq | https://console.groq.com | 14 400 req/jour |
| DeepSeek | https://platform.deepseek.com | $5 crédits offerts |
| Gemini | https://aistudio.google.com/apikey | 1 500 req/jour |
| GitHub Token | https://github.com/settings/tokens | 5 000 req/heure |

---

## 🌐 Déploiement

### Backend sur Render

1. Créer un compte sur [render.com](https://render.com)
2. **New** → **Web Service** → connecter le repo GitHub
3. Configurer :
```
   Root Directory  : backend
   Build Command   : pip install -r requirements.txt
   Start Command   : uvicorn main:app --host 0.0.0.0 --port $PORT
```
4. Ajouter les variables d'environnement
5. Créer une base **PostgreSQL** sur Render et copier l'Internal URL dans `DATABASE_URL`

### Maintenir Render actif (UptimeRobot)

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com)
2. **Add New Monitor** :
```
   Type     : HTTP(s)
   URL      : https://votre-app.onrender.com/health
   Interval : 5 minutes
```

### Frontend sur Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. **New Project** → importer depuis GitHub
3. Configurer :
```
   Root Directory  : frontend
   Build Command   : npm run build
   Output Directory: dist
```
4. Ajouter la variable d'environnement :
```
   VITE_API_URL=https://votre-app.onrender.com
```

---

## 🔒 Sécurité & RGPD

### Principes de conception

VeilSec est conçu selon le principe **"Zero Trust, Zero Data"** :
```
Ce que nous ne stockons pas
ne peut pas être volé,
fuité, ou utilisé contre l'utilisateur.
```

### Analyse de stack — données utilisateur

| Donnée | Stockage | Durée | Transmission serveur |
|--------|----------|-------|---------------------|
| Technologies déclarées | SessionStorage navigateur | Fermeture onglet | ❌ Jamais |
| Résultats d'analyse | SessionStorage navigateur | Fermeture onglet | ❌ Jamais |
| Adresse IP (hashée) | Mémoire serveur | 1 heure | Usage interne uniquement |

### Ce que nous ne faisons jamais
```
❌ Stocker des données personnelles
❌ Utiliser des cookies de tracking
❌ Partager des données avec des tiers
❌ Logger les technologies recherchées
❌ Demander des adresses IP ou noms de domaine
❌ Scanner automatiquement les systèmes
```

### Conformité RGPD

| Article | Mesure |
|---------|--------|
| Art. 5 — Minimisation | Zéro donnée stockée |
| Art. 6 — Licéité | Pas de traitement = pas de base légale nécessaire |
| Art. 13 — Information | Bannière explicative dans l'interface |
| Art. 17 — Effacement | Fermer l'onglet suffit |
| Art. 25 — Privacy by design | Architecture sans stockage |
| Art. 32 — Sécurité | Données jamais transmises = jamais exposées |

### Note sur DeepSeek

L'analyse de stack utilise DeepSeek (entreprise chinoise). Seules des informations techniques (noms de technologies) sont transmises — jamais de données personnelles. Un avertissement est affiché à l'utilisateur dans l'interface.

---

## 📁 Structure du projet
```
VeilSec/
├── backend/
│   ├── main.py                    # Point d'entrée FastAPI
│   ├── config.py                  # Configuration
│   ├── requirements.txt           # Dépendances Python
│   ├── database/
│   │   ├── models.py              # Modèles SQLAlchemy
│   │   └── db.py                  # Connexion base de données
│   ├── sources/                   # Collecteurs de données
│   │   ├── base.py                # Contrat de base
│   │   ├── nvd.py                 # NVD/NIST
│   │   ├── cisa.py                # CISA KEV
│   │   ├── github_advisory.py     # GitHub Advisory
│   │   └── exploitdb.py           # Exploit-DB RSS
│   ├── collectors/
│   │   └── scheduler.py           # Scheduler automatique
│   ├── normalizer/
│   │   └── pipeline.py            # Normalisation + déduplication
│   ├── enrichment/                # Adaptateurs IA
│   │   ├── base.py                # Contrat LLM
│   │   ├── groq.py                # Groq (défaut)
│   │   ├── deepseek.py            # DeepSeek (analyse stack)
│   │   ├── gemini.py              # Gemini
│   │   └── claude.py              # Claude (optionnel)
│   └── api/
│       ├── routes/
│       │   ├── cve.py             # GET /cves
│       │   ├── stats.py           # GET /stats
│       │   ├── sources.py         # GET /sources
│       │   └── analyze.py         # POST /analyze/stack
│       └── schemas.py             # Schémas Pydantic
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Client HTTP
│   │   ├── utils/stackStorage.js  # SessionStorage RGPD
│   │   ├── components/            # Composants réutilisables
│   │   └── pages/                 # Pages de l'application
│   │       ├── Dashboard.jsx      # Vue d'ensemble
│   │       ├── CVEList.jsx        # Liste CVE
│   │       ├── AdvancedSearch.jsx # Recherche avancée
│   │       ├── StackAnalyzer.jsx  # Analyse de stack
│   │       ├── StackResults.jsx   # Résultats personnalisés
│   │       └── Sources.jsx        # État des sources
│   └── vite.config.js
│
├── render.yaml                    # Configuration Render
├── .env.example                   # Template variables d'environnement
└── README.md
```

---

## 🗺️ Roadmap

### v2.0 (actuelle)
- [x] Analyse de stack personnalisée
- [x] Intégration DeepSeek pour analyse globale
- [x] Conformité RGPD native
- [x] Déploiement Render + Vercel

### v2.1 (prochaine)
- [ ] Notifications par email pour les CVE critiques
- [ ] Export PDF du rapport d'analyse
- [ ] Support de langues supplémentaires
- [ ] Intégration Mastodon/RSS pour réseaux sociaux

### v3.0 (futur)
- [ ] Scan de ports optionnel (avec consentement explicite)
- [ ] Intégration MITRE ATT&CK
- [ ] API publique documentée
- [ ] Mode entreprise multi-utilisateurs

---

## 👨‍💻 Auteur

**Daniel Kinkeu**
Étudiant en ingénierie sécurité — passionné par la cybersécurité et l'IA

- GitHub : [@Danielkinkeu](https://github.com/Danielkinkeu)
- Projet : [VeilSec](https://github.com/Danielkinkeu/VeilSec)

---

## 📄 Licence

MIT License — voir [LICENSE](LICENSE) pour les détails.

---

## ⚠️ Avertissement

VeilSec est un outil de veille sécuritaire à but éducatif et informatif. Les analyses générées par IA ne remplacent pas un audit de sécurité professionnel. L'auteur décline toute responsabilité quant à l'utilisation des informations présentées.

---

*Fait avec ❤️ et ☕ par un futur ingénieur sécurité*