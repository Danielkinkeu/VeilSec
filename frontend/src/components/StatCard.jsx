// frontend/src/components/StatCard.jsx

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    red:    'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400',
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    green:  'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg bg-current/10`}>
            <Icon size={20} className="opacity-80" />
          </div>
        )}
      </div>
    </div>
  )
}