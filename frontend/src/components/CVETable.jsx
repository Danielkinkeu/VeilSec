// frontend/src/components/CVETable.jsx
import { ExternalLink, Bot, Zap } from 'lucide-react'
import CriticalityBadge from './CriticalityBadge'

export default function CVETable({ cves, onSelect }) {
  if (!cves?.length) return (
    <div className="text-center py-12 text-gray-500">Aucun CVE trouvé</div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/50">
            {['ID', 'Criticité', 'Systèmes', 'Source', 'IA', 'Date', ''].map(h => (
              <th key={h} className="text-left text-gray-400 font-medium py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/30">
          {cves.map(cve => (
            <tr
              key={cve.id}
              onClick={() => onSelect(cve)}
              className="hover:bg-gray-700/30 cursor-pointer transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {cve.actif_exploit && (
                    <Zap size={12} className="text-red-400 shrink-0" title="Activement exploité" />
                  )}
                  <span className="text-blue-400 font-mono text-xs">{cve.id}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
              </td>
              <td className="py-3 px-4 text-gray-400 max-w-[200px] truncate">
                {cve.systemes?.length > 0 ? cve.systemes.slice(0, 2).join(', ') : '—'}
              </td>
              <td className="py-3 px-4">
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full uppercase">
                  {cve.source}
                </span>
              </td>
              <td className="py-3 px-4">
                {cve.enrichi
                  ? <Bot size={14} className="text-green-400" title={`Enrichi par ${cve.llm_provider}`} />
                  : <Bot size={14} className="text-gray-600" title="Non enrichi" />
                }
              </td>
              <td className="py-3 px-4 text-gray-500 text-xs">
                {cve.date_publication ? new Date(cve.date_publication).toLocaleDateString('fr-FR') : '—'}
              </td>
              <td className="py-3 px-4">
                
                 <a href={cve.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}