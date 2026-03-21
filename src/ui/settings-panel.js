import { CONFIG_RANGE, formatKeywordPrefixes } from '../config.js'

const STYLE_ID = 'ims-v0.1.0-settings-style'

export function createSettingsPanel(hostWindow, logger, initialConfig, onSave) {
  injectStyles(hostWindow)
  let currentConfig = { ...initialConfig }

  const button = hostWindow.document.createElement('button')
  button.type = 'button'
  button.className = 'ims-settings-toggle'
  button.textContent = 'IMS'
  button.style.top = '68px'
  button.style.right = '18px'
  button.style.bottom = 'auto'
  button.style.left = 'auto'
  button.hidden = false
  button.style.pointerEvents = 'auto'

  const panel = hostWindow.document.createElement('div')
  panel.className = 'ims-settings-panel'
  panel.dataset.expanded = 'false'
  panel.style.top = '118px'
  panel.style.right = '18px'
  panel.style.bottom = 'auto'
  panel.style.left = 'auto'
  panel.innerHTML = `
    <div class="ims-settings-header">IMS v0.1.0</div>
    <label class="ims-settings-field">
      <span>前缀</span>
      <input data-field="triggerPrefix" type="text" maxlength="12" />
    </label>
    <label class="ims-settings-field">
      <span>搜索接口地址</span>
      <input data-field="searchApiUrl" type="url" placeholder="https://iirose-meme-searcher.iirose-meme-searcher.workers.dev/search" />
    </label>
    <label class="ims-settings-field">
      <span>CORS 代理地址（可选，使用公共代理解决跨域问题）</span>
      <input data-field="corsProxyUrl" type="url" placeholder="https://corsproxy.io/ 或 https://your-proxy.com/proxy?url={url}" />
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
  const corsProxyUrlInput = panel.querySelector('[data-field="corsProxyUrl"]')
  const keywordPrefixesInput = panel.querySelector('[data-field="keywordPrefixes"]')
  const countInput = panel.querySelector('[data-field="maxCandidates"]')
  sync(currentConfig)

  // 单击按钮切换面板展开/折叠
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    const isExpanded = panel.dataset.expanded === 'true'
    panel.dataset.expanded = String(!isExpanded)
  })

  panel.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    sync(currentConfig)
    panel.dataset.expanded = 'false'
  })

  panel.querySelector('[data-action="save"]').addEventListener('click', () => {
    const nextConfig = {
      ...currentConfig,
      triggerPrefix: prefixInput.value,
      searchApiUrl: searchApiUrlInput.value,
      corsProxyUrl: corsProxyUrlInput.value,
      keywordPrefixes: keywordPrefixesInput.value,
      maxCandidates: Number(countInput.value)
    }
    logger.info('Saving config', nextConfig)
    onSave(nextConfig)
    panel.dataset.expanded = 'false'
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
    corsProxyUrlInput.value = config.corsProxyUrl || ''
    keywordPrefixesInput.value = formatKeywordPrefixes(config.keywordPrefixes)
    countInput.value = String(config.maxCandidates)
  }
}

function injectStyles(hostWindow) {
  let style = hostWindow.document.getElementById(STYLE_ID)
  if (!style) {
    style = hostWindow.document.createElement('style')
    style.id = STYLE_ID
    hostWindow.document.head.appendChild(style)
  }
  style.textContent = `
    .ims-settings-toggle {
      position: fixed;
      right: 18px;
      top: 68px;
      z-index: 2147483001;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      color: #f2f4f8;
      font-weight: 700;
      font-size: 12px;
      padding: 10px 14px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: opacity 0.2s;
    }

    .ims-settings-toggle:not([hidden]) {
      opacity: 1;
    }

    .ims-settings-panel {
      position: fixed;
      right: 18px;
      top: 118px;
      z-index: 2147483001;
      width: 280px;
      padding: 14px;
      border-radius: 16px;
      background: rgba(30, 30, 30, 0.85);
      color: #f2f4f8;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      visibility: hidden;
      opacity: 0;
      transform: scale(0.95);
      transform-origin: top right;
      transition: visibility 0.2s, opacity 0.2s, transform 0.2s;
    }

    .ims-settings-panel[data-expanded="true"] {
      visibility: visible;
      opacity: 1;
      transform: scale(1);
    }

    .ims-settings-header {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #fff;
    }

    .ims-settings-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .ims-settings-field span {
      color: #c9cfd8;
    }

    .ims-settings-field input,
    .ims-settings-field textarea,
    .ims-settings-field select {
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.08);
      color: #f2f4f8;
      padding: 8px 10px;
      font-size: 12px;
    }

    .ims-settings-field input:focus,
    .ims-settings-field textarea:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.12);
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
      margin-top: 14px;
    }

    .ims-settings-actions button {
      border: 0;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }

    .ims-settings-actions button[data-action="cancel"] {
      background: rgba(255, 255, 255, 0.1);
      color: #c9cfd8;
    }

    .ims-settings-actions button[data-action="cancel"]:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .ims-settings-actions button[data-action="save"] {
      background: rgba(99, 179, 99, 0.8);
      color: #fff;
    }

    .ims-settings-actions button[data-action="save"]:hover {
      background: rgba(99, 179, 99, 1);
    }
  `
}
