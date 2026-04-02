// frontend/src/pages/Sources.jsx
import { useEffect, useState } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import { getSources, triggerSource } from '../api/client'

const STATUS_CONFIG = {
  success: { icon: CheckCircle, color: 'text-green-400', label: 'Succès' },
  error:   { icon: XCircle, color: 'text-red-400', label: 'Erreur' },
  running: { icon: Loader, color: 'text-blue-400', label: 'En cours' },
  idle:    { icon: Clock, color: 'text-gray-400', label: 'En attente' },
}

export default function Sources() {
  const [sources, setSources] = useState([])
  const [triggering, setTriggering] = useState(null)

  const load = async () => {
    const data = await getSources()
    setSources(data)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleTrigger = async (nom) => {
    setTriggering(nom)
    try {
      await triggerSource(nom)
      setTimeout(load, 2000)
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Sources de données</h1>

      <div className="grid gap-4">
        {sources.map(source => {
          const cfg = STATUS_CONFIG[source.statut] || STATUS_CONFIG.idle
          const Icon = cfg.icon

          return (
            <div key={source.nom} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={18} className={`${cfg.color} ${source.statut === 'running' ? 'animate-spin' : ''}`} />
                  <div>
                    <h3 className="text-white font-semibold uppercase">{source.nom}</h3>
                    <p className={`text-xs ${cfg.color}`}>{cfg.label}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTrigger(source.nom)}
                  disabled={triggering === source.nom || source.statut === 'running'}
                  className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={12} className={triggering === source.nom ? 'animate-spin' : ''} />
                  Forcer collecte
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700/50">
                <div>
                  <p className="text-gray-500 text-xs">Total collecté</p>
                  <p className="text-white font-semibold">{source.nb_cve_total}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Dernière collecte</p>
                  <p className="text-white font-semibold">
                    {source.nb_cve_dernier} CVE
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Dernière mise à jour</p>
                  <p className="text-white font-semibold text-xs">
                    {source.derniere_collecte
                      ? new Date(source.derniere_collecte).toLocaleString('fr-FR')
                      : '—'}
                  </p>
                </div>
              </div>

              {source.erreur && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-xs font-mono">{source.erreur}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}