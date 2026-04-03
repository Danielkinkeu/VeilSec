// frontend/src/utils/stackStorage.js

/**
 * Gestion du profil de stack en SessionStorage.
 * 
 * Justification sécurité :
 * - SessionStorage est automatiquement détruit à la fermeture de l'onglet
 * - Les données ne quittent jamais le navigateur
 * - Aucune donnée personnelle n'est stockée (uniquement des noms de technologies)
 * - Conformité RGPD Article 5 : minimisation des données
 */

const STACK_KEY = 'veilsec_stack_profile'
const RESULTS_KEY = 'veilsec_stack_results'

export const saveStack = (stackData) => {
  try {
    // On ne stocke que les données techniques — jamais de PII
    const sanitized = {
      os: stackData.os || [],
      os_versions: stackData.os_versions || [],
      serveurs_web: stackData.serveurs_web || [],
      langages: stackData.langages || [],
      bases_de_donnees: stackData.bases_de_donnees || [],
      frameworks: stackData.frameworks || [],
      infrastructure: stackData.infrastructure || [],
      cms: stackData.cms || [],
      // Timestamp pour information uniquement — pas de tracking
      saved_at: new Date().toISOString(),
    }
    sessionStorage.setItem(STACK_KEY, JSON.stringify(sanitized))
    return true
  } catch {
    return false
  }
}

export const loadStack = () => {
  try {
    const data = sessionStorage.getItem(STACK_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const saveResults = (results) => {
  try {
    sessionStorage.setItem(RESULTS_KEY, JSON.stringify(results))
    return true
  } catch {
    return false
  }
}

export const loadResults = () => {
  try {
    const data = sessionStorage.getItem(RESULTS_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export const clearStack = () => {
  sessionStorage.removeItem(STACK_KEY)
  sessionStorage.removeItem(RESULTS_KEY)
}

export const hasStack = () => {
  return sessionStorage.getItem(STACK_KEY) !== null
}