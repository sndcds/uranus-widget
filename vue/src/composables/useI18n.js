import { computed } from 'vue'
import de from '../locales/de.json'
import da from '../locales/da.json'
import en from '../locales/en.json'
import es from '../locales/es.json'

const MESSAGES = {
  de,
  da,
  en,
  es
}

const DEFAULT_LANG = 'de'

const LOCALE_MAP = {
  de: 'de-DE',
  da: 'da-DK',
  en: 'en-GB',
  es: 'es-ES'
}

function resolve(messages, path) {
  let node = messages
  for (const part of String(path).split('.')) {
    if (node == null) return undefined
    node = node[part]
  }
  return node
}

function interpolate(template, params) {
  if (!params) return template
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
      key in params ? params[key] : match
  )
}

export function useI18n(lang) {
  const locale = computed(() => LOCALE_MAP[lang.value] || LOCALE_MAP[DEFAULT_LANG])

  const t = (path, params) => {
    const active = MESSAGES[lang.value] || MESSAGES[DEFAULT_LANG]

    let value = resolve(active, path)
    if (value == null) value = resolve(MESSAGES[DEFAULT_LANG], path)
    if (value == null) value = path

    return interpolate(value, params)
  }

  return { t, locale }
}
