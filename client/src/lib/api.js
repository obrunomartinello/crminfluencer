/**
 * API client para o backend Express do Scout CRM
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
  // Lista com filtros e paginação
  async getInfluencers({ search = '', status = '', classification = '', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (classification) params.set('classification', classification)
    if (page) params.set('page', page)
    if (limit) params.set('limit', limit)

    return request(`/influencers?${params.toString()}`)
  },

  // Métricas do Dashboard (KPIs)
  async getStats() {
    return request('/influencers/stats')
  },

  // Cadastro manual de influenciador
  async createInfluencer(data) {
    return request('/influencers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Atualização (status, notas, etc.)
  async updateInfluencer(id, data) {
    return request(`/influencers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Deletar
  async deleteInfluencer(id) {
    return request(`/influencers/${id}`, {
      method: 'DELETE',
    })
  },

  // Disparar mineração com Apify
  async mine(query, count = 25) {
    return request('/mine', {
      method: 'POST',
      body: JSON.stringify({ query, count }),
    })
  },

  // Inspecionar link na bio
  async inspectLink(url) {
    return request('/inspect-link', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  },
}
