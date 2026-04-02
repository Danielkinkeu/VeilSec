// frontend/src/components/CVEDetail.jsx
import { X, ExternalLink, Bot, Zap, Shield } from 'lucide-react'
import CriticalityBadge from './CriticalityBadge'

export default function CVEDetail({ cve, onClose }) {
  if (!cve) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-blue-400 font-bold text-lg">{cve.id}</span>
              {cve.actif_exploit && (
                <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  <Zap size={10} /> Activement exploité
                </span>
              )}
            </div>
            <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Source', value: cve.source?.toUpperCase() },
              { label: 'CWE', value: cve.cwe || '—' },
              { label: 'Auteur', value: cve.auteur || '—' },
              { label: 'Publication', value: cve.date_publication ? new Date(cve.date_publication).toLocaleDateString('fr-FR') : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Systèmes affectés */}
          {cve.systemes?.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">Systèmes affectés</p>
              <div className="flex flex-wrap gap-2">
                {cve.systemes.map(s => (
                  <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg border border-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-gray-400 text-sm font-medium mb-2">Description</p>
            <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/30 rounded-lg p-4">
              {cve.description}
            </p>
          </div>

          {/* Enrichissement IA */}
          {cve.enrichi && (
            <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} className="text-blue-400" />
                <span className="text-blue-400 font-medium text-sm">
                  Analyse IA — {cve.llm_provider}
                </span>
              </div>

              {cve.resume_ia && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Résumé</p>
                  <p className="text-gray-300 text-sm">{cve.resume_ia}</p>
                </div>
              )}

              {cve.impact_ia && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Impact</p>
                  <p className="text-gray-300 text-sm">{cve.impact_ia}</p>
                </div>
              )}

              {cve.recommandation_ia && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Shield size={12} className="text-green-400" />
                    <p className="text-gray-500 text-xs">Recommandation</p>
                  </div>
                  <p className="text-gray-300 text-sm">{cve.recommandation_ia}</p>
                </div>
              )}
            </div>
          )}

          {/* Lien */}
          
            <a href={cve.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            <ExternalLink size={14} />
            Voir l'advisory officiel
          </a>
        </div>
      </div>
    </div>
  )
}