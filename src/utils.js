export function debounce(fn, delay) {
  let timer = null

  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function randomId(length = 12) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let out = ''
  for (let index = 0; index < length; index += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function isVisibleElement(node) {
  if (!(node instanceof Element)) return false
  const rect = node.getBoundingClientRect()
  const style = window.getComputedStyle(node)
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
