export const DEFAULT_CONFIG = Object.freeze({
  triggerPrefix: '/m',
  searchApiUrl: '',
  keywordPrefixes: [],
  maxCandidates: 8,
  debug: false
})

export const CONFIG_RANGE = Object.freeze({
  minCandidates: 1,
  maxCandidates: 20
})

export function normalizeConfig(raw = {}) {
  const next = {
    triggerPrefix: normalizePrefix(raw.triggerPrefix),
    searchApiUrl: normalizeSearchApiUrl(raw.searchApiUrl),
    keywordPrefixes: normalizeKeywordPrefixes(raw.keywordPrefixes),
    maxCandidates: normalizeCandidateCount(raw.maxCandidates),
    debug: Boolean(raw.debug)
  }

  return next
}

function normalizePrefix(value) {
  if (typeof value !== 'string') return DEFAULT_CONFIG.triggerPrefix
  const trimmed = value.trim()
  return trimmed || DEFAULT_CONFIG.triggerPrefix
}

function normalizeSearchApiUrl(value) {
  if (typeof value !== 'string') return DEFAULT_CONFIG.searchApiUrl
  return value.trim()
}

function normalizeKeywordPrefixes(value) {
  if (Array.isArray(value)) return dedupeTokens(value)
  if (typeof value === 'string') return dedupeTokens(splitKeywordPrefixes(value))
  return [...DEFAULT_CONFIG.keywordPrefixes]
}

function normalizeCandidateCount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return DEFAULT_CONFIG.maxCandidates
  return Math.min(CONFIG_RANGE.maxCandidates, Math.max(CONFIG_RANGE.minCandidates, Math.round(num)))
}

export function buildSearchQuery(keyword, keywordPrefixes = []) {
  const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : ''
  const normalizedPrefixes = normalizeKeywordPrefixes(keywordPrefixes)
  return [...normalizedPrefixes, normalizedKeyword].filter(Boolean).join(' ')
}

export function formatKeywordPrefixes(keywordPrefixes = []) {
  return normalizeKeywordPrefixes(keywordPrefixes).join('\n')
}

export function resolveSearchApiUrl(config = {}, fallback = '') {
  const value = normalizeSearchApiUrl(config.searchApiUrl)
  return value || normalizeSearchApiUrl(fallback)
}

function splitKeywordPrefixes(value) {
  return String(value)
    .split(/[\r\n,，、]+/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

function dedupeTokens(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const trimmed = String(item).trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}
