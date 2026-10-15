const axios = require('axios')
const cheerio = require('cheerio')

const COMPETITORS = [
  'blaze', 'betano', 'estrela bet', 'superbet', 'novibet', 'bet365',
  'sportingbet', 'parimatch', 'betnacional', 'pixbet', 'realsbet',
  'vai de bet', 'galera bet', 'cassino', '.bet.br',
  'f12.bet', 'estrelabet', 'brazino', 'bodog', 'betfair',
]

// Padrão de número brasileiro: +55 (opcional), DDD, 9XXXX-XXXX
const BR_PHONE_REGEX = /(?:\+?55\s?)?\(?([1-9]{2})\)?\s?(9[0-9]{4})[-\s]?([0-9]{4})/

/**
 * Inspeciona o link externo da bio (Linktree, Beacons, Bio.site etc)
 * @param {string} url
 * @returns {Promise<{ whatsapp: string|null, hasCompetitor: boolean, competitorName: string|null }>}
 */
async function inspectLink(url) {
  const result = { whatsapp: null, hasCompetitor: false, competitorName: null }
  if (!url || !url.startsWith('http')) return result

  try {
    const { data: html } = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ScoutBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    const $ = cheerio.load(html)

    // Coletar todos os hrefs e texto
    const hrefs = []
    $('a').each((_, el) => {
      const href = $(el).attr('href') || ''
      hrefs.push(href.toLowerCase())
    })
    const allHrefs = hrefs.join('\n')
    const pageText = $('body').text().toLowerCase()
    const allText = pageText + '\n' + allHrefs

    // --- Extração de WhatsApp ---

    // 1. Busca direta wa.me/ ou api.whatsapp.com
    const waDirectMatch = allHrefs.match(/wa\.me\/(\d+)/)
    if (waDirectMatch) {
      result.whatsapp = waDirectMatch[1]
    } else {
      const waApiMatch = allHrefs.match(/api\.whatsapp\.com\/send[^&]*phone=(\d+)/)
      if (waApiMatch) {
        result.whatsapp = waApiMatch[1]
      } else {
        // 2. Busca por padrão de telefone BR no texto
        const phoneMatch = BR_PHONE_REGEX.exec(allText)
        if (phoneMatch) {
          const ddd = phoneMatch[1]
          const part1 = phoneMatch[2]
          const part2 = phoneMatch[3]
          result.whatsapp = `55${ddd}${part1}${part2}`
        }
      }
    }

    // Garantir apenas dígitos no número
    if (result.whatsapp) {
      result.whatsapp = result.whatsapp.replace(/\D/g, '')
    }

    // --- Detecção de Concorrentes ---
    for (const term of COMPETITORS) {
      if (allText.includes(term)) {
        result.hasCompetitor = true
        result.competitorName = term
        break
      }
    }
  } catch (_err) {
    // Falha silenciosa — retorna defaults
  }

  return result
}

module.exports = { inspectLink }
