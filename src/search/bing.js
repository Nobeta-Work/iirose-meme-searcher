import { randomId } from '../utils.js'

export async function searchBingImages(query, config, logger, options = {}) {
  const trimmed = query.trim()
  if (!trimmed) return []

  if (options.searchPageUrl && isBingSearchUrl(options.searchPageUrl)) {
    return searchBingViaConfiguredUrl(trimmed, config.maxCandidates, options.searchPageUrl, logger)
  }

  if (options.relayBaseUrl) {
    return searchViaRelay(trimmed, config.maxCandidates, options.relayBaseUrl, logger)
  }

  // 使用 CORS 代理解决跨域问题
  if (options.corsProxyUrl) {
    return searchBingViaCorsProxy(trimmed, config.maxCandidates, options.corsProxyUrl, logger)
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

export function isBingSearchUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value)
    return /(^|\.)bing\.com$/i.test(url.hostname) && /\/images\/search/i.test(url.pathname)
  } catch {
    return false
  }
}

export function parseBingHtml(html, limit) {
  if (typeof html !== 'string' || !html) return []

  const matches = [
    ...Array.from(html.matchAll(/murl&quot;:&quot;(.*?)&quot;.*?t&quot;:&quot;(.*?)&quot;/g)),
    ...Array.from(html.matchAll(/"murl":"(.*?)".*?"t":"(.*?)"/g))
  ]
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

async function searchBingViaConfiguredUrl(query, limit, searchPageUrl, logger) {
  const endpoint = new URL(searchPageUrl)
  endpoint.searchParams.set('q', query)
  if (!endpoint.searchParams.has('form')) {
    endpoint.searchParams.set('form', 'HDRSC3')
  }

  logger.debug('Requesting configured Bing page', endpoint.toString())
  const response = await fetch(endpoint.toString(), {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })
  const html = await response.text()
  const items = parseBingHtml(html, limit)
  if (items.length) return items
  throw new Error('Bing 页面未解析到可用结果，可能受跨域或页面结构变化影响。')
}

async function searchBingViaCorsProxy(query, limit, corsProxyUrl, logger) {
  // 支持两种格式：
  // 1. 直接代理：https://corsproxy.io/?<url>
  // 2. 模板格式：使用 {url} 占位符，如 https://your-proxy.com/proxy?url={url}
  const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`
  const proxyEndpoint = corsProxyUrl.includes('{url}')
    ? corsProxyUrl.replace('{url}', encodeURIComponent(bingUrl))
    : `${corsProxyUrl}?${encodeURIComponent(bingUrl)}`

  logger.debug('Requesting Bing via CORS proxy', proxyEndpoint)
  const response = await fetch(proxyEndpoint, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`CORS 代理请求失败：${response.status}`)
  }

  const html = await response.text()
  const items = parseBingHtml(html, limit)
  if (items.length) return items
  throw new Error('Bing 页面未解析到可用结果，可能受跨域或页面结构变化影响。')
}
