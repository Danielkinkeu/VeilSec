// frontend/src/components/charts/EvolutionChart.jsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function EvolutionChart({ data }) {
  if (!data) return null

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Évolution sur 7 jours</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="critiqueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#9ca3af' }}
          />
          <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#totalGrad)" name="Total" />
          <Area type="monotone" dataKey="critiques" stroke="#ef4444" fill="url(#critiqueGrad)" name="Critiques" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}