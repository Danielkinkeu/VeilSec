// frontend/src/pages/CVEList.jsx
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import CVETable from '../components/CVETable'
import CVEDetail from '../components/CVEDetail'
import { getCVEs } from '../api/client'

const CRITICITES = ['', 'CRITIQUE', 'HAUTE', 'MOYENNE', 'FAIBLE', 'INCONNUE']
const SOURCES = ['', 'nvd', 'cisa', 'github', 'exploitdb']

export default function CVEList() {
  const [cves, setCves] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ criticite: '', source: '', search: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, sort_by: 'date_collecte', order: 'desc' }
      if (filters.criticite) params.criticite = filters.criticite
      if (filters.source) params.source = filters.source
      if (filters.search) params.search = filters.search
      const data = await getCVEs(params)
      setCves(data.data)
      setTotal(data.total)
      setPages(data.pages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, filters])

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">CVE List</h1>
        <span className="text-gray-400 text-sm">{total} résultats</span>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-56"
          />
        </div>

        <select
          value={filters.criticite}
          onChange={e => setFilter('criticite', e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          {CRITICITES.map(c => <option key={c} value={c}>{c || 'Toutes criticités'}</option>)}
        </select>

        <select
          value={filters.source}
          onChange={e => setFilter('source', e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          {SOURCES.map(s => <option key={s} value={s}>{s || 'Toutes sources'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl">
        {loading
          ? <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          : <CVETable cves={cves} onSelect={setSelected} />
        }
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors">
            ← Précédent
          </button>
          <span className="text-gray-400 text-sm">Page {page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors">
            Suivant →
          </button>
        </div>
      )}

      {selected && <CVEDetail cve={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}