import { DEFAULT_CONFIG, buildSearchQuery, normalizeConfig, resolveSearchApiUrl } from './config.js'
import { createLogger } from './logger.js'
import { createRuntime } from './runtime.js'
import { loadConfig, saveConfig } from './storage.js'
import { createCandidateBar } from './ui/candidate-bar.js'
import { createSettingsPanel } from './ui/settings-panel.js'
import { createToastManager } from './ui/toast.js'
import { searchImages } from './search/api.js'
import { parseTriggerState } from './trigger.js'
import { debounce } from './utils.js'
import { sendCandidateUrl } from './send.js'

const GLOBAL_KEY = '__IMS_V010__'

export function bootstrapPlugin(hostWindow = window) {
  if (hostWindow[GLOBAL_KEY]) {
    hostWindow[GLOBAL_KEY].logger.info('IMS already initialized.')
    return hostWindow[GLOBAL_KEY]
  }

  const state = {
    config: normalizeConfig(loadConfig(hostWindow)),
    currentInput: null,
    queryVersion: 0
  }
  state.config.searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow))

  const logger = createLogger('core', state.config.debug)
  const runtime = createRuntime(hostWindow, logger)
  const candidateBar = createCandidateBar(hostWindow, logger)
  const toast = createToastManager(hostWindow)
  const settingsPanel = createSettingsPanel(hostWindow, logger, state.config, handleConfigSave)
  let roomSignature = getRoomSignature(hostWindow)
  const roomMonitor = hostWindow.setInterval(() => {
    const nextSignature = getRoomSignature(hostWindow)
    if (nextSignature !== roomSignature) {
      roomSignature = nextSignature
      candidateBar.hide()
      logger.debug('Room signature changed, candidate bar hidden', roomSignature)
    }
  }, 1000)

  const app = {
    logger,
    destroy,
    getConfig: () => ({ ...state.config })
  }

  hostWindow[GLOBAL_KEY] = app
  logger.info('IMS initializing', state.config)

  const unsubscribe = runtime.bindInputTracking((input, text) => {
    state.currentInput = input
    handleInputChange(input, text)
  })

  const debouncedSearch = debounce(async (input, keyword, queryVersion) => {
    candidateBar.renderLoading(input)

    try {
      const query = buildSearchQuery(keyword, state.config.keywordPrefixes)
      logger.debug('Search query built', query)
      const searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow))
      const corsProxyUrl = hostWindow.__IMS_V010_CORS_PROXY__?.trim() || state.config.corsProxyUrl?.trim()
      const items = await searchImages(query, state.config, logger, {
        searchApiUrl,
        baseUrl: hostWindow.location.href,
        corsProxyUrl
      })
      if (queryVersion !== state.queryVersion) return
      if (!items.length) {
        candidateBar.renderEmpty(input, '没有找到相关图片')
        return
      }
      candidateBar.renderResults(input, items, async (item) => {
        try {
          await sendCandidateUrl(hostWindow, runtime, item, logger)
          candidateBar.hide()
          runtime.clearText(input)
          toast.show('已发送', 'success')
        } catch (error) {
          candidateBar.renderError(input, error.message)
          toast.show(error.message || '发送失败', 'error')
        }
      })
    } catch (error) {
      if (queryVersion !== state.queryVersion) return
      candidateBar.renderError(input, error.message || '搜索失败，请稍后重试')
    }
  }, 350)

  hostWindow.addEventListener('beforeunload', destroy, { once: true })
  hostWindow.addEventListener('hashchange', () => {
    candidateBar.hide()
  })

  return app

  function handleInputChange(input, text) {
    const triggerState = parseTriggerState(text, state.config.triggerPrefix)
    logger.debug('Input change', triggerState)

    if (!triggerState.active) {
      state.queryVersion += 1
      candidateBar.hide()
      return
    }

    if (!triggerState.keyword.trim()) {
      state.queryVersion += 1
      candidateBar.renderEmpty(input, '输入关键词开始搜索')
      return
    }

    state.queryVersion += 1
    debouncedSearch(input, triggerState.keyword, state.queryVersion)
  }

  function handleConfigSave(nextConfig) {
    state.config = saveConfig(hostWindow, nextConfig)
    state.config.searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow))
    settingsPanel.sync(state.config)
    logger.info('Config updated', state.config)
    toast.show('配置已保存', 'success')

    if (state.currentInput) {
      handleInputChange(state.currentInput, runtime.readText(state.currentInput))
    }
  }

  function destroy() {
    if (!hostWindow[GLOBAL_KEY]) return
    unsubscribe()
    hostWindow.clearInterval(roomMonitor)
    candidateBar.destroy()
    toast.destroy()
    settingsPanel.destroy()
    delete hostWindow[GLOBAL_KEY]
    logger.info('IMS destroyed')
  }
}

export function getGlobalKey() {
  return GLOBAL_KEY
}

export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG }
}

function getRoomSignature(hostWindow) {
  return [
    hostWindow.location.href,
    String(hostWindow.roomn ?? ''),
    String(hostWindow.roomnFull ?? ''),
    String(hostWindow.roomColor ?? '')
  ].join('|')
}

function getDefaultSearchApiUrl(hostWindow) {
  if (typeof hostWindow.__IMS_V010_SEARCH_API_URL__ === 'string' && hostWindow.__IMS_V010_SEARCH_API_URL__.trim()) {
    return hostWindow.__IMS_V010_SEARCH_API_URL__.trim()
  }
  return ''
}
