export function formatDateStr(str) {
  try {
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

export function formatDate(e) {
  const parts = []
  if (e.start_date) {
    parts.push(formatDateStr(e.start_date))
    if (e.start_time) parts[parts.length - 1] += `, ${e.start_time}`
  }
  if (e.end_date && e.end_date !== e.start_date) {
    parts.push(`– ${formatDateStr(e.end_date)}`)
    if (e.end_time) parts[parts.length - 1] += `, ${e.end_time}`
  } else if (e.end_time && e.end_time !== e.start_time) {
    parts.push(`– ${e.end_time}`)
  }
  return parts.join(' ')
}

export function formatDetailDate(venue) {
  return formatDate(venue || {})
}

export function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function renderDescription(text) {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('')
}
