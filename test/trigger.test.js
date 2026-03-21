import test from 'node:test'
import assert from 'node:assert/strict'

import { parseTriggerState } from '../src/trigger.js'
import { buildSearchQuery, normalizeConfig, resolveSearchApiUrl } from '../src/config.js'
import { parseBingHtml } from '../src/search/bing.js'

test('parseTriggerState supports inline keyword', () => {
  const state = parseTriggerState('/m猫猫', '/m')
  assert.equal(state.active, true)
  assert.equal(state.keyword, '猫猫')
})

test('parseTriggerState supports spaced keyword', () => {
  const state = parseTriggerState('/m 猫猫', '/m')
  assert.equal(state.active, true)
  assert.equal(state.keyword, '猫猫')
})

test('parseTriggerState handles empty keyword', () => {
  const state = parseTriggerState('/m', '/m')
  assert.equal(state.active, true)
  assert.equal(state.keyword, '')
})

test('normalizeConfig clamps candidate count', () => {
  const config = normalizeConfig({ maxCandidates: 999 })
  assert.equal(config.maxCandidates, 20)
})

test('normalizeConfig parses keyword prefixes from multiline text', () => {
  const config = normalizeConfig({ keywordPrefixes: 'duitang.com\n表情包\n白圣女' })
  assert.deepEqual(config.keywordPrefixes, ['duitang.com', '表情包', '白圣女'])
})

test('normalizeConfig trims search api url', () => {
  const config = normalizeConfig({ searchApiUrl: '  https://example.com/search  ' })
  assert.equal(config.searchApiUrl, 'https://example.com/search')
})

test('buildSearchQuery prefixes configured keyword prefixes', () => {
  const query = buildSearchQuery('开心', ['duitang.com', '表情包', '白圣女'])
  assert.equal(query, 'duitang.com 表情包 白圣女 开心')
})

test('resolveSearchApiUrl prefers explicit config over fallback', () => {
  const value = resolveSearchApiUrl({ searchApiUrl: 'https://config.example/search' }, 'https://fallback.example/search')
  assert.equal(value, 'https://config.example/search')
})

test('parseBingHtml extracts image results from bing-like markup', () => {
  const html = `
    <a class="iusc" m='{"murl":"https://example.com/a.jpg","t":"A"}'></a>
    murl&quot;:&quot;https://example.com/a.jpg&quot; t&quot;:&quot;A&quot;
    murl&quot;:&quot;https://example.com/b.png&quot; t&quot;:&quot;B&quot;
  `
  const items = parseBingHtml(html, 5)
  assert.equal(items.length, 2)
  assert.equal(items[0].url, 'https://example.com/a.jpg')
  assert.equal(items[1].url, 'https://example.com/b.png')
})
