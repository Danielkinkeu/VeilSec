// frontend/src/components/CriticalityBadge.jsx

const config = {
  CRITIQUE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  HAUTE:    { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  MOYENNE:  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  FAIBLE:   { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
  INCONNUE: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-400' },
}

export default function CriticalityBadge({ criticite, score }) {
  const c = config[criticite] || config.INCONNUE
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {criticite}
      {score && <span className="opacity-70">({score})</span>}
    </span>
  )
}