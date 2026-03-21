export async function sendCandidateUrl(hostWindow, runtime, item, logger) {
  const input = runtime.getActiveInput()
  if (!input) {
    throw new Error('未找到可用输入框，无法发送。')
  }

  const originalText = runtime.readText(input)
  const sent = sendThroughNativeEntry(hostWindow, runtime, input, item.url, logger)
  if (!sent) {
    runtime.writeText(input, item.url)
    input.focus()
    dispatchEnter(hostWindow, input)
  }

  await wait(150)
  const currentText = runtime.readText(input)
  if (currentText && currentText === item.url) {
    logger.warn('Enter dispatch did not clear input, keeping optimistic failure state.')
    runtime.writeText(input, originalText)
    throw new Error('发送动作未确认成功，请检查输入框或发送逻辑。')
  }
}

function dispatchEnter(hostWindow, node) {
  const events = [
    new hostWindow.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' }),
    new hostWindow.KeyboardEvent('keypress', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' }),
    new hostWindow.KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' })
  ]

  events.forEach((event) => node.dispatchEvent(event))
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sendThroughNativeEntry(hostWindow, runtime, input, url, logger) {
  if (input?.id !== 'moveinput') return false
  const moveinput = hostWindow.moveinput
  if (!moveinput || typeof moveinput.keydown !== 'function') return false

  try {
    if (typeof moveinput.val === 'function') {
      moveinput.val(url)
    } else {
      runtime.writeText(input, url)
    }
    moveinput.keydown()
    logger.debug('Sent through native moveinput.keydown() entry')
    return true
  } catch (error) {
    logger.warn('Native send entry failed, falling back to keyboard dispatch', error)
    return false
  }
}
