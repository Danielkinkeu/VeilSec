// frontend/src/components/RGPDBanner.jsx
import { Shield, X, Info } from 'lucide-react'
import { useState } from 'react'

export default function RGPDBanner({ onAccept }) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-blue-500/30 rounded-xl shadow-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg shrink-0">
            <Shield size={20} className="text-blue-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              🔒 Vos données restent sur votre appareil
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Les informations que vous saisissez sur votre stack technique sont stockées
              <strong className="text-white"> uniquement dans votre navigateur</strong> (SessionStorage)
              et sont <strong className="text-white">automatiquement supprimées</strong> à la
              fermeture de l'onglet. Aucune donnée personnelle n'est envoyée à nos serveurs.
              Seuls les noms de technologies (ex: Apache, Linux) sont utilisés pour la recherche.
            </p>

            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Aucun cookie de tracking
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Données supprimées à la fermeture
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Conformité RGPD
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Zéro donnée personnelle
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => { setVisible(false); onAccept?.() }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Compris
            </button>
            <button
              onClick={() => setVisible(false)}
              className="text-gray-500 hover:text-gray-300 text-xs text-center transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}