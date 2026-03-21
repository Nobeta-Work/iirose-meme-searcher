import { isVisibleElement } from './utils.js'

export function createRuntime(hostWindow, logger) {
  const state = {
    activeInput: null
  }

  function isTextEntryCandidate(node) {
    if (!(node instanceof hostWindow.HTMLElement)) return false
    if (!isVisibleElement(node)) return false

    if (node instanceof hostWindow.HTMLTextAreaElement) return true
    if (node instanceof hostWindow.HTMLInputElement) {
      const allowed = ['text', 'search', 'url', 'email']
      return allowed.includes((node.type || 'text').toLowerCase())
    }

    return node.isContentEditable
  }

  function bindInputTracking(onChange) {
    const handleFocus = (event) => {
      if (isTextEntryCandidate(event.target)) {
        state.activeInput = event.target
        logger.debug('Focused input candidate', describeNode(event.target))
      }
    }

    const handleInput = (event) => {
      if (!isTextEntryCandidate(event.target)) return
      state.activeInput = event.target
      onChange(event.target, readText(event.target))
    }

    hostWindow.document.addEventListener('focusin', handleFocus, true)
    hostWindow.document.addEventListener('input', handleInput, true)

    return () => {
      hostWindow.document.removeEventListener('focusin', handleFocus, true)
      hostWindow.document.removeEventListener('input', handleInput, true)
    }
  }

  function getActiveInput() {
    if (isTextEntryCandidate(state.activeInput)) return state.activeInput
    const active = hostWindow.document.activeElement
    return isTextEntryCandidate(active) ? active : null
  }

  return {
    bindInputTracking,
    getActiveInput,
    readText,
    writeText,
    clearText,
    isTextEntryCandidate
  }

  function readText(node) {
    if (!node) return ''
    if (node instanceof hostWindow.HTMLInputElement || node instanceof hostWindow.HTMLTextAreaElement) {
      return node.value ?? ''
    }
    if (node.isContentEditable) return node.textContent ?? ''
    return ''
  }

  function writeText(node, value) {
    if (!node) return

    if (node instanceof hostWindow.HTMLInputElement || node instanceof hostWindow.HTMLTextAreaElement) {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')
      if (descriptor?.set) {
        descriptor.set.call(node, value)
      } else {
        node.value = value
      }
      node.dispatchEvent(new hostWindow.Event('input', { bubbles: true }))
      node.dispatchEvent(new hostWindow.Event('change', { bubbles: true }))
      return
    }

    if (node.isContentEditable) {
      node.textContent = value
      node.dispatchEvent(new hostWindow.InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
    }
  }

  function clearText(node) {
    writeText(node, '')
  }

  function describeNode(node) {
    if (!(node instanceof hostWindow.HTMLElement)) return '<unknown>'
    const parts = [node.tagName.toLowerCase()]
    if (node.id) parts.push(`#${node.id}`)
    if (node.className && typeof node.className === 'string') {
      const first = node.className.trim().split(/\s+/).slice(0, 2).join('.')
      if (first) parts.push(`.${first}`)
    }
    return parts.join('')
  }
}
