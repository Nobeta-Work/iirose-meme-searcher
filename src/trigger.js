export function parseTriggerState(text, prefix) {
  if (typeof text !== 'string' || typeof prefix !== 'string' || !prefix) {
    return { active: false, keyword: '', rawKeyword: '' }
  }

  if (!text.startsWith(prefix)) {
    return { active: false, keyword: '', rawKeyword: '' }
  }

  const rawKeyword = text.slice(prefix.length)
  const keyword = rawKeyword.trimStart()
  return {
    active: true,
    keyword,
    rawKeyword
  }
}
