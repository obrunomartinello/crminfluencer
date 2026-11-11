const RESERVED_IG_PATHS = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'popular', 'accounts', 'direct'])

/**
 * Normaliza @username ou URL colada do Instagram em handle limpo (sem @, https:// ou query strings).
 */
export function cleanInstagramHandle(raw) {
  let clean = String(raw || '').trim()
  if (!clean) return ''
  clean = clean
    .replace(/^https?:\/\/(www\.|m\.)?instagram\.com\//i, '')
    .replace(/^(www\.|m\.)?instagram\.com\//i, '')
    .split(/[?#]/)[0]
    .replace(/^@+/, '')
    .replace(/^\/+|\/+$/g, '')
  const firstSegment = (clean.split('/')[0] || '').replace(/^@+/, '').replace(/\s+/g, '')
  if (!firstSegment || RESERVED_IG_PATHS.has(firstSegment.toLowerCase())) return ''
  return firstSegment.toLowerCase()
}

/**
 * Monta link oficial e consistente de perfil do Instagram.
 */
export function getInstagramProfileUrl(raw) {
  const handle = cleanInstagramHandle(raw)
  return handle ? `https://www.instagram.com/${handle}/` : ''
}

/**
 * Formata seguidores reais ou exibe indicador honesto quando o perfil ainda não foi consultado no Apify.
 */
export function formatFollowersLabel(followersCount, compact = true) {
  const num = Number(followersCount) || 0
  if (num <= 0) return compact ? 'Seg. n/d' : 'Seguidores n/d'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toLocaleString('pt-BR')
}
