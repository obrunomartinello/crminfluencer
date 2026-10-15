const axios = require('axios')
const cheerio = require('cheerio')

const COMPETITORS = [
  'blaze', 'betano', 'estrela bet', 'superbet', 'novibet', 'bet365',
  'sportingbet', 'parimatch', 'betnacional', 'pixbet', 'realsbet',
  'vai de bet', 'galera bet', 'cassino', '.bet.br',
  'f12.bet', 'estrelabet', 'brazino', 'bodog', 'betfair', 'kto', 'jonbet',
]

// Termos de agências e assessorias que Pedro quer evitar a todo custo
const AGENCY_TERMS = [
  'agência', 'agencia', 'assessoria', 'casting', 'publicidade', 'marketing',
  'social media', 'agenciamento', 'produções', 'producoes', 'empresariamento',
  'comercial@', 'contato@', 'assessoriadeimprensa', 'management', 'talent',
]

// Termos de rifas que queimam o público (sem caixa para depósito)
const RAFFLE_TERMS = [
  'rifa', 'sorteio', 'cota', 'cotas', 'bilhete', 'bilhetes', 'ação entre amigos',
  'acao entre amigos', 'prêmio', 'premio', 'sorteios', 'rifas',
]

// Termos de achadinhos / ecommerce de baixo ticket
const SHOPEE_TERMS = [
  'achadinhos', 'achadinho', 'shopee', 'cupom', 'cupons', 'desconto',
  'amzn.to', 'mercadolivre', 'mercado livre', 'magalu', 'shein',
]

// Padrão de número brasileiro: +55 (opcional), DDD, 9XXXX-XXXX
const BR_PHONE_REGEX = /(?:\+?55\s?)?\(?([1-9]{2})\)?\s?(9[0-9]{4})[-\s]?([0-9]{4})/

/**
 * Inspeciona o link externo e a bio do influenciador
 * Detecta WhatsApp, Concorrentes, Agência, Rifas e Achadinhos
 */
async function inspectLink(url, bio = '') {
  const result = {
    whatsapp: null,
    hasCompetitor: false,
    competitorName: null,
    isAgency: false,
    promotesRaffle: false,
    promotesShopee: false,
    redFlags: [],
  }

  const bioLower = (bio || '').toLowerCase()

  // 1. Verificar Bio primeiro (muito importante)
  for (const term of AGENCY_TERMS) {
    if (bioLower.includes(term)) {
      result.isAgency = true
      result.redFlags.push(`Agência/Assessoria (${term})`)
      break
    }
  }

  for (const term of RAFFLE_TERMS) {
    if (bioLower.includes(term)) {
      result.promotesRaffle = true
      result.redFlags.push(`Rifas/Sorteios (${term})`)
      break
    }
  }

  for (const term of SHOPEE_TERMS) {
    if (bioLower.includes(term)) {
      result.promotesShopee = true
      result.redFlags.push(`Achadinhos (${term})`)
      break
    }
  }

  for (const term of COMPETITORS) {
    if (bioLower.includes(term)) {
      result.hasCompetitor = true
      result.competitorName = term
      break
    }
  }

  // Tentar extrair telefone da bio também
  const bioPhoneMatch = BR_PHONE_REGEX.exec(bioLower)
  if (bioPhoneMatch) {
    result.whatsapp = `55${bioPhoneMatch[1]}${bioPhoneMatch[2]}${bioPhoneMatch[3]}`
  }

  // 2. Se tiver link externo, inspecionar página HTML (Linktree, Beacons etc)
  if (url && url.startsWith('http')) {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ScoutBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      const $ = cheerio.load(html)
      const hrefs = []
      $('a').each((_, el) => {
        const href = $(el).attr('href') || ''
        hrefs.push(href.toLowerCase())
      })
      const allHrefs = hrefs.join('\n')
      const pageText = $('body').text().toLowerCase()
      const allText = pageText + '\n' + allHrefs

      // Extração de WhatsApp no Linktree
      if (!result.whatsapp) {
        const waDirectMatch = allHrefs.match(/wa\.me\/(\d+)/)
        if (waDirectMatch) {
          result.whatsapp = waDirectMatch[1]
        } else {
          const waApiMatch = allHrefs.match(/api\.whatsapp\.com\/send[^&]*phone=(\d+)/)
          if (waApiMatch) {
            result.whatsapp = waApiMatch[1]
          } else {
            const phoneMatch = BR_PHONE_REGEX.exec(allText)
            if (phoneMatch) {
              result.whatsapp = `55${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`
            }
          }
        }
      }

      // Detecção de Concorrentes no Linktree
      if (!result.hasCompetitor) {
        for (const term of COMPETITORS) {
          if (allText.includes(term)) {
            result.hasCompetitor = true
            result.competitorName = term
            break
          }
        }
      }

      // Detecção de Rifas no Linktree
      if (!result.promotesRaffle) {
        for (const term of RAFFLE_TERMS) {
          if (allText.includes(term)) {
            result.promotesRaffle = true
            result.redFlags.push(`Rifas no Linktree (${term})`)
            break
          }
        }
      }

      // Detecção de Achadinhos no Linktree
      if (!result.promotesShopee) {
        for (const term of SHOPEE_TERMS) {
          if (allText.includes(term)) {
            result.promotesShopee = true
            result.redFlags.push(`Achadinhos no Linktree (${term})`)
            break
          }
        }
      }
    } catch (_err) {
      // Falha de requisição silenciosa
    }
  }

  if (result.whatsapp) {
    result.whatsapp = result.whatsapp.replace(/\D/g, '')
  }

  return result
}

module.exports = { inspectLink, COMPETITORS, AGENCY_TERMS, RAFFLE_TERMS, SHOPEE_TERMS }
