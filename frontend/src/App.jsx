// frontend/src/App.jsx

import { useState, useEffect } from 'react'
import { Shield, LayoutDashboard, List, Radio, Menu, Search } from 'lucide-react'
import Dashboard      from './pages/Dashboard'
import CVEList        from './pages/CVEList'
import Sources        from './pages/Sources'
import AdvancedSearch from './pages/AdvancedSearch'
import StackAnalyzer  from './pages/StackAnalyzer'
import Landing        from './pages/Landing'

// ─── Navigation principale ────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'cves',      label: 'CVE List',            icon: List },
  { id: 'search',    label: 'Recherche avancée',   icon: Search },
  { id: 'stack',     label: 'Mon analyse',         icon: Shield },
  { id: 'sources',   label: 'Sources',             icon: Radio },
]

// ─── Mapping pages ────────────────────────────────────────────────
const PAGES = {
  dashboard: Dashboard,
  cves:      CVEList,
  search:    AdvancedSearch,
  stack:     StackAnalyzer,
  sources:   Sources,
}

export default function App() {

  // ─── État de navigation ─────────────────────────────────────────
  const [page, setPage]         = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  // ─── Gestion Landing page ───────────────────────────────────────
  // Si l'utilisateur n'a jamais visité → afficher la landing
  const [hasVisited, setHasVisited] = useState(
    () => sessionStorage.getItem('veilsec_visited') === 'true'
  )

  /**
   * Écoute les événements de navigation custom.
   * Permet aux composants enfants de naviguer sans props drilling.
   * Usage : window.dispatchEvent(new CustomEvent('navigate', { detail: 'stack' }))
   */
  useEffect(() => {
    const handler = (e) => {
      setPage(e.detail)
      setMenuOpen(false)
    }
    window.addEventListener('navigate', handler)
    return () => window.removeEventListener('navigate', handler)
  }, [])

  /**
   * Appelé depuis la Landing page quand l'utilisateur clique
   * sur "Accéder au dashboard".
   * Marque la visite en SessionStorage pour ne plus afficher la landing.
   */
  const handleEnter = () => {
    sessionStorage.setItem('veilsec_visited', 'true')
    setHasVisited(true)
    setPage('dashboard')
  }

  /**
   * Navigation interne — met à jour l'URL et la page active.
   */
  const navigate = (id) => {
    window.history.pushState({}, '', `/${id}`)
    setPage(id)
    setMenuOpen(false)
  }

  // ─── Afficher la Landing si première visite ─────────────────────
  if (!hasVisited) {
    return <Landing onEnter={handleEnter} />
  }

  // ─── Page active ─────────────────────────────────────────────────
  const Page = PAGES[page] || Dashboard

  return (
    <div className="min-h-screen bg-gray-950 text-white flex h-screen overflow-hidden">

      {/* ─── Sidebar fixe ──────────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64
        bg-gray-900 border-r border-gray-800
        flex flex-col h-screen overflow-y-auto
        transform transition-transform
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-800 shrink-0">
          <div className="w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-white">VeilSec</span>
            <p className="text-xs text-gray-500">Vulnerability Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                page === id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Lien vers la Landing en bas de sidebar */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <button
            onClick={() => {
              sessionStorage.removeItem('veilsec_visited')
              setHasVisited(false)
            }}
            className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors text-left"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </aside>

      {/* ─── Overlay mobile ────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ─── Zone principale ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Topbar */}
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-gray-300 font-medium capitalize">
            {NAV.find(n => n.id === page)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">En ligne</span>
          </div>
        </header>

        {/* Contenu — seule zone scrollable */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Page />
        </main>
      </div>
    </div>
  )
}