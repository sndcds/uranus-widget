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

/** Zweistellige deutsche Wochentagsabkürzungen (getDay(): 0 = Sonntag). */
const DE_WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** Erkennt deutsche Locales ("de", "de-DE", …). */
function isGermanLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('de')
}

/** Kürzt eine Uhrzeit auf "HH:MM" (ohne Sekunden). */
function formatTime(time) {
  if (time == null || time === '') return ''
  const match = String(time).match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  return String(time).slice(0, 5)
}

/**
 * Formatiert "YYYY-MM-DD" als "Wochentag DD.MM.YY".
 * Für Deutsch wird die feste zweistellige Abkürzung ("Mo", "Di", …) verwendet,
 * für andere Sprachen die lokalisierte Kurzform des Browsers.
 */
function formatDatePart(date, locale) {
  const [year, month, day] = date.split('-')

  if (isGermanLocale(locale)) {
    const weekday = DE_WEEKDAYS[
        new Date(Number(year), Number(month) - 1, Number(day)).getDay()
    ]
    return `${weekday} ${day}.${month}.${year.slice(-2)}`
  }

  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
  }).format(
      new Date(Number(year), Number(month) - 1, Number(day))
  )

  const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1)

  return `${capitalizedWeekday} ${day}.${month}.${year.slice(-2)}`
}

/**
 * Einheitliche Datums-/Zeitangabe für Event Cards und die Event-Detailansicht.
 *
 * Deutsch (Standard):
 *   Mo 08.08.26 10:00
 *   Mo 08.08.26 10:00–14:00
 *   Mo 08.08.26 10:00 – Do 11.08.26 18:00
 *
 * - Nur start_time → "Mo 08.08.26 10:00"
 * - start_time + end_time am selben Tag → "Mo 08.08.26 10:00–14:00"
 * - unterschiedliche Tage → "Mo 08.08.26 10:00 – Do 11.08.26 18:00"
 * - ohne end_time wird keine Endzeit angezeigt; ein Enddatum ohne Endzeit
 *   bleibt als Datumsbereich erhalten.
 * - Für andere Sprachen bleibt die bisherige lokalisierte Kurzform erhalten.
 */
export function formatShortDate(e, locale = 'de-DE') {
  if (!e?.start_date) return ''

  const german = isGermanLocale(locale)
  const startTime = formatTime(e.start_time)
  const endTime = formatTime(e.end_time)

  let result = formatDatePart(e.start_date, locale)
  if (german && startTime) {
    result += ` ${startTime}`
  }

  if (e.end_date && e.end_date !== e.start_date) {
    result += ` – ${formatDatePart(e.end_date, locale)}`
    if (german && endTime) {
      result += ` ${endTime}`
    }
  } else if (endTime && endTime !== startTime) {
    result += german && startTime
        ? `–${endTime}`
        : ` – ${endTime}`
  }

  return result
}

export function formatDetailDate(venue, locale = 'de-DE') {
  return formatShortDate(venue || {}, locale)
}

/**
 * Formatiert einen Preis(bereich) mit Währung, z. B. "10,00 € – 15,00 €".
 * Sind min und max gleich bzw. nur ein Wert vorhanden, wird nur ein
 * Betrag ausgegeben.
 *
 * @param {string} locale        z. B. 'de-DE'
 * @param {number|null|undefined} min
 * @param {number|null|undefined} max
 * @param {string} [currency]    ISO-Währungscode, z. B. 'EUR'
 * @returns {string}
 */
export function formatPrice(locale, min, max, currency) {
  const formatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }

  const hasCurrency = currency && String(currency).length > 0

  const formatNumber = (value) => {
    const options = hasCurrency
        ? { ...formatOptions, style: 'currency', currency: String(currency) }
        : { ...formatOptions, style: 'decimal' }
    return new Intl.NumberFormat(locale, options).format(value)
  }

  const toNumber = (value) =>
      value == null || value === '' || !Number.isFinite(Number(value))
          ? null
          : Number(value)

  const minNum = toNumber(min)
  const maxNum = toNumber(max)

  if (minNum != null && maxNum != null && minNum <= maxNum) {
    return minNum === maxNum
        ? formatNumber(minNum)
        : `${formatNumber(minNum)} – ${formatNumber(maxNum)}`
  }
  if (minNum != null) return formatNumber(minNum)
  if (maxNum != null) return formatNumber(maxNum)
  return ''
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

