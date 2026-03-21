import { escapeHtml } from '../utils.js'

const STYLE_ID = 'ims-v0.1.0-candidate-style'

export function createCandidateBar(hostWindow, logger) {
  injectStyles(hostWindow)

  const root = hostWindow.document.createElement('div')
  root.className = 'ims-candidate-bar'
  root.hidden = true
  root.innerHTML = `
    <div class="ims-candidate-track"></div>
  `
  hostWindow.document.body.appendChild(root)

  const track = root.querySelector('.ims-candidate-track')
  let currentAnchor = null

  track.addEventListener('wheel', (event) => {
    // 将垂直滚动映射为水平滚动
    const deltaY = event.deltaY
    const deltaX = event.deltaX

    // 如果有水平滚动需求，直接使用；否则将垂直滚动转换为水平滚动
    const horizontalDelta = deltaX !== 0 ? deltaX : deltaY

    if (!horizontalDelta) return
    if (track.scrollWidth <= track.clientWidth) return

    track.scrollLeft += horizontalDelta
    event.preventDefault()
  }, { passive: false })

  const api = {
    renderLoading(anchor) {
      currentAnchor = anchor
      track.innerHTML = '<div class="ims-candidate-state">搜索中...</div>'
      show(anchor)
    },
    renderEmpty(anchor, message = '输入关键词开始搜索') {
      currentAnchor = anchor
      track.innerHTML = `<div class="ims-candidate-state">${escapeHtml(message)}</div>`
      show(anchor)
    },
    renderError(anchor, message = '搜索失败，请稍后重试') {
      currentAnchor = anchor
      track.innerHTML = `<div class="ims-candidate-state ims-candidate-state-error">${escapeHtml(message)}</div>`
      show(anchor)
    },
    renderResults(anchor, items, onPick) {
      currentAnchor = anchor
      track.innerHTML = items.map((item) => `
        <button class="ims-candidate-item" type="button" data-ims-id="${escapeHtml(item.id)}" title="${escapeHtml(item.name)}">
          <img class="ims-candidate-image" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        </button>
      `).join('')

      track.querySelectorAll('.ims-candidate-item').forEach((button, index) => {
        button.addEventListener('click', () => onPick(items[index]))
      })

      show(anchor)
    },
    hide() {
      root.hidden = true
    },
    reposition(anchor = currentAnchor) {
      if (!anchor || root.hidden) return
      position(anchor)
    },
    destroy() {
      root.remove()
    }
  }

  hostWindow.addEventListener('resize', () => api.reposition())
  hostWindow.addEventListener('scroll', () => api.reposition(), true)

  return api

  function show(anchor) {
    root.hidden = false
    position(anchor)
  }

  function position(anchor) {
    const rect = anchor.getBoundingClientRect()
    const maxWidth = Math.min(hostWindow.innerWidth - 24, Math.max(360, rect.width))
    root.style.width = `${maxWidth}px`
    root.style.left = `${Math.max(12, Math.min(rect.left, hostWindow.innerWidth - maxWidth - 12))}px`
    root.style.top = `${Math.max(12, rect.top - root.offsetHeight - 10)}px`
    logger.debug('Candidate bar positioned', { left: root.style.left, top: root.style.top })
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
    .ims-candidate-bar {
      position: fixed;
      z-index: 2147483000;
      max-width: calc(100vw - 24px);
      border-radius: 14px;
      background: transparent;
      border: 0;
      box-shadow: none;
      backdrop-filter: none;
      padding: 0;
    }

    .ims-candidate-track {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .ims-candidate-track::-webkit-scrollbar {
      display: none;
    }

    .ims-candidate-state {
      color: #f2f4f8;
      font-size: 13px;
      line-height: 1.4;
      padding: 10px 12px;
      white-space: nowrap;
    }

    .ims-candidate-state-error {
      color: #ffb0aa;
    }

    .ims-candidate-item {
      flex: 0 0 96px;
      display: block;
      border: 0;
      border-radius: 12px;
      background: transparent;
      padding: 0;
      cursor: pointer;
      line-height: 0;
      overflow: hidden;
    }

    .ims-candidate-item:hover {
      background: transparent;
    }

    .ims-candidate-image {
      width: 96px;
      height: 72px;
      object-fit: cover;
      border-radius: 10px;
      background: transparent;
      display: block;
      pointer-events: none;
    }
  `
}
