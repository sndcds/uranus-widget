/**
 * URL-Helfer für den URL-basierten View-State des Widgets.
 *
 * Die Detail-URL wird immer aus der aktuellen Seiten-URL abgeleitet:
 * Pfad und Hash bleiben erhalten, der `event`-Query-Parameter wird gesetzt
 * bzw. entfernt, alle übrigen Query-Parameter bleiben unangetastet.
 * Es wird nichts hartcodiert — die Lösung ist damit CMS-unabhängig.
 */

/**
 * Liest den `event`-Query-Parameter (Event-UUID) aus der URL.
 *
 * @param {string} [url]  URL, standardmäßig die aktuelle Browser-URL.
 * @returns {string|null}
 */
export function getEventUuidFromUrl(url = window.location.href) {
  return new URL(url).searchParams.get('event')
}

/**
 * Erzeugt eine URL mit gesetztem (`uuid`) bzw. entferntem (`null`/`''`)
 * `event`-Parameter. Bestehende Query-Parameter, Pfad und Hash bleiben
 * unverändert erhalten.
 *
 * @param {string|null} [uuid]
 * @param {string} [url]  Ausgangs-URL, standardmäßig die aktuelle Browser-URL.
 * @param {string} [dateSlug] Slug des Veranstaltungstermins, der über den
 *   `date`-Query-Parameter an die URL angehängt wird.
 * @returns {string}
 */
export function buildEventUrl(event, url = window.location.href) {
  const uuid = event?.uuid
  const dateSlug = event?.date_slug
  const parsed = new URL(url)
  if (uuid) {
    parsed.searchParams.set('event', uuid)
    parsed.searchParams.set('date', dateSlug)
  } else {
    parsed.searchParams.delete('event')
    parsed.searchParams.delete('date')
  }
  return parsed.toString()
}

/**
 * Entscheidet, ob ein Klick auf einen Event-Card-Link vom Widget selbst
 * behandelt werden soll (SPA-Navigation ohne Reload). Klicks mit
 * Modifier-Tasten sowie Mittelklicks überlassen dem Browser die normale
 * Link-Navigation (z. B. Öffnen in einem neuen Tab).
 *
 * @param {MouseEvent} event
 * @returns {boolean}
 */
export function isWidgetNavigationClick(event) {
  return !(
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
  )
}
