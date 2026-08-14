import { ref, watch } from 'vue'

const DEFAULT_LIMIT = 12

export default function useWidgetConfig(props) {
  const config = ref({})
  const configLoaded = ref(false)
  const configError = ref('')
  const styles = ref([])

  function extractStyles(value) {
    return value && Array.isArray(value.styles) ? value.styles : value && value.styles ? [value.styles] : []
  }

  function fromProps() {
    const result = {
      filter: {}
    }

    if (props.limit != null) {
      result.filter.limit = props.limit
    }

    if (props.start) {
      result.filter.start = props.start
    }

    if (props.end) {
      result.filter.end = props.end
    }

    if (props.portal) {
      result.filter.portal = props.portal
    }

    if (props.tags) {
      result.filter.tags = props.tags
    }

    if (props.venue) {
      result.filter.venue = props.venue
    }

    if (props.city) {
      result.filter.city = props.city
    }

    if (props.categories) {
      result.filter.categories = props.categories
    }

    return result
  }

  async function loadFromUrl(url) {
    const resolved = new URL(url, window.location.href)
    const res = await fetch(resolved.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const json = await res.json()
    if (!json || typeof json !== 'object') throw new Error('Ungültige Konfiguration')
    return json
  }

  async function init() {
    configError.value = null
    configLoaded.value = false

    try {
      // 1. Defaults — lowest priority

      const defaults = {
        styles: [],
        filter: {
          limit: DEFAULT_LIMIT,
        },
      }

      // 2. External configuration

      let externalConfig = {}

      if (props.config && typeof props.config === 'object') {
        externalConfig = props.config
      } else if (props.configUrl) {
        externalConfig = await loadFromUrl(props.configUrl)
      }

      // 3. HTML attributes — highest priority

      const propConfig = fromProps()

      // 4. Merge
      // HTML attributes > external config > defaults

      config.value = {
        ...defaults,
        ...externalConfig,
        ...propConfig,

        filter: {
          ...defaults.filter,
          ...(externalConfig.filter || {}),
          ...(propConfig.filter || {}),
        },
      }

      // 5. Normalize

      // Always ensure a valid limit
      config.value.filter.limit =
          Number(config.value.filter.limit) || DEFAULT_LIMIT

      // Former configuration expects styles to be an array
      if (!Array.isArray(config.value.styles)) {
        config.value.styles = []
      }

      styles.value = config.value.styles

      // 6. Configuration is ready

      configLoaded.value = true

    } catch (err) {
      configError.value =
          err.message || 'Konfiguration konnte nicht geladen werden'

      configLoaded.value = true
    }
  }

  return {
    config,
    configLoaded,
    configError,
    styles,
    init,
  }
}
