export async function fetchApi(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const json = await response.json()
  if (json.status != null && json.status !== 200) throw new Error(json.message || `API ${json.status}`)
  return json.data ?? json
}

export function safeWebUrl(value) {
  if (!value || typeof value !== 'string') return ''
  try {
    const url = new URL(value, window.location.href)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}
