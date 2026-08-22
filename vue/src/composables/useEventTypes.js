import { ref, watch } from 'vue'

/**
 * Shared, gecachter Zugriff auf die Event-Typ-Labels
 * (Endpoint `/event/type-genre-lookup`).
 *
 * Wird von der Type-Auswahl (EventTypeSelect) und von den
 * Event-Card-Varianten genutzt, um zu `type_id`-Werten passende Labels
 * darzustellen. Das Lookup wird einmalig pro API-Basis geladen und
 * anschließend für alle Konsumenten wiederverwendet.
 */

/** @type {Record<string, { labels: Record<string,string>, loading: boolean, loaded: boolean }>} */
const cache = {}

/**
 * @param {() => string} baseGetter  Liefert die API-Basis-URL.
 * @param {() => string} langGetter  Liefert die aktuelle Widget-Sprache.
 * @returns {{
 *   labels: import('vue').Ref<Record<string,string>>,
 *   isLoading: import('vue').Ref<boolean>,
 *   label: (typeId: number|string|undefined|null) => string
 * }}
 */
export function useEventTypes(baseGetter, langGetter) {
  const labels = ref({})
  const isLoading = ref(false)

  async function load(base) {
    if (!base) return

    const entry = cache[base]
    if (!entry) {
      cache[base] = { labels: {}, loading: false, loaded: false }
    }
    const c = cache[base]

    c.loading = true
    isLoading.value = true

    try {
      const res = await fetch(`${base}/event/type-genre-lookup`)
      if (!res.ok) return

      const json = await res.json()
      const data = json.data || {}

      // Das Lookup kennt de, en, da. Bevorzugt die aktuelle Sprache,
      // sonst Fallback auf die verfügbaren.
      const lang = (langGetter && langGetter()) || 'de'
      const active = data[lang] || data.de || data.en || data.da || {}
      const types = active.types || {}

      c.labels = {}
      for (const [id, item] of Object.entries(types)) {
        c.labels[id] = item?.name || id
      }

      labels.value = c.labels
    } catch {
      // Lookup ist optional.
    } finally {
      c.loading = false
      c.loaded = true
      isLoading.value = false
    }
  }

  // Basis-URL beobachten und bei Änderung (nach-)laden
  watch(
      baseGetter,
      (base) => {
        const normalized = String(base || '').replace(/\/$/, '')
        if (!normalized) return

        const entry = cache[normalized]
        if (entry && entry.loaded) {
          labels.value = entry.labels
          isLoading.value = false
          return
        }
        load(normalized)
      },
      { immediate: true }
  )

  function label(typeId) {
    if (typeId == null) return ''
    return labels.value[String(typeId)] || ''
  }

  return { labels, isLoading, label }
}
