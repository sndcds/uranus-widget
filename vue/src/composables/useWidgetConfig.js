import { ref, computed, watch } from 'vue'

const DEFAULT_LIMIT = 12

export default function useWidgetConfig(props) {
  const config = ref({})
  const configLoaded = ref(false)
  const configError = ref('')

  function fromProps() {
    const cfg = {}
    for (const key of Object.keys(props)) {
      const val = props[key]
      if (key === 'config' || key === 'configUrl') continue
      if (val !== undefined && val !== null && val !== '') {
        cfg[key] = val
      }
    }
    return cfg
  }

  function applyConfig(value) {
    if (value && typeof value === 'object') {
      config.value = { ...value }
    } else {
      config.value = {}
    }
    config.value.limit = Number(config.value.limit) || DEFAULT_LIMIT
    configLoaded.value = true
    configError.value = ''
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
    config.value = fromProps()
    config.value.limit = Number(config.value.limit) || DEFAULT_LIMIT
    configLoaded.value = true

    if (props.config && typeof props.config === 'object') {
      applyConfig(props.config)
      return
    }

    if (props.configUrl) {
      configLoaded.value = false
      try {
        const json = await loadFromUrl(props.configUrl)
        applyConfig(json)
      } catch (err) {
        configError.value = err.message || 'Konfiguration konnte nicht geladen werden'
        configLoaded.value = true
      }
      return
    }

    if (!Object.keys(config.value).length) {
      config.value = { limit: DEFAULT_LIMIT }
    }
  }

  watch(
    () => props.config,
    (val) => {
      if (val && typeof val === 'object') applyConfig(val)
    }
  )

  return {
    config,
    configLoaded,
    configError,
    init,
    applyConfig
  }
}
