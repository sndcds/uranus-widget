/**
 * Typen & Defaults für die Konfiguration der Event-Cards
 * (`config.event_card`).
 *
 * Die Typen sind als JSDoc-typedefs dokumentiert (kompatibel mit dem
 * JS-Build); das Modul exportiert zudem Defaults und eine Normierungs-
 * Funktion, damit unbekannte Varianten sicher auf "standard" fallen.
 */

/**
 * Bild-Parameter für die Image-Query des Event-Bildes.
 * @typedef {Object} ImageConfig
 * @property {string} ratio    Seitenverhältnis, z. B. "4/3" oder "16:9"
 * @property {number} width    Zielbreite in Pixel
 * @property {number} quality  Bildqualität (0-100)
 * @property {string} type     Ausgabeformat, z. B. "webp"
 */

/**
 * Unterstützte (vordefinierte) Card-Varianten.
 * @typedef {'standard'|'compact'|'minimal'} EventCardVariant
 */

/**
 * Konfiguration einer Event-Card.
 * @typedef {Object} EventCardConfig
 * @property {EventCardVariant} variant   Aktive Variante
 * @property {ImageConfig} image          Bild-Parameter
 */

/** @type {EventCardVariant} */
export const DEFAULT_EVENT_CARD_VARIANT = 'standard'

/** @type {ReadonlyArray<EventCardVariant>} */
export const EVENT_CARD_VARIANTS = ['standard', 'compact', 'minimal']

/** @type {ImageConfig} */
export const DEFAULT_IMAGE_CONFIG = {
  ratio: '16:9',
  width: 480,
  quality: 80,
  type: 'webp',
}

/** @type {EventCardConfig} */
export const DEFAULT_EVENT_CARD_CONFIG = {
  variant: DEFAULT_EVENT_CARD_VARIANT,
  image: { ...DEFAULT_IMAGE_CONFIG },
}

/**
 * Prüft, ob ein Wert eine unterstützte Variante ist.
 * @param {unknown} value
 * @returns {value is EventCardVariant}
 */
export function isEventCardVariant(value) {
  return (
      typeof value === 'string' &&
      EVENT_CARD_VARIANTS.includes(value)
  )
}

/**
 * Normiert eine (ggf. unvollständige/ungültige) Konfiguration zu einer
 * vollständigen, "typsicheren" EventCardConfig. Unbekannte Varianten fallen
 * auf "standard" zurück; fehlende Bild-Werte übernehmen die Defaults.
 *
 * @param {unknown} value
 * @returns {EventCardConfig}
 */
export function normalizeEventCardConfig(value) {
  const source = value && typeof value === 'object' ? value : {}

  const variant = isEventCardVariant(source.variant)
      ? source.variant
      : DEFAULT_EVENT_CARD_VARIANT

  const rawImage = source.image && typeof source.image === 'object'
      ? source.image
      : {}

  const image = {
    ratio: rawImage.ratio || DEFAULT_IMAGE_CONFIG.ratio,
    width: typeof rawImage.width === 'number'
        ? rawImage.width
        : DEFAULT_IMAGE_CONFIG.width,
    quality: typeof rawImage.quality === 'number'
        ? rawImage.quality
        : DEFAULT_IMAGE_CONFIG.quality,
    type: rawImage.type || DEFAULT_IMAGE_CONFIG.type,
  }

  return { variant, image }
}
