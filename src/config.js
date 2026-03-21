export const DEFAULT_CONFIG = Object.freeze({
  triggerPrefix: '/m',
  searchEngine: 'bing',
  keywordPrefixes: [],
  maxCandidates: 8,
  debug: false
})

export const SEARCH_ENGINES = Object.freeze([
  { label: 'Bing', value: 'bing' }
])

export const CONFIG_RANGE = Object.freeze({
  minCandidates: 1,
  maxCandidates: 20
})

export function normalizeConfig(raw = {}) {
  const next = {
    triggerPrefix: normalizePrefix(raw.triggerPrefix),
    searchEngine: normalizeSearchEngine(raw.searchEngine),
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

function normalizeSearchEngine(value) {
  return SEARCH_ENGINES.some((item) => item.value === value)
    ? value
    : DEFAULT_CONFIG.searchEngine
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
