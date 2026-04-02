// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import {
  Shield, AlertTriangle, Zap, Bot, TrendingUp, Database,
  ChevronRight, Eye, Flame, Clock, Monitor, Bug, Info
} from 'lucide-react'
import CriticalityBadge from '../components/CriticalityBadge'
import CVEDetail from '../components/CVEDetail'
import CriticalityChart from '../components/charts/CriticalityChart'
import EvolutionChart from '../components/charts/EvolutionChart'
import { getStats, getCVEs, getEvolution } from '../api/client'

// ─── Composant carte CVE compact ──────────────────────────────────────────────
function CVECard({ cve, onClick }) {
  return (
    <div
      onClick={() => onClick(cve)}
      className="flex items-start justify-between p-3 rounded-lg bg-gray-800/40 hover:bg-gray-700/50 border border-gray-700/30 hover:border-gray-600/50 cursor-pointer transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {cve.actif_exploit && <Flame size={12} className="text-red-400 shrink-0" />}
          <span className="font-mono text-blue-400 text-xs font-semibold truncate">{cve.id}</span>
          <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
        </div>
        <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
          {cve.resume_ia || cve.description?.slice(0, 120) + '...'}
        </p>
        {cve.systemes?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {cve.systemes.slice(0, 2).map(s => (
              <span key={s} className="text-xs bg-gray-700/60 text-gray-400 px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 shrink-0 mt-1 ml-2 transition-colors" />
    </div>
  )
}

// ─── Section avec titre et badge count ────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, color, count, children, badge }) {
  const colors = {
    red:    'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    green:  'text-green-400 bg-green-500/10 border-green-500/20',
  }
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between p-4 border-b border-gray-700/40">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${colors[color]}`}>
            <Icon size={16} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{title}</h3>
            {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {count !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${colors[color]}`}>
            {count}
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  )
}

// ─── Composant type de menace ──────────────────────────────────────────────────
function ThreatTypeCard({ cwe, count, description, onClick, cves }) {
  const [expanded, setExpanded] = useState(false)

  const cweDescriptions = {
    'CWE-79':  { label: 'Cross-Site Scripting (XSS)', icon: '🌐', desc: 'Injection de code malveillant dans des pages web' },
    'CWE-89':  { label: 'Injection SQL', icon: '🗄️', desc: 'Manipulation de bases de données via des requêtes malveillantes' },
    'CWE-119': { label: 'Buffer Overflow', icon: '💾', desc: 'Dépassement de mémoire pouvant exécuter du code arbitraire' },
    'CWE-787': { label: 'Écriture hors limites', icon: '⚠️', desc: 'Écriture en mémoire au-delà des zones autorisées' },
    'CWE-416': { label: 'Use After Free', icon: '🔓', desc: 'Utilisation de mémoire déjà libérée' },
    'CWE-22':  { label: 'Path Traversal', icon: '📁', desc: 'Accès non autorisé à des fichiers système' },
    'CWE-78':  { label: 'Injection de commandes', icon: '💻', desc: 'Exécution de commandes système arbitraires' },
    'CWE-434': { label: 'Upload de fichiers dangereux', icon: '📤', desc: 'Upload de fichiers malveillants sur le serveur' },
    'CWE-306': { label: 'Authentification manquante', icon: '🔑', desc: 'Accès à des fonctions sans vérification d\'identité' },
    'CWE-863': { label: 'Autorisation incorrecte', icon: '🚫', desc: 'Accès à des ressources sans les droits nécessaires' },
    'CWE-20':  { label: 'Validation incorrecte', icon: '✅', desc: 'Données d\'entrée non vérifiées correctement' },
    'CWE-732': { label: 'Permissions incorrectes', icon: '🔐', desc: 'Droits d\'accès mal configurés sur des ressources' },
  }

  const info = cweDescriptions[cwe] || { label: cwe, icon: '🔍', desc: description }

  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{info.icon}</span>
          <div>
            <p className="text-white text-sm font-medium">{info.label}</p>
            <p className="text-gray-500 text-xs">{info.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{count} CVE</span>
          <ChevronRight size={14} className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-700/30 p-3 space-y-2 bg-gray-900/30">
          {cves.slice(0, 3).map(cve => (
            <CVECard key={cve.id} cve={cve} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard principal ───────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [urgents, setUrgents] = useState([])
  const [surveiller, setSurveiller] = useState([])
  const [recents, setRecents] = useState([])
  const [parType, setParType] = useState({})
  const [parSysteme, setParSysteme] = useState({})
  const [evolution, setEvolution] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, e, critiqueData, hauteData, recentData, tousData] = await Promise.all([
          getStats(),
          getEvolution(7),
          getCVEs({ criticite: 'CRITIQUE', limit: 5, sort_by: 'date_collecte', order: 'desc' }),
          getCVEs({ criticite: 'HAUTE', limit: 6, sort_by: 'date_collecte', order: 'desc' }),
          getCVEs({ limit: 8, sort_by: 'date_collecte', order: 'desc' }),
          getCVEs({ limit: 100, sort_by: 'date_collecte', order: 'desc' }),
        ])

        setStats(s)
        setEvolution(e.evolution)
        setUrgents(critiqueData.data)
        setSurveiller(hauteData.data)
        setRecents(recentData.data)

        // Regrouper par type de menace (CWE)
        const typeMap = {}
        tousData.data.forEach(cve => {
          if (cve.cwe) {
            if (!typeMap[cve.cwe]) typeMap[cve.cwe] = []
            typeMap[cve.cwe].push(cve)
          }
        })
        // Trier par nombre de CVE
        const sorted = Object.entries(typeMap)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 6)
        setParType(Object.fromEntries(sorted))

        // Regrouper par système ciblé
        const sysMap = {}
        tousData.data.forEach(cve => {
          cve.systemes?.forEach(sys => {
            const key = sys.split(' ')[0] // prendre juste le vendor
            if (key && key.length > 2) {
              if (!sysMap[key]) sysMap[key] = { count: 0, cves: [] }
              sysMap[key].count++
              if (sysMap[key].cves.length < 3) sysMap[key].cves.push(cve)
            }
          })
        })
        const sortedSys = Object.entries(sysMap)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 6)
        setParSysteme(Object.fromEntries(sortedSys))

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Chargement du dashboard...
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vue d'ensemble</h1>
          <p className="text-gray-400 text-sm mt-1">
            {stats?.total_cve} vulnérabilités surveillées ·{' '}
            <span className="text-green-400">{stats?.nouveaux_24h} nouvelles aujourd'hui</span>
          </p>
        </div>
        {stats?.actifs_exploit > 0 && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <Flame size={14} className="text-red-400 animate-pulse" />
            <span className="text-red-400 text-sm font-medium">
              {stats.actifs_exploit} exploitation{stats.actifs_exploit > 1 ? 's' : ''} active{stats.actifs_exploit > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats?.total_cve, color: 'bg-gray-700/50 border-gray-600/30', text: 'text-white' },
          { label: ' Critiques', value: stats?.critiques, color: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
          { label: ' Hautes', value: stats?.hautes, color: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
          { label: ' Moyennes', value: stats?.moyennes, color: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
          { label: ' Analysés IA', value: stats?.enrichis, color: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
          { label: '⚡ Exploités', value: stats?.actifs_exploit, color: 'bg-red-600/10 border-red-600/20', text: 'text-red-300' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className={`${color} border rounded-xl p-3 text-center`}>
            <p className="text-gray-400 text-xs mb-1">{label}</p>
            <p className={`text-2xl font-bold ${text}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Section 1 — Alertes urgentes */}
      <Section
        icon={Flame}
        title=" Alertes urgentes — Agir maintenant"
        subtitle="Vulnérabilités critiques récemment découvertes"
        color="red"
        count={stats?.critiques}
      >
        {urgents.length > 0 ? (
          <>
            {urgents.map(cve => <CVECard key={cve.id} cve={cve} onClick={setSelected} />)}
            <p className="text-xs text-gray-600 text-center pt-1">
               Cliquez sur une ligne pour voir l'analyse complète en français
            </p>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
             Aucune vulnérabilité critique en ce moment
          </div>
        )}
      </Section>

      {/* Section 2 — À surveiller */}
      <Section
        icon={Eye}
        title=" À surveiller cette semaine"
        subtitle="Vulnérabilités de haute sévérité — à corriger rapidement"
        color="orange"
        count={stats?.hautes}
      >
        {surveiller.map(cve => <CVECard key={cve.id} cve={cve} onClick={setSelected} />)}
      </Section>

      {/* Section 3 — Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CriticalityChart stats={stats} />
        <EvolutionChart data={evolution} />
      </div>

      {/* Section 4 — Par type de menace */}
      <Section
        icon={Bug}
        title=" Par type de menace"
        subtitle="Comprendre quelles catégories de failles sont les plus présentes"
        color="purple"
      >
        <div className="mb-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300/70 text-xs leading-relaxed">
              Les types de menaces sont classés selon le système CWE (Common Weakness Enumeration).
              Cliquez sur un type pour voir les CVE associés.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(parType).map(([cwe, cves]) => (
            <ThreatTypeCard
              key={cwe}
              cwe={cwe}
              count={cves.length}
              cves={cves}
              onClick={setSelected}
            />
          ))}
          {Object.keys(parType).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">Aucune donnée disponible</p>
          )}
        </div>
      </Section>

      {/* Section 5 — Par système ciblé */}
      <Section
        icon={Monitor}
        title=" Par système ciblé"
        subtitle="Quels logiciels et systèmes sont les plus touchés"
        color="blue"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(parSysteme).map(([sys, { count, cves }]) => (
            <div
              key={sys}
              className="bg-gray-700/30 border border-gray-600/30 rounded-lg p-3 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setSelected(cves[0])}
            >
              <p className="text-white font-medium text-sm truncate">{sys}</p>
              <p className="text-gray-400 text-xs mt-0.5">{count} vulnérabilité{count > 1 ? 's' : ''}</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {cves.slice(0, 2).map(c => (
                  <span key={c.id} className={`text-xs px-1.5 py-0.5 rounded-full ${
                    c.criticite === 'CRITIQUE' ? 'bg-red-500/20 text-red-400' :
                    c.criticite === 'HAUTE' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-gray-600/40 text-gray-400'
                  }`}>
                    {c.criticite}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 6 — Dernières découvertes */}
      <Section
        icon={Clock}
        title=" Dernières découvertes"
        subtitle="CVE publiés très récemment — à surveiller de près"
        color="green"
        count={stats?.nouveaux_24h}
      >
        {recents.map(cve => <CVECard key={cve.id} cve={cve} onClick={setSelected} />)}
      </Section>

      {selected && <CVEDetail cve={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
