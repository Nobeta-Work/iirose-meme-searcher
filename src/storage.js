import { DEFAULT_CONFIG, normalizeConfig } from './config.js'

const STORAGE_KEY = 'ims:v0.1.0:config'

export function loadConfig(hostWindow) {
  try {
    const raw = hostWindow.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(hostWindow, config) {
  const normalized = normalizeConfig(config)
  hostWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export function getStorageKey() {
  return STORAGE_KEY
}
