/**
 * Gemeinsame Hilfsfunktionen für Event-Card-Varianten.
 *
 * Die Preise werden aus den vorhandenen Event-Daten abgeleitet —
 * es wird keine eigene Preislogik geführt. Ist eine Information nicht
 * vorhanden (oder nicht eindeutig), wird KEIN Hinweis gerendert.
 *
 * `release_status`-Werte und `price_type`-Werte stammen aus der Uranus-API.
 */

/**
 * Liefert den i18n-Key für einen Preis-Hinweis oder null.
 * Eingesetzt werden die vorhandenen Event-Preis-Daten (`price_type`).
 *
 * @param {Object} event
 * @returns {string|null} z. B. 'eventCard.priceFree' | 'eventCard.priceDonation'
 */
export function priceKey(event) {
  const type = event?.price_type

  if (type === 'free') return 'eventCard.priceFree'
  if (type === 'donation' || type === 'donations') return 'eventCard.priceDonation'

  return null
}

/**
 * Liefert den i18n-Key für einen Release-Status-Hinweis oder null.
 *
 * @param {Object} event
 * @returns {string|null}
 *   'eventCard.statusCancelled' | 'eventCard.statusPostponed' |
 *   'eventCard.statusMoved'     | null
 */
export function releaseStatusKey(event) {
  const status = event?.release_status

  if (['cancelled', 'canceled'].includes(status)) return 'eventCard.statusCancelled'
  if (['rescheduled', 'postponed'].includes(status)) return 'eventCard.statusPostponed'
  if (['moved', 'relocated'].includes(status)) return 'eventCard.statusMoved'

  return null
}

/**
 * Formatiert den Ort als "Ortname, Stadt" — genau ein Leerzeichen nach dem
 * Komma. Nur Bestandteile, die vorhanden sind, werden ausgegeben.
 *
 * @param {Object} event
 * @returns {string}
 */
export function venueLabel(event) {
  const parts = []
  if (event?.venue_name) parts.push(String(event.venue_name))
  if (event?.venue_city) parts.push(String(event.venue_city))
  return parts.join(', ')
}
