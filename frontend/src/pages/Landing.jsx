// frontend/src/pages/Landing.jsx

import { Shield, Search, Bot, Lock, TrendingUp, Database } from 'lucide-react'

const FEATURES = [
  {
    icon: Database,
    title: 'Veille automatisée 24/7',
    desc: 'Collecte continue depuis NVD, CISA KEV, GitHub Advisory et Exploit-DB.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Bot,
    title: 'Enrichissement IA',
    desc: 'Chaque CVE est analysé et résumé en français par intelligence artificielle.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Search,
    title: 'Analyse de stack',
    desc: 'Déclarez votre infrastructure et obtenez uniquement les CVE qui vous concernent.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Rapport PDF professionnel',
    desc: 'Exportez votre analyse avec score de risque, vecteurs d\'attaque et recommandations.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    icon: Lock,
    title: 'Privacy by design',
    desc: 'Aucune donnée personnelle collectée. Conformité RGPD native. Zero tracking.',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    icon: Shield,
    title: 'Open source & gratuit',
    desc: 'Code source disponible sur GitHub. Déployez votre propre instance.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
]

const SOURCES = ['NVD/NIST', 'CISA KEV', 'GitHub Advisory', 'Exploit-DB']

const STATS = [
  { value: '1 700+', label: 'CVE surveillés' },
  { value: '4',      label: 'Sources officielles' },
  { value: '24/7',   label: 'Collecte automatique' },
  { value: '100%',   label: 'Gratuit' },
]

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ─── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-white text-lg">VeilSec</span>
              <p className="text-xs text-gray-500 leading-none">Vulnerability Intelligence Hub</p>
            </div>
          </div>
          <button
            onClick={onEnter}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Accéder au dashboard →
          </button>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Plateforme open source
        </div>

        {/* Titre principal — important pour le SEO */}
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Veille sécuritaire CVE
          <br />
          <span className="text-blue-400">alimentée par IA</span>
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          VeilSec agrège automatiquement les vulnérabilités depuis les sources
          officielles, les enrichit en français par IA et vous aide à identifier
          celles qui concernent <strong className="text-white">votre infrastructure</strong>.
        </p>

        {/* Sources */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {SOURCES.map(s => (
            <span
              key={s}
              className="bg-gray-800 border border-gray-700 text-gray-300 px-4 py-1.5 rounded-full text-sm"
            >
              {s}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-medium text-lg transition-colors shadow-lg shadow-blue-500/20"
        >
          Accéder au dashboard →
        </button>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────── */}
      <section className="border-y border-gray-800/50 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-blue-400">{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-3">
          Tout ce dont vous avez besoin
        </h2>
        <p className="text-gray-400 text-center mb-12">
          pour une veille sécuritaire efficace et accessible
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className={`border rounded-xl p-5 ${bg} transition-transform hover:-translate-y-0.5`}
            >
              <Icon size={22} className={`${color} mb-3`} />
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA final ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Commencez votre veille maintenant
          </h2>
          <p className="text-gray-400 mb-8">
            Gratuit, sans inscription, sans cookie de tracking.
          </p>
          <button
            onClick={onEnter}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-medium text-lg transition-colors"
          >
            Accéder au dashboard →
          </button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800/50 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            <span className="text-gray-400 text-sm">
              VeilSec © {new Date().getFullYear()} — Open source
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            
             <a href="https://github.com/Danielkinkeu/VeilSec"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span>·</span>
            <span>Conformité RGPD</span>
            <span>·</span>
            <span>Zero tracking</span>
          </div>
        </div>
      </footer>

    </div>
  )
}