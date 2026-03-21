import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright-core'

import { parseBingHtml } from '../src/search/bing.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distScript = path.join(rootDir, 'dist', 'ims-v0.1.0.js')
const wsEndpoint = process.argv[2] || 'ws://127.0.0.1:9222/devtools/browser/26525766-ba49-488a-9079-4a771efe2f49'
const relayPort = Number(process.env.IMS_RELAY_PORT || 8787)

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://127.0.0.1:${relayPort}`)
    if (requestUrl.pathname !== '/search') {
      writeJson(res, 404, { error: 'Not found' })
      return
    }

    const query = requestUrl.searchParams.get('q')?.trim()
    const limit = Math.min(20, Math.max(1, Number(requestUrl.searchParams.get('limit') || 8)))
    if (!query) {
      writeJson(res, 400, { error: 'Missing q' })
      return
    }

    const response = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 IMS Smoke',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    })
    const html = await response.text()
    const items = parseBingHtml(html, limit)
    writeJson(res, 200, { items })
  } catch (error) {
    writeJson(res, 500, { error: error.message || 'Relay failed' })
  }
})

await new Promise((resolve) => server.listen(relayPort, resolve))

try {
  const browser = await chromium.connectOverCDP(wsEndpoint)
  const context = browser.contexts()[0]
  const page = context.pages().find((item) => item.url().startsWith('https://iirose.com/'))
  if (!page) {
    throw new Error('Could not find iirose page in connected browser.')
  }

  const frame = page.frames().find((item) => item.name() === 'mainFrame')
  if (!frame) {
    throw new Error('Could not find mainFrame.')
  }

  await frame.waitForSelector('#moveinput', { timeout: 15000 })
  await frame.evaluate((relay) => {
    window.__IMS_V010__?.destroy?.()
    window.__IMS_V010_SEARCH_API_URL__ = relay
    window.__IMS_V010_BING_RELAY__ = relay
  }, `http://127.0.0.1:${relayPort}/search`)

  await frame.addScriptTag({ path: distScript })
  await frame.waitForFunction(() => Boolean(window.__IMS_V010__), null, { timeout: 15000 })

  const textInput = frame.locator('#moveinput')
  await textInput.click()
  await textInput.fill('/m 猫猫')

  await frame.waitForSelector('.ims-candidate-item', { timeout: 15000 })

  await frame.evaluate(() => {
    window.__IMS_SMOKE_CAPTURED__ = []
    const socket = window.socket
    if (!socket) return
    if (!window.__IMS_SMOKE_ORIGINAL_SEND__) {
      window.__IMS_SMOKE_ORIGINAL_SEND__ = socket.send.bind(socket)
    }
    socket.send = (data) => {
      window.__IMS_SMOKE_CAPTURED__.push(data)
    }
  })

  await frame.locator('.ims-candidate-item').first().click()
  await frame.waitForTimeout(400)

  const result = await frame.evaluate(() => {
    const items = [...document.querySelectorAll('.ims-candidate-item')]
    return {
      settingsVisible: Boolean(document.querySelector('.ims-settings-toggle')),
      candidateCount: items.length,
      labels: items.slice(0, 5).map((node) => node.textContent?.trim() || ''),
      inputValue: document.getElementById('moveinput')?.value || ''
      ,
      capturedPayloads: window.__IMS_SMOKE_CAPTURED__ || [],
      candidateBarVisible: !document.querySelector('.ims-candidate-bar')?.hidden
    }
  })

  await frame.evaluate(() => {
    if (window.socket && window.__IMS_SMOKE_ORIGINAL_SEND__) {
      window.socket.send = window.__IMS_SMOKE_ORIGINAL_SEND__
    }
  })

  console.log(JSON.stringify(result, null, 2))
  await browser.close()
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
}

function writeJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(body))
}
