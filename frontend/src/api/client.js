// frontend/src/api/client.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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

export default api