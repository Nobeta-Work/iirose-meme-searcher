import { CONFIG_RANGE, formatKeywordPrefixes } from '../config.js'

const STYLE_ID = 'ims-v0.1.0-settings-style'

export function createSettingsPanel(hostWindow, logger, initialConfig, onSave) {
  injectStyles(hostWindow)
  let currentConfig = { ...initialConfig }

  const button = hostWindow.document.createElement('button')
  button.type = 'button'
  button.className = 'ims-settings-toggle'
  button.textContent = 'IMS'

  const panel = hostWindow.document.createElement('div')
  panel.className = 'ims-settings-panel'
  panel.hidden = true
  panel.innerHTML = `
    <div class="ims-settings-header">IMS v0.1.0</div>
    <label class="ims-settings-field">
      <span>前缀</span>
      <input data-field="triggerPrefix" type="text" maxlength="12" />
    </label>
    <label class="ims-settings-field">
      <span>搜索接口地址</span>
      <input data-field="searchApiUrl" type="url" placeholder="https://your-search-service/search" />
    </label>
    <label class="ims-settings-field">
      <span>检索前缀词（每行或逗号分隔一个）</span>
      <textarea data-field="keywordPrefixes" rows="4" placeholder="duitang.com&#10;表情包&#10;白圣女"></textarea>
    </label>
    <label class="ims-settings-field">
      <span>候选数量 (${CONFIG_RANGE.minCandidates}-${CONFIG_RANGE.maxCandidates})</span>
      <input data-field="maxCandidates" type="number" min="${CONFIG_RANGE.minCandidates}" max="${CONFIG_RANGE.maxCandidates}" />
    </label>
    <div class="ims-settings-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="button" data-action="save">保存</button>
    </div>
  `

  hostWindow.document.body.append(button, panel)

  const prefixInput = panel.querySelector('[data-field="triggerPrefix"]')
  const searchApiUrlInput = panel.querySelector('[data-field="searchApiUrl"]')
  const keywordPrefixesInput = panel.querySelector('[data-field="keywordPrefixes"]')
  const countInput = panel.querySelector('[data-field="maxCandidates"]')
  sync(currentConfig)

  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden
    if (!panel.hidden) sync(currentConfig)
  })

  panel.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    panel.hidden = true
    sync(currentConfig)
  })

  panel.querySelector('[data-action="save"]').addEventListener('click', () => {
    const nextConfig = {
      ...currentConfig,
      triggerPrefix: prefixInput.value,
      searchApiUrl: searchApiUrlInput.value,
      keywordPrefixes: keywordPrefixesInput.value,
      maxCandidates: Number(countInput.value)
    }
    logger.info('Saving config', nextConfig)
    onSave(nextConfig)
    panel.hidden = true
  })

  return {
    sync,
    destroy() {
      button.remove()
      panel.remove()
    }
  }

  function sync(config) {
    currentConfig = { ...config }
    prefixInput.value = config.triggerPrefix
    searchApiUrlInput.value = config.searchApiUrl || ''
    keywordPrefixesInput.value = formatKeywordPrefixes(config.keywordPrefixes)
    countInput.value = String(config.maxCandidates)
  }
}

function injectStyles(hostWindow) {
  if (hostWindow.document.getElementById(STYLE_ID)) return

  const style = hostWindow.document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .ims-settings-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483001;
      border: 0;
      border-radius: 999px;
      background: #d6e26f;
      color: #11141a;
      font-weight: 700;
      padding: 10px 14px;
      cursor: pointer;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
    }

    .ims-settings-panel {
      position: fixed;
      right: 18px;
      bottom: 68px;
      z-index: 2147483001;
      width: 280px;
      padding: 14px;
      border-radius: 16px;
      background: rgba(18, 20, 28, 0.98);
      color: #f2f4f8;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
    }

    .ims-settings-header {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .ims-settings-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .ims-settings-field input,
    .ims-settings-field textarea,
    .ims-settings-field select {
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: #f2f4f8;
      padding: 8px 10px;
    }

    .ims-settings-field textarea {
      resize: vertical;
      min-height: 84px;
      font-family: inherit;
      line-height: 1.4;
    }

    .ims-settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .ims-settings-actions button {
      border: 0;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: #f2f4f8;
    }
  `

  hostWindow.document.head.appendChild(style)
}
