import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
})

export function formatDateStr(str) {
  try {
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

export function formatDate(e, locale = 'de-DE') {
  const formatDateLocalized = (date) => {
    if (!date) return ''

    const [year, month, day] = date.split('-')
    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    }).format(
        new Date(Number(year), Number(month) - 1, Number(day))
    )
    return `${weekday}, ${day}.${month}.${year.slice(-2)}`
  }

  const parts = []
  if (e.start_date) {
    let start = formatDateLocalized(e.start_date)
    if (e.start_time) {
      start += `, ${e.start_time}`
    }
    parts.push(start)
  }

  if (e.end_date && e.end_date !== e.start_date) {
    let end = `– ${formatDateLocalized(e.end_date)}`
    if (e.end_time) {
      end += `, ${e.end_time}`
    }
    parts.push(end)
  } else if (e.end_time && e.end_time !== e.start_time) {
    parts.push(`– ${e.end_time}`)
  }

  return parts.join(' ')
}

export function formatShortDate(e, locale = 'de-DE') {
  if (!e.start_date) return ''

  const format = (date) => {
    const [year, month, day] = date.split('-')

    const dateObj = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    )

    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    }).format(dateObj)

    const capitalizedWeekday =
        weekday.charAt(0).toUpperCase() + weekday.slice(1)

    return `${capitalizedWeekday} ${day}.${month}.${year.slice(-2)}`
  }

  const parts = []

  parts.push(format(e.start_date))

  if (e.end_date && e.end_date !== e.start_date) {
    parts.push(`– ${format(e.end_date)}`)
  } else if (e.end_time && e.end_time !== e.start_time) {
    parts.push(`– ${e.end_time}`)
  }

  return parts.join(' ')
}

export function formatDetailDate(venue, locale = 'de-DE') {
  return formatShortDate(venue || {}, locale)
}

export function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

export function renderText(text) {
  return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join('')
}

export function markdownToHtml(markdown) {
  if (!markdown) {
    return ''
  }

  return DOMPurify.sanitize(md.render(markdown))
}

