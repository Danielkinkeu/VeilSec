// frontend/src/pages/AdvancedSearch.jsx
import { useState } from 'react'
import {
  Search, Filter, X, ChevronDown, ChevronUp,
  Download, RefreshCw, Bot, Zap, ExternalLink
} from 'lucide-react'
import CriticalityBadge from '../components/CriticalityBadge'
import CVEDetail from '../components/CVEDetail'
import { getCVEs } from '../api/client'

// ─── Constantes ───────────────────────────────────────────────────────────────
const CRITICITES  = ['CRITIQUE', 'HAUTE', 'MOYENNE', 'FAIBLE', 'INCONNUE']
const SOURCES     = ['nvd', 'cisa', 'github', 'exploitdb']
const URGENCES    = ['IMMEDIATE', 'HAUTE', 'NORMALE', 'FAIBLE']
const TRIS        = [
  { value: 'date_collecte', label: 'Date de collecte' },
  { value: 'score_cvss',    label: 'Score CVSS' },
  { value: 'criticite',     label: 'Criticité' },
]
const CWE_TYPES = [
  { value: 'CWE-79',  label: 'CWE-79 — Cross-Site Scripting (XSS)' },
  { value: 'CWE-89',  label: 'CWE-89 — Injection SQL' },
  { value: 'CWE-119', label: 'CWE-119 — Buffer Overflow' },
  { value: 'CWE-787', label: 'CWE-787 — Écriture hors limites' },
  { value: 'CWE-416', label: 'CWE-416 — Use After Free' },
  { value: 'CWE-22',  label: 'CWE-22 — Path Traversal' },
  { value: 'CWE-78',  label: 'CWE-78 — Injection de commandes' },
  { value: 'CWE-434', label: 'CWE-434 — Upload fichier dangereux' },
  { value: 'CWE-306', label: 'CWE-306 — Authentification manquante' },
  { value: 'CWE-863', label: 'CWE-863 — Autorisation incorrecte' },
  { value: 'CWE-20',  label: 'CWE-20 — Validation incorrecte' },
  { value: 'CWE-732', label: 'CWE-732 — Permissions incorrectes' },
]

// ─── Composant chip de filtre actif ───────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X size={10} />
      </button>
    </span>
  )
}

