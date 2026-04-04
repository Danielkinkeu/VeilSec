// frontend/src/components/StackResultsModal.jsx

import { useState } from 'react'
import {
  X, Shield, Zap, Bot, Target,
  TrendingUp, CheckCircle, ExternalLink, Download
} from 'lucide-react'
import CriticalityBadge from './CriticalityBadge'
import CVEDetail from './CVEDetail'
import { generateStackReport } from '../utils/pdfExport'

// ─── Score de risque visuel ────────────────────────────────────────
function RiskScore({ score, niveau }) {
  const config = {
    'CRITIQUE': { color: 'text-red-400',    bar: 'bg-red-500',    border: 'border-red-500/30 bg-red-500/10' },
    'ÉLEVÉ':    { color: 'text-orange-400', bar: 'bg-orange-500', border: 'border-orange-500/30 bg-orange-500/10' },
    'MODÉRÉ':   { color: 'text-yellow-400', bar: 'bg-yellow-500', border: 'border-yellow-500/30 bg-yellow-500/10' },
    'FAIBLE':   { color: 'text-green-400',  bar: 'bg-green-500',  border: 'border-green-500/30 bg-green-500/10' },
    'INCONNU':  { color: 'text-gray-400',   bar: 'bg-gray-500',   border: 'border-gray-500/30 bg-gray-500/10' },
  }
  const c = config[niveau] || config['INCONNU']
  const pct = Math.min(100, (score / 10) * 100)

  return (
    <div className={`border rounded-xl p-5 ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Score de risque global
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${c.color}`}>{score}</span>
            <span className="text-gray-500 text-lg">/10</span>
          </div>
        </div>
        <div className={`text-xl font-bold px-4 py-2 rounded-lg border ${c.border} ${c.color}`}>
          {niveau}
        </div>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Modal principale ──────────────────────────────────────────────
export default function StackResultsModal({ results, stack, onClose }) {
  const [activeTab, setActiveTab]     = useState('overview')
  const [selectedCve, setSelectedCve] = useState(null)
  const [generating, setGenerating]   = useState(false)

  const ai    = results?.analyse_ia     || {}
  const stats = results?.statistiques   || {}
  const cves  = results?.vulnerabilites || []

  // Technologies sélectionnées pour affichage dans le header
  const techList = stack
    ? Object.entries(stack)
        .filter(([k]) => k !== 'saved_at')
        .flatMap(([, v]) => (Array.isArray(v) ? v : []))
        .filter(Boolean)
    : []

  /**
   * Génère et télécharge le rapport PDF.
   * Utilise jsPDF + jspdf-autotable.
   */
  const handleDownloadPDF = () => {
    setGenerating(true)
    try {
      generateStackReport(results, stack)
    } catch (err) {
      console.error('Erreur génération PDF :', err)
    } finally {
      // Petit délai pour que l'animation soit visible
      setTimeout(() => setGenerating(false), 1000)
    }
  }

  return (
    <>
      {/* ─── Overlay ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl my-4">

          {/* ─── Header ────────────────────────────────────────────── */}
          <div className="flex items-start justify-between p-6 border-b border-gray-700">

            {/* Titre + technologies */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-xl flex items-center gap-2 mb-2">
                <Shield size={20} className="text-blue-400 shrink-0" />
                Résultats de votre analyse
              </h2>
              <div className="flex flex-wrap gap-2">
                {techList.slice(0, 5).map(tech => (
                  <span
                    key={tech}
                    className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-0.5 rounded-full capitalize"
                  >
                    {tech}
                  </span>
                ))}
                {techList.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{techList.length - 5} autres
                  </span>
                )}
              </div>
            </div>

            {/* Actions : Télécharger PDF + Fermer */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button
                onClick={handleDownloadPDF}
                disabled={generating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Télécharger PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ─── Contenu ───────────────────────────────────────────── */}
          <div className="p-6 space-y-5">

            {/* Avertissement RGPD */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/30 border border-gray-700/30 rounded-lg px-3 py-2">
              <Shield size={12} className="text-green-400 shrink-0" />
              Données stockées uniquement dans ce navigateur — supprimées à la fermeture de l'onglet.
            </div>

            {/* Score de risque */}
            {ai.score_risque_global !== undefined && (
              <RiskScore
                score={ai.score_risque_global}
                niveau={ai.niveau_risque || 'INCONNU'}
              />
            )}

            {/* Stats rapides */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total',        value: results.total_vulnerabilites, color: 'text-white' },
                { label: '🔴 Critiques', value: stats.critiques,              color: 'text-red-400' },
                { label: '🟠 Hautes',    value: stats.hautes,                 color: 'text-orange-400' },
                { label: '⚡ Exploitées', value: stats.actifs_exploit,        color: 'text-red-300' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center"
                >
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value ?? 0}</p>
                </div>
              ))}
            </div>

            {/* Onglets */}
            <div className="flex gap-1 bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
              {[
                { id: 'overview',         label: '🤖 Analyse IA' },
                { id: 'cves',             label: `🔍 CVE (${cves.length})` },
                { id: 'recommendations',  label: '🛡️ Actions' },
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

            {/* ─── Onglet Analyse IA ────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-4">

                {ai.resume_exposition && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot size={14} className="text-blue-400" />
                      <span className="text-blue-300 font-medium text-sm">
                        Résumé de l'exposition
                      </span>
                      <span className="text-xs text-gray-600 ml-auto">par DeepSeek AI</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {ai.resume_exposition}
                    </p>
                  </div>
                )}

                {ai.impact_potentiel && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-red-400" />
                      <span className="text-red-300 font-medium text-sm">Impact potentiel</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {ai.impact_potentiel}
                    </p>
                  </div>
                )}

                {ai.vecteurs_attaque?.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm">
                      <Zap size={14} className="text-orange-400" />
                      Vecteurs d'attaque identifiés
                    </h3>
                    <div className="space-y-2">
                      {ai.vecteurs_attaque.map((v, i) => (
                        <div
                          key={i}
                          className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3"
                        >
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className="text-white font-medium text-sm">{v.titre}</h4>
                            <CriticalityBadge criticite={v.criticite} />
                          </div>
                          <p className="text-gray-400 text-xs">{v.description}</p>
                          {v.cve_associes?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {v.cve_associes.map(cve => (
                                <span
                                  key={cve}
                                  className="text-xs font-mono bg-gray-700 text-blue-400 px-2 py-0.5 rounded"
                                >
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

                {ai.points_positifs?.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} className="text-green-400" />
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

                <p className="text-xs text-gray-600 border border-gray-700/30 rounded-lg p-3">
                  ⚠️ {ai.avertissement || "Cette analyse est générée par IA et ne remplace pas un audit de sécurité professionnel."}
                </p>
              </div>
            )}

            {/* ─── Onglet CVE ───────────────────────────────────────── */}
            {activeTab === 'cves' && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <p className="text-gray-400 text-xs mb-3">
                  {cves.length} vulnérabilité{cves.length > 1 ? 's' : ''} trouvée{cves.length > 1 ? 's' : ''} sur l'historique complet
                </p>
                {cves.map(cve => (
                  <div
                    key={cve.id}
                    onClick={() => setSelectedCve(cve)}
                    className="flex items-start justify-between p-3 bg-gray-800/40 border border-gray-700/30 rounded-xl hover:border-gray-600/50 cursor-pointer transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {cve.actif_exploit && (
                          <Zap size={11} className="text-red-400 shrink-0" />
                        )}
                        <span className="font-mono text-blue-400 text-xs font-semibold">
                          {cve.id}
                        </span>
                        <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
                        <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded ml-auto uppercase shrink-0">
                          {cve.source}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-1">
                        {cve.resume_ia || cve.description?.slice(0, 100) + '...'}
                      </p>
                    </div>
                    <ExternalLink
                      size={12}
                      className="text-gray-600 group-hover:text-gray-400 shrink-0 ml-2 mt-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ─── Onglet Recommandations ───────────────────────────── */}
            {activeTab === 'recommendations' && ai.recommandations && (
              <div className="space-y-4">
                {[
                  { key: 'immediat',      label: '🚨 Actions immédiates', desc: "Aujourd'hui",        color: 'red' },
                  { key: 'cette_semaine', label: '⚠️ Cette semaine',       desc: '7 prochains jours',  color: 'orange' },
                  { key: 'ce_mois',       label: '📅 Ce mois',             desc: '30 prochains jours', color: 'blue' },
                ].map(({ key, label, desc, color }) => {
                  const items = ai.recommandations[key] || []
                  if (!items.length) return null

                  const colorClasses = {
                    red:    'border-red-500/20 bg-red-500/5',
                    orange: 'border-orange-500/20 bg-orange-500/5',
                    blue:   'border-blue-500/20 bg-blue-500/5',
                  }

                  return (
                    <div key={key} className={`border rounded-xl p-4 ${colorClasses[color]}`}>
                      <h3 className="text-white font-medium mb-0.5 text-sm">{label}</h3>
                      <p className="text-gray-500 text-xs mb-3">{desc}</p>
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <TrendingUp size={12} className="shrink-0 mt-1 text-gray-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Modal CVE detail par-dessus la modal principale */}
      {selectedCve && (
        <CVEDetail cve={selectedCve} onClose={() => setSelectedCve(null)} />
      )}
    </>
  )
}