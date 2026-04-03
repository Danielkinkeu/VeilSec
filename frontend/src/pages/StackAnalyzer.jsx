// frontend/src/pages/StackAnalyzer.jsx
import { useState, useEffect, useNavigate } from 'react'
// import {  } from 'react-router-dom'
import {
  Shield, ChevronRight, AlertTriangle, Info,
  Monitor, Globe, Code, Database, Package,
  Server, Layout, RotateCcw, Search
} from 'lucide-react'
import { analyzeStack } from '../api/client'
import { saveStack, saveResults, loadStack, clearStack } from '../utils/stackStorage'
import RGPDBanner from '../components/RGPDBanner'

// ─── Données de la stack ───────────────────────────────────────────
const STACK_CONFIG = {
  os: {
    label: "Système d'exploitation",
    icon: Monitor,
    color: "blue",
    options: [
      { value: 'linux', label: 'Linux (générique)' },
      { value: 'ubuntu', label: 'Ubuntu' },
      { value: 'debian', label: 'Debian' },
      { value: 'centos', label: 'CentOS' },
      { value: 'redhat', label: 'Red Hat' },
      { value: 'windows', label: 'Windows Server' },
      { value: 'macos', label: 'macOS' },
      { value: 'alpine', label: 'Alpine Linux' },
    ]
  },
  serveurs_web: {
    label: "Serveur Web",
    icon: Globe,
    color: "green",
    options: [
      { value: 'apache', label: 'Apache HTTP Server' },
      { value: 'nginx', label: 'Nginx' },
      { value: 'iis', label: 'IIS (Microsoft)' },
      { value: 'tomcat', label: 'Apache Tomcat' },
      { value: 'caddy', label: 'Caddy' },
      { value: 'lighttpd', label: 'Lighttpd' },
    ]
  },
  langages: {
    label: "Langage / Runtime",
    icon: Code,
    color: "purple",
    options: [
      { value: 'php', label: 'PHP' },
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
      { value: 'nodejs', label: 'Node.js' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: '.net', label: '.NET / C#' },
      { value: 'perl', label: 'Perl' },
    ]
  },
  bases_de_donnees: {
    label: "Base de données",
    icon: Database,
    color: "orange",
    options: [
      { value: 'mysql', label: 'MySQL' },
      { value: 'postgresql', label: 'PostgreSQL' },
      { value: 'mongodb', label: 'MongoDB' },
      { value: 'redis', label: 'Redis' },
      { value: 'mssql', label: 'Microsoft SQL Server' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'mariadb', label: 'MariaDB' },
      { value: 'oracle', label: 'Oracle DB' },
      { value: 'elasticsearch', label: 'Elasticsearch' },
    ]
  },
  frameworks: {
    label: "Frameworks",
    icon: Package,
    color: "pink",
    options: [
      { value: 'django', label: 'Django' },
      { value: 'flask', label: 'Flask' },
      { value: 'laravel', label: 'Laravel' },
      { value: 'symfony', label: 'Symfony' },
      { value: 'spring', label: 'Spring Boot' },
      { value: 'express', label: 'Express.js' },
      { value: 'rails', label: 'Ruby on Rails' },
      { value: 'wordpress', label: 'WordPress' },
      { value: 'drupal', label: 'Drupal' },
      { value: 'joomla', label: 'Joomla' },
    ]
  },
  infrastructure: {
    label: "Infrastructure",
    icon: Server,
    color: "yellow",
    options: [
      { value: 'docker', label: 'Docker' },
      { value: 'kubernetes', label: 'Kubernetes' },
      { value: 'openssl', label: 'OpenSSL' },
      { value: 'jenkins', label: 'Jenkins' },
      { value: 'gitlab', label: 'GitLab' },
      { value: 'vmware', label: 'VMware' },
      { value: 'openssh', label: 'OpenSSH' },
    ]
  },
}

// Profils prédéfinis
const PROFILES = [
  {
    label: ' Serveur Web Classique',
    desc: 'Linux + Apache + PHP + MySQL',
    data: { os: ['linux'], serveurs_web: ['apache'], langages: ['php'], bases_de_donnees: ['mysql'] }
  },
  {
    label: ' Stack Cloud Moderne',
    desc: 'Linux + Nginx + Node.js + PostgreSQL + Docker',
    data: { os: ['linux'], serveurs_web: ['nginx'], langages: ['nodejs'], bases_de_donnees: ['postgresql'], infrastructure: ['docker'] }
  },
  {
    label: ' Entreprise Microsoft',
    desc: 'Windows Server + IIS + .NET + MSSQL',
    data: { os: ['windows'], serveurs_web: ['iis'], langages: ['.net'], bases_de_donnees: ['mssql'] }
  },
  {
    label: ' Stack Python',
    desc: 'Linux + Nginx + Python + PostgreSQL',
    data: { os: ['linux'], serveurs_web: ['nginx'], langages: ['python'], bases_de_donnees: ['postgresql'] }
  },
  {
    label: ' E-Commerce',
    desc: 'Linux + Apache + WordPress + MySQL',
    data: { os: ['linux'], serveurs_web: ['apache'], langages: ['php'], frameworks: ['wordpress'], bases_de_donnees: ['mysql'] }
  },
  {
    label: ' Stack Java',
    desc: 'Linux + Tomcat + Java + MySQL',
    data: { os: ['linux'], serveurs_web: ['tomcat'], langages: ['java'], bases_de_donnees: ['mysql'] }
  },
]

