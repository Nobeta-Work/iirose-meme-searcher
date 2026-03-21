import { randomId } from '../utils.js'

export async function searchBingImages(query, config, logger, options = {}) {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (options.relayBaseUrl) {
    return searchViaRelay(trimmed, config.maxCandidates, options.relayBaseUrl, logger)
  }

  const endpoints = [
    `https://www.bing.com/images/async?q=${encodeURIComponent(trimmed)}&first=0&count=${config.maxCandidates}&adlt=off`,
    `https://www.bing.com/images/search?q=${encodeURIComponent(trimmed)}&form=HDRSC3`
  ]

  let lastError = null
  for (const endpoint of endpoints) {
    try {
      logger.debug('Requesting Bing endpoint', endpoint)
      const response = await fetch(endpoint, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      })
      const html = await response.text()
      const results = parseBingHtml(html, config.maxCandidates)
      if (results.length) return results
    } catch (error) {
      lastError = error
      logger.warn('Bing fetch attempt failed', error)
    }
  }

  throw new Error(lastError?.message || 'Bing 搜索暂时不可用，浏览器端可能受到跨域或结果结构变化影响。')
}

export function parseBingHtml(html, limit) {
  if (typeof html !== 'string' || !html) return []

  const matches = Array.from(html.matchAll(/murl&quot;:&quot;(.*?)&quot;.*?t&quot;:&quot;(.*?)&quot;/g))
  const seen = new Set()
  const items = []

  for (const match of matches) {
    const url = decodeHtml(match[1])
    const name = decodeHtml(match[2] || 'Bing 图片')
    if (!isProbablyImageUrl(url) || seen.has(url)) continue
    seen.add(url)
    items.push({
      id: randomId(),
      name,
      keywords: [name],
      url,
      enabled: true
    })
    if (items.length >= limit) break
  }

  return items
}

function decodeHtml(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('\/', '/')
}

function isProbablyImageUrl(value) {
  if (!/^https?:\/\//i.test(value)) return false
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(value)
}

async function searchViaRelay(query, limit, relayBaseUrl, logger) {
  const endpoint = new URL(relayBaseUrl)
  endpoint.searchParams.set('q', query)
  endpoint.searchParams.set('limit', String(limit))
  logger.debug('Requesting relay endpoint', endpoint.toString())
  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`Bing relay failed: ${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data.items)) return []
  return data.items.filter((item) => item?.enabled !== false).slice(0, limit)
}
