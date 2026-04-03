// frontend/src/pages/StackResults.jsx
import { useEffect, useState } from 'react'
import {
  Shield, AlertTriangle, ChevronLeft, Zap,
  Bot, Target, Clock, CheckCircle, ExternalLink,
  RefreshCw, TrendingUp
} from 'lucide-react'
import CriticalityBadge from '../components/CriticalityBadge'
import CVEDetail from '../components/CVEDetail'
import { loadResults, loadStack, clearStack } from '../utils/stackStorage'

// ─── Score de risque visuel ────────────────────────────────────────
function RiskScore({ score, niveau }) {
  const colors = {
    'CRITIQUE': 'text-red-400 border-red-500/30 bg-red-500/10',
    'ÉLEVÉ':    'text-orange-400 border-orange-500/30 bg-orange-500/10',
    'MODÉRÉ':   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    'FAIBLE':   'text-green-400 border-green-500/30 bg-green-500/10',
    'INCONNU':  'text-gray-400 border-gray-500/30 bg-gray-500/10',
  }

  const barColor = {
    'CRITIQUE': 'bg-red-500',
    'ÉLEVÉ':    'bg-orange-500',
    'MODÉRÉ':   'bg-yellow-500',
    'FAIBLE':   'bg-green-500',
    'INCONNU':  'bg-gray-500',
  }

  const pct = Math.min(100, (score / 10) * 100)

  return (
    <div className={`border rounded-xl p-5 ${colors[niveau] || colors['INCONNU']}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Score de risque global</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{score}</span>
            <span className="text-gray-500 text-lg">/10</span>
          </div>
        </div>
        <div className={`text-2xl font-bold px-4 py-2 rounded-lg border ${colors[niveau] || colors['INCONNU']}`}>
          {niveau}
        </div>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColor[niveau] || barColor['INCONNU']}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────
export default function StackResults() {
  const [results, setResults] = useState(null)
  const [stack, setStack] = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const r = loadResults()
    const s = loadStack()
    if (!r) {
      window.location.href = '/stack-analyzer'
      return
    }
    setResults(r)
    setStack(s)
  }, [])

  if (!results) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const ai = results.analyse_ia || {}
  const stats = results.statistiques || {}
  const cves = results.vulnerabilites || []

  // Technologies sélectionnées pour affichage
  const techList = stack ? Object.values(stack)
    .filter(Array.isArray)
    .flat()
    .filter(Boolean) : []

  return (
    <div className="space-y-6 pb-10">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => window.location.href = '/stack-analyzer'}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ChevronLeft size={16} />
            Modifier ma stack
          </button>
          <h1 className="text-2xl font-bold text-white">Résultats de votre analyse</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {techList.slice(0, 6).map(tech => (
              <span key={tech} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize">
                {tech}
              </span>
            ))}
            {techList.length > 6 && (
              <span className="text-xs text-gray-500">+{techList.length - 6} autres</span>
            )}
          </div>
        </div>

        <button
          onClick={() => { clearStack(); window.location.href = '/stack-analyzer' }}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          Nouvelle analyse
        </button>
      </div>

      {/* Avertissement données */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/30 border border-gray-700/30 rounded-lg px-3 py-2">
        <Shield size={12} className="text-green-400 shrink-0" />
        Vos données sont stockées uniquement dans ce navigateur et seront supprimées à la fermeture de l'onglet.
      </div>

      {/* Score de risque */}
      {ai.score_risque_global !== undefined && (
        <RiskScore
          score={ai.score_risque_global}
          niveau={ai.niveau_risque || 'INCONNU'}
        />
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Vulnérabilités', value: results.total_vulnerabilites, color: 'text-white' },
          { label: ' Critiques', value: stats.critiques, color: 'text-red-400' },
          { label: ' Hautes', value: stats.hautes, color: 'text-orange-400' },
          { label: '⚡ Exploitées', value: stats.actifs_exploit, color: 'text-red-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
        {[
          { id: 'overview', label: '🤖 Analyse IA' },
          { id: 'cves', label: `🔍 CVE (${cves.length})` },
          { id: 'recommendations', label: '🛡️ Actions' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}

      {/* Onglet Analyse IA */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* Résumé */}
          {ai.resume_exposition && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-blue-400" />
                <span className="text-blue-300 font-medium text-sm">Résumé de l'exposition</span>
                <span className="text-xs text-gray-600 ml-auto">par DeepSeek AI</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{ai.resume_exposition}</p>
            </div>
          )}

          {/* Impact */}
          {ai.impact_potentiel && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-red-400" />
                <span className="text-red-300 font-medium text-sm">Impact potentiel</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{ai.impact_potentiel}</p>
            </div>
          )}

          {/* Vecteurs d'attaque */}
          {ai.vecteurs_attaque?.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap size={16} className="text-orange-400" />
                Vecteurs d'attaque identifiés
              </h3>
              <div className="space-y-3">
                {ai.vecteurs_attaque.map((v, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-white font-medium text-sm">{v.titre}</h4>
                      <CriticalityBadge criticite={v.criticite} />
                    </div>
                    <p className="text-gray-400 text-sm">{v.description}</p>
                    {v.cve_associes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {v.cve_associes.map(cve => (
                          <span key={cve} className="text-xs font-mono bg-gray-700 text-blue-400 px-2 py-0.5 rounded">
                            {cve}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points positifs */}
          {ai.points_positifs?.length > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-300 font-medium text-sm">Points positifs</span>
              </div>
              <ul className="space-y-1">
                {ai.points_positifs.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avertissement IA */}
          <div className="text-xs text-gray-600 border border-gray-700/30 rounded-lg p-3">
            ⚠️ {ai.avertissement || "Cette analyse est générée par IA et ne remplace pas un audit de sécurité professionnel."}
          </div>
        </div>
      )}

      {/* Onglet CVE */}
      {activeTab === 'cves' && (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            {cves.length} vulnérabilité{cves.length > 1 ? 's' : ''} trouvée{cves.length > 1 ? 's' : ''} sur l'historique complet
          </p>
          {cves.map(cve => (
            <div
              key={cve.id}
              onClick={() => setSelected(cve)}
              className="flex items-start justify-between p-4 bg-gray-800/40 border border-gray-700/30 rounded-xl hover:border-gray-600/50 cursor-pointer transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {cve.actif_exploit && <Zap size={12} className="text-red-400 shrink-0" />}
                  <span className="font-mono text-blue-400 text-xs font-semibold">{cve.id}</span>
                  <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded ml-auto uppercase shrink-0">
                    {cve.source}
                  </span>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2">
                  {cve.resume_ia || cve.description?.slice(0, 150) + '...'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                  {cve.date_publication && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(cve.date_publication).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  <span>Pertinence: {cve.pertinence}</span>
                </div>
              </div>
              <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400 shrink-0 ml-3 mt-1 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* Onglet Recommandations */}
      {activeTab === 'recommendations' && ai.recommandations && (
        <div className="space-y-4">
          {[
            {
              key: 'immediat',
              label: '🚨 Actions immédiates',
              desc: 'À faire aujourd\'hui',
              color: 'red'
            },
            {
              key: 'cette_semaine',
              label: '⚠️ Cette semaine',
              desc: 'Dans les 7 prochains jours',
              color: 'orange'
            },
            {
              key: 'ce_mois',
              label: '📅 Ce mois',
              desc: 'Dans les 30 prochains jours',
              color: 'blue'
            },
          ].map(({ key, label, desc, color }) => {
            const items = ai.recommandations[key] || []
            if (!items.length) return null
            const colors = {
              red:    'border-red-500/20 bg-red-500/5',
              orange: 'border-orange-500/20 bg-orange-500/5',
              blue:   'border-blue-500/20 bg-blue-500/5',
            }
            return (
              <div key={key} className={`border rounded-xl p-4 ${colors[color]}`}>
                <h3 className="text-white font-medium mb-1">{label}</h3>
                <p className="text-gray-500 text-xs mb-3">{desc}</p>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <TrendingUp size={14} className="shrink-0 mt-0.5 text-gray-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {selected && <CVEDetail cve={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}