// ─── Composant toggle checkbox ─────────────────────────────────────────────────
function CheckGroup({ label, options, selected, onChange }) {
  return (
    <div>
      <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value
          const display = typeof opt === 'string' ? opt : opt.label
          const isSelected = selected.includes(value)
          return (
            <button
              key={value}
              onClick={() => onChange(
                isSelected ? selected.filter(s => s !== value) : [...selected, value]
              )}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500'
              }`}
            >
              {display}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function AdvancedSearch() {
  // Filtres textuels
  const [search, setSearch]       = useState('')
  const [cveId, setCveId]         = useState('')
  const [systeme, setSysteme]     = useState('')

  // Filtres à choix multiples
  const [criticites, setCriticites]   = useState([])
  const [sources, setSources]         = useState([])
  const [urgences, setUrgences]       = useState([])
  const [cwes, setCwes]               = useState([])

  // Filtres booléens
  const [enrichiOnly, setEnrichiOnly]         = useState(false)
  const [exploitOnly, setExploitOnly]         = useState(false)
  const [avecScoreOnly, setAvecScoreOnly]     = useState(false)

  // Plage de score CVSS
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')

  // Plage de dates
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin]     = useState('')

  // UI
  const [filtersOpen, setFiltersOpen]   = useState(true)
  const [sortBy, setSortBy]             = useState('date_collecte')
  const [order, setOrder]               = useState('desc')
  const [page, setPage]                 = useState(1)
  const [selected, setSelected]         = useState(null)

  // Résultats
  const [results, setResults]   = useState([])
  const [total, setTotal]       = useState(null)
  const [pages, setPages]       = useState(1)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  // ─── Calcul des filtres actifs ───────────────────────────────────────────────
  const activeFilters = [
    ...(search       ? [{ label: `Mot-clé: "${search}"`,    clear: () => setSearch('') }]        : []),
    ...(cveId        ? [{ label: `ID: ${cveId}`,            clear: () => setCveId('') }]          : []),
    ...(systeme      ? [{ label: `Système: ${systeme}`,     clear: () => setSysteme('') }]        : []),
    ...(scoreMin     ? [{ label: `Score ≥ ${scoreMin}`,     clear: () => setScoreMin('') }]       : []),
    ...(scoreMax     ? [{ label: `Score ≤ ${scoreMax}`,     clear: () => setScoreMax('') }]       : []),
    ...(dateDebut    ? [{ label: `Depuis: ${dateDebut}`,    clear: () => setDateDebut('') }]      : []),
    ...(dateFin      ? [{ label: `Jusqu'au: ${dateFin}`,    clear: () => setDateFin('') }]        : []),
    ...(enrichiOnly  ? [{ label: 'Enrichis IA uniquement',  clear: () => setEnrichiOnly(false) }] : []),
    ...(exploitOnly  ? [{ label: 'Activement exploités',    clear: () => setExploitOnly(false) }] : []),
    ...(avecScoreOnly? [{ label: 'Avec score CVSS',         clear: () => setAvecScoreOnly(false)}]: []),
    ...criticites.map(c  => ({ label: `Criticité: ${c}`,   clear: () => setCriticites(v => v.filter(x => x !== c)) })),
    ...sources.map(s     => ({ label: `Source: ${s}`,      clear: () => setSources(v => v.filter(x => x !== s)) })),
    ...urgences.map(u    => ({ label: `Urgence IA: ${u}`,  clear: () => setUrgences(v => v.filter(x => x !== u)) })),
    ...cwes.map(c        => ({ label: c,                   clear: () => setCwes(v => v.filter(x => x !== c)) })),
  ]

  // ─── Reset tout ─────────────────────────────────────────────────────────────
  const resetAll = () => {
    setSearch(''); setCveId(''); setSysteme('')
    setCriticites([]); setSources([]); setUrgences([]); setCwes([])
    setEnrichiOnly(false); setExploitOnly(false); setAvecScoreOnly(false)
    setScoreMin(''); setScoreMax('')
    setDateDebut(''); setDateFin('')
    setResults([]); setTotal(null); setSearched(false)
  }

  // ─── Lancer la recherche ─────────────────────────────────────────────────────
  const handleSearch = async (pageNum = 1) => {
    setLoading(true)
    setSearched(true)
    setPage(pageNum)

    try {
      const params = {
        page: pageNum,
        limit: 25,
        sort_by: sortBy,
        order,
      }

      // Texte libre — recherche dans ID + description + titre
      if (search)   params.search = search
      if (cveId)    params.search = cveId  // priorité à l'ID exact

      // Filtres simples
      if (criticites.length === 1) params.criticite   = criticites[0]
      if (sources.length === 1)    params.source       = sources[0]
      if (enrichiOnly)             params.enrichi      = true
      if (exploitOnly)             params.actif_exploit = true

      const data = await getCVEs(params)

      // Post-filtrage client pour les critères non supportés par l'API
      let filtered = data.data

      if (criticites.length > 1)
        filtered = filtered.filter(c => criticites.includes(c.criticite))

      if (sources.length > 1)
        filtered = filtered.filter(c => sources.includes(c.source))

      if (cwes.length > 0)
        filtered = filtered.filter(c => cwes.includes(c.cwe))

      if (urgences.length > 0)
        filtered = filtered.filter(c => urgences.includes(c.urgence_ia))

      if (systeme)
        filtered = filtered.filter(c =>
          c.systemes?.some(s => s.toLowerCase().includes(systeme.toLowerCase()))
        )

      if (scoreMin !== '')
        filtered = filtered.filter(c => c.score_cvss !== null && c.score_cvss >= parseFloat(scoreMin))

      if (scoreMax !== '')
        filtered = filtered.filter(c => c.score_cvss !== null && c.score_cvss <= parseFloat(scoreMax))

      if (avecScoreOnly)
        filtered = filtered.filter(c => c.score_cvss !== null)

      if (dateDebut)
        filtered = filtered.filter(c => c.date_publication && c.date_publication >= dateDebut)

      if (dateFin)
        filtered = filtered.filter(c => c.date_publication && c.date_publication <= dateFin + 'T23:59:59')

      setResults(filtered)
      setTotal(data.total)
      setPages(data.pages)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['ID', 'Criticité', 'Score CVSS', 'Source', 'CWE', 'Systèmes', 'Date', 'Enrichi', 'Résumé IA']
    const rows = results.map(c => [
      c.id, c.criticite, c.score_cvss ?? '',
      c.source, c.cwe ?? '',
      (c.systemes || []).join(' | '),
      c.date_publication ? new Date(c.date_publication).toLocaleDateString('fr-FR') : '',
      c.enrichi ? 'Oui' : 'Non',
      (c.resume_ia || '').replace(/,/g, ';')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `veilsec_export_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">

      {/* Titre */}
      <div>
        <h1 className="text-2xl font-bold text-white">Recherche avancée</h1>
        <p className="text-gray-400 text-sm mt-1">
          Combinez plusieurs critères pour trouver exactement les vulnérabilités qui vous concernent
        </p>
      </div>

      {/* Panneau de filtres */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">

        {/* Header filtres */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/20 transition-colors"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-400" />
            <span className="text-white font-medium">Filtres de recherche</span>
            {activeFilters.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilters.length} actif{activeFilters.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {filtersOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>

        {filtersOpen && (
          <div className="p-5 border-t border-gray-700/50 space-y-5">

            {/* Ligne 1 — Recherche texte */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">
                  Mot-clé (description / titre)
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="ex: buffer overflow, apache..."
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">
                  ID exact (CVE / GHSA / EDB)
                </label>
                <input
                  value={cveId}
                  onChange={e => setCveId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="ex: CVE-2026-1234"
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">
                  Système / Logiciel ciblé
                </label>
                <input
                  value={systeme}
                  onChange={e => setSysteme(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="ex: Linux, Apache, Windows..."
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ligne 2 — Criticité + Source */}
            <CheckGroup
              label="Criticité"
              options={CRITICITES}
              selected={criticites}
              onChange={setCriticites}
            />

            <CheckGroup
              label="Source de données"
              options={SOURCES}
              selected={sources}
              onChange={setSources}
            />

            {/* Ligne 3 — Type de menace CWE */}
            <CheckGroup
              label="Type de menace (CWE)"
              options={CWE_TYPES}
              selected={cwes}
              onChange={setCwes}
            />

            {/* Ligne 4 — Urgence IA */}
            <CheckGroup
              label="Urgence selon l'IA"
              options={URGENCES}
              selected={urgences}
              onChange={setUrgences}
            />

            {/* Ligne 5 — Score CVSS + Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">
                  Score CVSS (0 à 10)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="10" step="0.1"
                    value={scoreMin}
                    onChange={e => setScoreMin(e.target.value)}
                    placeholder="Min (ex: 7.0)"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-500 text-sm shrink-0">→</span>
                  <input
                    type="number" min="0" max="10" step="0.1"
                    value={scoreMax}
                    onChange={e => setScoreMax(e.target.value)}
                    placeholder="Max (ex: 10)"
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">
                  Période de publication
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateDebut}
                    onChange={e => setDateDebut(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-500 text-sm shrink-0">→</span>
                  <input
                    type="date"
                    value={dateFin}
                    onChange={e => setDateFin(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Ligne 6 — Options booléennes */}
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Options</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: '🤖 Analysés par IA uniquement', value: enrichiOnly, set: setEnrichiOnly },
                  { label: '⚡ Activement exploités',       value: exploitOnly,  set: setExploitOnly },
                  { label: '📊 Avec score CVSS uniquement', value: avecScoreOnly, set: setAvecScoreOnly },
                ].map(({ label, value, set }) => (
                  <button
                    key={label}
                    onClick={() => set(!value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      value
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      value ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
                    }`}>
                      {value && <span className="text-white text-xs">✓</span>}
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ligne 7 — Tri */}
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Trier par</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {TRIS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-2">Ordre</label>
                <select
                  value={order}
                  onChange={e => setOrder(e.target.value)}
                  className="bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="desc">Plus récent d'abord</option>
                  <option value="asc">Plus ancien d'abord</option>
                </select>
              </div>
            </div>

            {/* Boutons action */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-700/40">
              <button
                onClick={() => handleSearch(1)}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recherche...</>
                  : <><Search size={16} /> Rechercher</>
                }
              </button>

              <button
                onClick={resetAll}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2.5 rounded-lg transition-colors"
              >
                <RefreshCw size={14} /> Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-500 text-xs">Filtres actifs :</span>
          {activeFilters.map((f, i) => (
            <FilterChip key={i} label={f.label} onRemove={f.clear} />
          ))}
        </div>
      )}

      {/* Résultats */}
      {searched && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">

          {/* Header résultats */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <span className="text-white font-medium">
              {loading ? 'Recherche en cours...' : `${results.length} résultat${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`}
            </span>
            {results.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download size={12} /> Exporter CSV
              </button>
            )}
          </div>

          {/* Table résultats */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucune vulnérabilité ne correspond à vos critères</p>
              <p className="text-xs mt-1">Essayez d'élargir vos filtres</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      {['ID', 'Criticité', 'Type (CWE)', 'Systèmes', 'Source', 'IA', 'Date', ''].map(h => (
                        <th key={h} className="text-left text-gray-400 font-medium py-3 px-4 text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {results.map(cve => (
                      <tr
                        key={cve.id}
                        onClick={() => setSelected(cve)}
                        className="hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {cve.actif_exploit && <Zap size={11} className="text-red-400 shrink-0" />}
                            <span className="text-blue-400 font-mono text-xs">{cve.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <CriticalityBadge criticite={cve.criticite} score={cve.score_cvss} />
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{cve.cwe || '—'}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs max-w-[180px] truncate">
                          {cve.systemes?.slice(0, 2).join(', ') || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full uppercase">
                            {cve.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Bot size={13} className={cve.enrichi ? 'text-green-400' : 'text-gray-600'} />
                            {cve.urgence_ia && (
                              <span className={`text-xs ${
                                cve.urgence_ia === 'IMMEDIATE' ? 'text-red-400' :
                                cve.urgence_ia === 'HAUTE'     ? 'text-orange-400' :
                                'text-gray-500'
                              }`}>{cve.urgence_ia}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {cve.date_publication ? new Date(cve.date_publication).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-3 px-4">
                          
                            <a href={cve.lien} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-gray-500 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-700/50">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors"
                  >
                    ← Précédent
                  </button>
                  <span className="text-gray-400 text-sm">Page {page} / {pages}</span>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={page === pages}
                    className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 disabled:opacity-40 hover:border-gray-500 transition-colors"
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selected && <CVEDetail cve={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}