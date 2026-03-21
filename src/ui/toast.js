const STYLE_ID = 'ims-v0.1.0-toast-style'

export function createToastManager(hostWindow) {
  injectStyles(hostWindow)

  const root = hostWindow.document.createElement('div')
  root.className = 'ims-toast-root'
  hostWindow.document.body.appendChild(root)

  let timer = null

  return {
    show(message, type = 'info') {
      clearTimeout(timer)
      root.textContent = message
      root.dataset.type = type
      root.hidden = false
      timer = setTimeout(() => {
        root.hidden = true
      }, 1800)
    },
    destroy() {
      clearTimeout(timer)
      root.remove()
    }
  }
}

function injectStyles(hostWindow) {
  if (hostWindow.document.getElementById(STYLE_ID)) return
  const style = hostWindow.document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .ims-toast-root {
      position: fixed;
      left: 50%;
      bottom: 110px;
      transform: translateX(-50%);
      z-index: 2147483002;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(18, 20, 28, 0.95);
      color: #f2f4f8;
      font-size: 13px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
      pointer-events: none;
    }

    .ims-toast-root[data-type="success"] {
      background: rgba(30, 62, 45, 0.95);
    }

    .ims-toast-root[data-type="error"] {
      background: rgba(98, 39, 39, 0.95);
    }
  `
  hostWindow.document.head.appendChild(style)
}
