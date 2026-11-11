/**
 * API client para o backend Express do Scout CRM v2.0
 */

const BASE_URL = '/api'

async function request(path, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${BASE_URL}${path}`, config)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Jogos da operação
  async getGames() {
    return request('/games')
  },

  // --- HEALTH / SUPABASE ---
  async getHealth() {
    return request('/health')
  },

  // --- CAPTAÇÃO ---
  async getInfluencers({
    search = '',
    status = '',
    classification = '',
    minFollowers = '',
    hideAgencies = false,
    onlyMined = false,
    sortBy = 'recent',
    page = 1,
    limit = 20,
  } = {}) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (classification) params.set('classification', classification)
    if (minFollowers) params.set('minFollowers', minFollowers)
    if (hideAgencies) params.set('hideAgencies', 'true')
    if (onlyMined) params.set('onlyMined', 'true')
    if (sortBy) params.set('sortBy', sortBy)
    if (page) params.set('page', page)
    if (limit) params.set('limit', limit)

    return request(`/influencers?${params.toString()}`)
  },

  async batchSyncInfluencers(items) {
    return request('/influencers/batch-sync', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
  },

  async getStats() {
    return request('/influencers/stats')
  },

  async createInfluencer(data) {
    return request('/influencers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateInfluencer(id, data) {
    return request(`/influencers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteInfluencer(id) {
    return request(`/influencers/${id}`, {
      method: 'DELETE',
    })
  },

  async getInfluencerFullProfile(username) {
    return request(`/influencers/profile/${username}`)
  },

  // --- PUBLICIDADES (CONTROLE FINANCEIRO) ---
  async getPublicidades({ influencer = '', game = '', closureType = '', deliveryStatus = '', paymentStatus = '', page = 1, limit = 50 } = {}) {
    const params = new URLSearchParams()
    if (influencer) params.set('influencer', influencer)
    if (game) params.set('game', game)
    if (closureType) params.set('closureType', closureType)
    if (deliveryStatus) params.set('deliveryStatus', deliveryStatus)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)
    if (page) params.set('page', page)
    if (limit) params.set('limit', limit)

    return request(`/publicidades?${params.toString()}`)
  },

  async getPublicidadesStats() {
    return request('/publicidades/stats')
  },

  async createPublicidade(data) {
    return request('/publicidades', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updatePublicidade(id, data) {
    return request(`/publicidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deletePublicidade(id) {
    return request(`/publicidades/${id}`, {
      method: 'DELETE',
    })
  },

  // --- METAS DE DEPOSITANTES ---
  async getMetas() {
    return request('/metas')
  },

  async getMetasStats() {
    return request('/metas/stats')
  },

  async createMeta(data) {
    return request('/metas', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateMeta(id, data) {
    return request(`/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async incrementMeta(id, amount = 1) {
    return request(`/metas/${id}/increment`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  },

  // --- IMPORTAÇÃO & RESET PEDRO ---
  async resetPedroData() {
    return request('/import/reset-pedro', {
      method: 'POST',
    })
  },

  async previewImport(type, rows) {
    return request('/import/preview', {
      method: 'POST',
      body: JSON.stringify({ type, rows }),
    })
  },

  async executeImport(type, items) {
    return request('/import/execute', {
      method: 'POST',
      body: JSON.stringify({ type, items }),
    })
  },

  // --- MINERAÇÃO ASSÍNCRONA ---
  async startMine(query, count = 20, mode = 'hybrid', skipExisting = true) {
    return request('/mine/start', {
      method: 'POST',
      body: JSON.stringify({ query, count, mode, skipExisting }),
    })
  },

  async getMineStatus(jobId) {
    return request(`/mine/status/${jobId}`)
  },

  async mine(query, count = 25) {
    return request('/mine', {
      method: 'POST',
      body: JSON.stringify({ query, count }),
    })
  },

  async inspectLink(url) {
    return request('/inspect-link', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  },
}
