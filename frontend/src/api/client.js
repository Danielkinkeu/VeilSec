// frontend/src/api/client.js
import axios from 'axios'

// En production (Vercel) → URL Render directe
// En développement (local) → proxy Vite vers localhost
const BASE_URL = import.meta.env.PROD
  ? 'https://veilsec.onrender.com/api'
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
})

export const getCVEs = (params = {}) =>
  api.get('/cves', { params }).then(r => r.data)

export const getCVE = (id) =>
  api.get(`/cves/${id}`).then(r => r.data)

export const getStats = () =>
  api.get('/stats').then(r => r.data)

export const getEvolution = (jours = 7) =>
  api.get('/stats/evolution', { params: { jours } }).then(r => r.data)

export const getSources = () =>
  api.get('/sources').then(r => r.data)

export const triggerSource = (nom) =>
  api.post(`/sources/${nom}/trigger`).then(r => r.data)

export const analyzeStack = (stackData) =>
  api.post('/analyze/stack', stackData).then(r => r.data)

export default api