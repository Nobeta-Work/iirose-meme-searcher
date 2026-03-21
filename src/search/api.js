import { randomId } from '../utils.js'
import { isBingSearchUrl, searchBingImages } from './bing.js'

export async function searchImages(query, config, logger, options = {}) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const apiUrl = options.searchApiUrl?.trim()
  if (!apiUrl) {
    throw new Error('请先在配置面板填写搜索接口地址。')
  }

  if (isBingSearchUrl(apiUrl)) {
    return searchBingImages(trimmed, config, logger, {
      searchPageUrl: apiUrl,
      relayBaseUrl: options.relayBaseUrl,
      corsProxyUrl: options.corsProxyUrl
    })
  }

  const endpoint = new URL(apiUrl, options.baseUrl || 'http://localhost')
  endpoint.searchParams.set('q', trimmed)
  endpoint.searchParams.set('limit', String(config.maxCandidates))

  logger.debug('Requesting search API', endpoint.toString())

  // 使用 CORS 代理（如果配置了）
  const finalUrl = options.corsProxyUrl ? buildProxyUrl(options.corsProxyUrl, endpoint.toString()) : endpoint.toString()

  const response = await fetch(finalUrl, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`搜索接口请求失败：${response.status}`)
  }

  const data = await response.json()
  if (!Array.isArray(data.items)) return []

  return data.items
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, config.maxCandidates)
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null
  if (item.enabled === false) return null
  if (typeof item.url !== 'string' || !/^https?:\/\//i.test(item.url)) return null

  const name = typeof item.name === 'string' && item.name.trim()
    ? item.name.trim()
    : '搜索结果'

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : randomId(),
    name,
    keywords: Array.isArray(item.keywords)
      ? item.keywords.map((value) => String(value).trim()).filter(Boolean)
      : [name],
    url: item.url,
    enabled: true
  }
}

function buildProxyUrl(corsProxyUrl, targetUrl) {
  if (corsProxyUrl.includes('{url}')) {
    return corsProxyUrl.replace('{url}', encodeURIComponent(targetUrl))
  }
  if (/[?&]$/.test(corsProxyUrl)) {
    return `${corsProxyUrl}${encodeURIComponent(targetUrl)}`
  }
  if (corsProxyUrl.includes('?')) {
    return `${corsProxyUrl}&url=${encodeURIComponent(targetUrl)}`
  }
  return `${corsProxyUrl}?url=${encodeURIComponent(targetUrl)}`
}
