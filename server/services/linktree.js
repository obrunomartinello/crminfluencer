const axios = require('axios')
const cheerio = require('cheerio')
const { UNDERAGE_TERMS } = require('./scoring')

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

// Domínios de encurtadores comuns usados para esconder link de WhatsApp comercial
const SHORTENER_DOMAINS = [
  'wa.link', 'bit.ly', 'cutt.ly', 'linkr.bio', 'encurtador.com.br',
  'tinyurl.com', 'is.gd', 'abre.ai', 'contate.me',
]

// Padrão de número brasileiro: +55 (opcional), DDD, 9XXXX-XXXX
const BR_PHONE_REGEX = /(?:\+?55\s?)?\(?([1-9]{2})\)?\s?(9[0-9]{4})[-\s]?([0-9]{4})/

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}

/**
 * Tenta resolver redirect de encurtador de link para pegar o link real de WhatsApp
 * Sem baixar a página inteira (usando status 301/302 e header Location)
 */
async function resolveShortlink(shortUrl) {
  try {
    const res = await axios.get(shortUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: BROWSER_HEADERS,
      timeout: 3000,
    })
    const location = res.headers?.location || ''
    return location
  } catch (_e) {
    return null
  }
}

/**
 * Inspeciona o link externo e a bio do influenciador
 * Detecta WhatsApp, Concorrentes, Agência, Rifas, Achadinhos e Risco Menor de Idade
 */
async function inspectLink(url, bio = '') {
  const result = {
    whatsapp: null,
    hasCompetitor: false,
    competitorName: null,
    isAgency: false,
    promotesRaffle: false,
    promotesShopee: false,
    isUnderageRisk: false,
    redFlags: [],
  }

  const bioLower = (bio || '').toLowerCase()

  // 1. Verificar Bio primeiro
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

  for (const term of UNDERAGE_TERMS) {
    if (bioLower.includes(term)) {
      result.isUnderageRisk = true
      result.redFlags.push(`Risco Menor de Idade (${term})`)
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

  // 2. Se tiver link externo, inspecionar página HTML em camadas
  if (url && url.startsWith('http')) {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 8000,
        headers: BROWSER_HEADERS,
      })

      const $ = cheerio.load(html)
      const foundUrls = []

      // Camada A: Links <a> normais do HTML
      $('a').each((_, el) => {
        const href = $(el).attr('href') || ''
        if (href) foundUrls.push(href)
      })

      // Camada B: Next.js JSON (__NEXT_DATA__) embutido no Linktree / Beacons
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        try {
          const nextJson = JSON.parse(nextDataRaw)
          // Serializar e buscar URLs e textos embutidos no estado do React
          const jsonString = JSON.stringify(nextJson)
          const extractedLinks = jsonString.match(/https?:\/\/[^\s"'\\]+/g) || []
          foundUrls.push(...extractedLinks)
        } catch (_jsonErr) {
          // ignora erro de parse
        }
      }

      const allHrefs = foundUrls.map(u => u.toLowerCase()).join('\n')
      const pageText = $('body').text().toLowerCase()
      const allText = pageText + '\n' + allHrefs

      // Camada C: Extração de WhatsApp direto
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

      // Camada D: Resolução de Encurtadores (bit.ly, wa.link, etc.) se WhatsApp ainda não encontrado
      if (!result.whatsapp) {
        const shortlinks = foundUrls.filter(u =>
          SHORTENER_DOMAINS.some(domain => u.includes(domain))
        ).slice(0, 3) // limitar a 3 para rapidez

        for (const short of shortlinks) {
          const destination = await resolveShortlink(short)
          if (destination) {
            const waMatch = destination.match(/wa\.me\/(\d+)/) || destination.match(/phone=(\d+)/)
            if (waMatch) {
              result.whatsapp = waMatch[1]
              break
            }
          }
        }
      }

      // Detecção de Concorrentes
      if (!result.hasCompetitor) {
        for (const term of COMPETITORS) {
          if (allText.includes(term)) {
            result.hasCompetitor = true
            result.competitorName = term
            break
          }
        }
      }

      // Detecção de Rifas
      if (!result.promotesRaffle) {
        for (const term of RAFFLE_TERMS) {
          if (allText.includes(term)) {
            result.promotesRaffle = true
            result.redFlags.push(`Rifas no Linktree (${term})`)
            break
          }
        }
      }

      // Detecção de Achadinhos
      if (!result.promotesShopee) {
        for (const term of SHOPEE_TERMS) {
          if (allText.includes(term)) {
            result.promotesShopee = true
            result.redFlags.push(`Achadinhos no Linktree (${term})`)
            break
          }
        }
      }

      // Detecção de Risco Menor de Idade no Link externo
      if (!result.isUnderageRisk) {
        for (const term of UNDERAGE_TERMS) {
          if (allText.includes(term)) {
            result.isUnderageRisk = true
            result.redFlags.push(`Risco Menor de Idade no Linktree (${term})`)
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

/**
 * Análise rápida em memória (0ms, sem bloqueios de rede) para bio e URL
 * Garante que a ingestão de 50 leads aconteça em milissegundos
 */
function fastInspectBio(bio = '', externalUrl = '') {
  const result = {
    whatsapp: null,
    hasCompetitor: false,
    competitorName: null,
    isAgency: false,
    promotesRaffle: false,
    promotesShopee: false,
    isUnderageRisk: false,
    redFlags: [],
  }

  const allText = `${bio || ''} ${externalUrl || ''}`.toLowerCase()

  for (const term of AGENCY_TERMS) {
    if (allText.includes(term)) {
      result.isAgency = true
      result.redFlags.push(`Agência/Assessoria (${term})`)
      break
    }
  }

  for (const term of RAFFLE_TERMS) {
    if (allText.includes(term)) {
      result.promotesRaffle = true
      result.redFlags.push(`Rifas/Sorteios (${term})`)
      break
    }
  }

  for (const term of SHOPEE_TERMS) {
    if (allText.includes(term)) {
      result.promotesShopee = true
      result.redFlags.push(`Achadinhos (${term})`)
      break
    }
  }

  for (const term of UNDERAGE_TERMS) {
    if (allText.includes(term)) {
      result.isUnderageRisk = true
      result.redFlags.push(`Risco Menor de Idade (${term})`)
      break
    }
  }

  for (const term of COMPETITORS) {
    if (allText.includes(term)) {
      result.hasCompetitor = true
      result.competitorName = term
      break
    }
  }

  // Extração rápida de WhatsApp no texto ou link
  const waDirectMatch = allText.match(/wa\.me\/(\d+)/) || allText.match(/api\.whatsapp\.com\/send[^&]*phone=(\d+)/)
  if (waDirectMatch) {
    result.whatsapp = waDirectMatch[1]
  } else {
    const phoneMatch = BR_PHONE_REGEX.exec(allText)
    if (phoneMatch) {
      result.whatsapp = `55${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`
    }
  }

  if (result.whatsapp) {
    result.whatsapp = result.whatsapp.replace(/\D/g, '')
  }

  return result
}

module.exports = { inspectLink, fastInspectBio, COMPETITORS, AGENCY_TERMS, RAFFLE_TERMS, SHOPEE_TERMS }