// ─── Composant de sélection de technologies ───────────────────────
function TechSelector({ configKey, config, selected, onChange }) {
  const Icon = config.icon
  const colors = {
    blue:   'border-blue-500/30 bg-blue-500/5',
    green:  'border-green-500/30 bg-green-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    pink:   'border-pink-500/30 bg-pink-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  }
  const activeColors = {
    blue:   'bg-blue-500/20 border-blue-400/50 text-blue-300',
    green:  'bg-green-500/20 border-green-400/50 text-green-300',
    purple: 'bg-purple-500/20 border-purple-400/50 text-purple-300',
    orange: 'bg-orange-500/20 border-orange-400/50 text-orange-300',
    pink:   'bg-pink-500/20 border-pink-400/50 text-pink-300',
    yellow: 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300',
  }

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={`border rounded-xl p-4 ${colors[config.color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-gray-400" />
        <h3 className="text-white font-medium text-sm">{config.label}</h3>
        {selected.length > 0 && (
          <span className="ml-auto text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {config.options.map(opt => (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              selected.includes(opt.value)
                ? activeColors[config.color]
                : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────
export default function StackAnalyzer() {
  const [stack, setStack] = useState({
    os: [], os_versions: [], serveurs_web: [],
    langages: [], bases_de_donnees: [],
    frameworks: [], infrastructure: [], cms: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showRGPD, setShowRGPD] = useState(true)
  const [hasSavedStack, setHasSavedStack] = useState(false)

  useEffect(() => {
    // Charger un profil sauvegardé si disponible
    const saved = loadStack()
    if (saved) {
      setStack(saved)
      setHasSavedStack(true)
    }
  }, [])

  const updateStack = (key, values) => {
    setStack(prev => ({ ...prev, [key]: values }))
  }

  const applyProfile = (profile) => {
    setStack(prev => ({
      ...prev,
      os: [], os_versions: [], serveurs_web: [],
      langages: [], bases_de_donnees: [],
      frameworks: [], infrastructure: [], cms: [],
      ...profile.data
    }))
  }

  const reset = () => {
    clearStack()
    setStack({
      os: [], os_versions: [], serveurs_web: [],
      langages: [], bases_de_donnees: [],
      frameworks: [], infrastructure: [], cms: []
    })
    setHasSavedStack(false)
  }

  const totalSelected = Object.values(stack)
    .filter(Array.isArray)
    .reduce((sum, arr) => sum + arr.length, 0)

  const handleAnalyze = async () => {
    if (totalSelected === 0) {
      setError('Veuillez sélectionner au moins une technologie')
      return
    }

    setLoading(true)
    setError(null)

    try{
      // Sauvegarder le profil en SessionStorage
      saveStack(stack)

      // Appel API — on n'envoie que des noms de technologies
      const results = await analyzeStack(stack)

      // Sauvegarder les résultats en SessionStorage
      saveResults(results)

      // Rediriger vers la page de résultats
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'stack-results' }))

    } catch (err) {
      setError('Erreur lors de l\'analyse. Vérifiez votre connexion.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-blue-400" />
          </div>
          Mon analyse de sécurité
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Déclarez votre stack technique pour voir uniquement les vulnérabilités qui vous concernent,
          sur toute la base historique.
        </p>
      </div>

      {/* Avertissement sécurité */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-amber-300 font-medium">Important</p>
          <p className="text-gray-400 mt-0.5">
            Ne saisissez jamais d'adresses IP, de noms de domaine ou d'informations d'identification.
            Indiquez uniquement les technologies utilisées.
          </p>
        </div>
      </div>

      {/* Profils rapides */}
      <div>
        <h2 className="text-white font-medium mb-3 flex items-center gap-2">
          <Layout size={16} className="text-gray-400" />
          Profils prédéfinis
          <span className="text-gray-500 text-xs font-normal">— choisissez un profil pour démarrer rapidement</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROFILES.map(profile => (
            <button
              key={profile.label}
              onClick={() => applyProfile(profile)}
              className="text-left p-3 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:border-blue-500/30 hover:bg-gray-700/40 transition-all group"
            >
              <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                {profile.label}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{profile.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Séparateur */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-700/50" />
        <span className="text-gray-500 text-xs">ou sélectionnez manuellement</span>
        <div className="flex-1 border-t border-gray-700/50" />
      </div>

      {/* Sélecteurs de technologies */}
      <div className="space-y-4">
        {Object.entries(STACK_CONFIG).map(([key, config]) => (
          <TechSelector
            key={key}
            configKey={key}
            config={config}
            selected={stack[key] || []}
            onChange={(values) => updateStack(key, values)}
          />
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertTriangle size={14} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Barre d'action fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700/50 p-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white text-sm font-medium">
              {totalSelected === 0
                ? 'Aucune technologie sélectionnée'
                : `${totalSelected} technologie${totalSelected > 1 ? 's' : ''} sélectionnée${totalSelected > 1 ? 's' : ''}`
              }
            </p>
            <p className="text-gray-500 text-xs">
              Données stockées localement — supprimées à la fermeture
            </p>
          </div>

          {totalSelected > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || totalSelected === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {loading ? (
  <>
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    <span>Analyse en cours... (30-60s)</span>
  </>
) : (
  <>
    <Search size={16} />
    Analyser ma stack
  </>
)}
          </button>
        </div>
      </div>

      {/* Bannière RGPD */}
      {showRGPD && <RGPDBanner onAccept={() => setShowRGPD(false)} />}
    </div>
  )
}