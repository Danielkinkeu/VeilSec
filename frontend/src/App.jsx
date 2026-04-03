// frontend/src/App.jsx
import { useState } from 'react'
import { Shield, LayoutDashboard, List, Radio, Menu, X, Search } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CVEList from './pages/CVEList'
import Sources from './pages/Sources'
import AdvancedSearch from './pages/AdvancedSearch'

import StackAnalyzer from './pages/StackAnalyzer'
import StackResults from './pages/StackResults'
import { Search as SearchIcon } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cves', label: 'CVE List', icon: List },
  { id: 'search', label: 'Recherche avancée', icon: Search },
   { id: 'stack', label: 'Mon analyse', icon: Shield },
  { id: 'sources', label: 'Sources', icon: Radio },
]

export default function App() {
  const [page, setPage] = useState(() => {
  const path = window.location.pathname.replace('/', '') || 'dashboard'
  return path
})
  const [menuOpen, setMenuOpen] = useState(false)

  const pages = {
    dashboard: Dashboard,
    cves: CVEList,
    search: AdvancedSearch,
    stack: StackAnalyzer,     
    'stack-results': StackResults,  
    sources: Sources,
  }
  const Page = pages[page]

  const navigate = (id) => {
  window.history.pushState({}, '', `/${id}`)
  setPage(id)
  setMenuOpen(false)
}


  return (
    <div className="min-h-screen bg-gray-950 text-white flex h-screen overflow-hidden">

      {/* Sidebar — fixe, ne scroll pas */}
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

        {/* Nav */}
        <nav className="p-4 space-y-1 flex-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setPage(id); setMenuOpen(false) }}
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
      </aside>

      {/* Overlay mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main — scroll uniquement ici */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Topbar — fixe en haut */}
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-gray-300 font-medium capitalize">
            {NAV.find(n => n.id === page)?.label}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">En ligne</span>
          </div>
        </header>

        {/* Content — seule zone qui scroll */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Page />
        </main>
      </div>
    </div>
  )
}