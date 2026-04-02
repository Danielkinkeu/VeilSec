// frontend/src/components/charts/CriticalityChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  CRITIQUE: '#ef4444',
  HAUTE: '#f97316',
  MOYENNE: '#eab308',
  FAIBLE: '#22c55e',
  INCONNUE: '#6b7280',
}

export default function CriticalityChart({ stats }) {
  if (!stats) return null

  const data = [
    { name: 'Critique', value: stats.critiques, key: 'CRITIQUE' },
    { name: 'Haute', value: stats.hautes, key: 'HAUTE' },
    { name: 'Moyenne', value: stats.moyennes, key: 'MOYENNE' },
    { name: 'Faible', value: stats.faibles, key: 'FAIBLE' },
    { name: 'Inconnue', value: stats.inconnues, key: 'INCONNUE' },
  ].filter(d => d.value > 0)

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Répartition par criticité</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#9ca3af' }}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}