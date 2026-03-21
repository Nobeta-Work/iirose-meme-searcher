import http from 'node:http'
import { URL } from 'node:url'

import { parseBingHtml } from '../src/search/bing.js'

const port = Number(process.env.PORT || 8787)

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://localhost:${port}`)
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

    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`
    const response = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 IMS Relay',
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

server.listen(port, () => {
  console.log(`Bing relay listening on http://localhost:${port}/search?q=猫猫`)
})

function writeJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store'
  })
  res.end(JSON.stringify(body))
}
