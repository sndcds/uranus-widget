/**
 * AI-Label für Event-Bilder.
 *
 * Ordnet dem `images.main.ai_label`-Wert das passende, bereits vorhandene
 * Label-Asset unter `src/assets/ai_labels` zu. Werte `"none"`/leer ergeben
 * KEIN Label. Es wird keine Mapping-Logik in den Komponenten dupliziert.
 */
import labelAi from '../assets/ai_labels/label_ai_black_transparent.svg'
import labelAiGenerated from '../assets/ai_labels/label_ai_generated_black_transparent.svg'
import labelAiModified from '../assets/ai_labels/label_ai_modified_black_transparent.svg'

/** Zuordnung ai_label-Wert -> Label-Asset-URL. */
const AI_LABEL_IMAGES = {
  'ai': labelAi,
  'ai_generated': labelAiGenerated,
  'ai_modified': labelAiModified,
}

/**
 * Liefert die Icon-URL des AI-Labels für einen ai_label-Wert
 * ('' wenn kein/nicht-nutzbares Label).
 *
 * @param {string|undefined|null} aiLabel
 * @returns {string}
 */
export function aiLabelImage(aiLabel) {
  if (!aiLabel || aiLabel === 'none') return ''
  return AI_LABEL_IMAGES[aiLabel] || ''
}
