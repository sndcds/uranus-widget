import { ref, onScopeDispose } from 'vue'
import { buildEventFilter } from '../lib/eventFilter.js'
import { fetchApi } from '../lib/api.js'

// Each result context owns its cursor, requests and loaded cards (overview / venue).
export default function useEventsApi(config, { venueUuid } = {}) {
  const events = ref([])
  const hasMore = ref(true)
  const loading = ref(false)
  const error = ref('')
  const summary = ref(null)
  const selectedCategories = ref([])
  const selectedType = ref(null)
  const selectedRange = ref(null)
  const searchTerm = ref('')
  let cursor = null
  let initialized = false
  let version = 0
  let controller
  let summaryController

  function payload() {
    const filter = buildEventFilter(config.value, venueUuid ? {} : {
      categories: selectedCategories.value,
      type: selectedType.value,
      range: selectedRange.value,
      search: searchTerm.value,
    }, window.location.search)
    if (venueUuid?.value) filter.venue_uuids = [venueUuid.value]
    return filter
  }
  function base() { return String(config.value.apiBaseUrl || '').replace(/\/$/, '') }

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const request = version
    const filter = payload()
    // A venue detail must not widen a configured UUID restriction.
    const allowed = config.value.filter?.venue_uuids
    const allowedIds = typeof allowed === 'string' ? allowed.split(',').map(v => v.trim()) : allowed
    if (venueUuid?.value && allowedIds?.length && !allowedIds.includes(venueUuid.value)) {
      initialized = true
      hasMore.value = false
      return
    }
    if (cursor) {
      filter.last_event_date_uuid = cursor.date_uuid
      filter.last_event_start_at = cursor.start_at
    }
    controller = new AbortController()
    loading.value = true
    error.value = ''
    try {
      const data = await fetchApi(`${base()}/events/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
        signal: controller.signal,
      })
      if (request !== version) return
      const result = data.events ?? []
      if (!Array.isArray(result)) throw new Error('Invalid events response')
      events.value.push(...result)
      initialized = true
      hasMore.value = result.length >= filter.limit && !!data.last_event_date_uuid
      cursor = data.last_event_date_uuid ? {
        date_uuid: data.last_event_date_uuid,
        start_at: data.last_event_start_at,
      } : null
    } catch (err) {
      if (request === version && err.name !== 'AbortError') error.value = err.message
    } finally {
      if (request === version) loading.value = false
    }
  }

  async function loadSummary() {
    if (venueUuid) return
    summaryController?.abort()
    summaryController = new AbortController()
    const request = version
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(payload())) {
      if (value != null) params.set(key, Array.isArray(value) ? value.join(',') : String(value))
    }
    try {
      const data = await fetchApi(`${base()}/events/type-summary?${params}`, { signal: summaryController.signal })
      if (request === version) summary.value = data
    } catch { /* Counts are optional; event loading has its own error state. */ }
  }

  function reset() {
    version++
    controller?.abort()
    summaryController?.abort()
    events.value = []
    cursor = null
    hasMore.value = true
    loading.value = false
    error.value = ''
    summary.value = null
    initialized = false
  }
  function refresh() { reset(); loadMore(); loadSummary() }
  function ensureLoaded() { if (!initialized && !loading.value) { loadMore(); loadSummary() } }
  function selectCategories(next) { selectedCategories.value = [...next]; refresh() }
  function setCategories(next) { selectedCategories.value = Array.isArray(next) ? [...next] : [] }
  function selectType(next) { selectedType.value = next === '' || next == null ? null : Number(next); refresh() }
  function selectRange(next) { selectedRange.value = next; refresh() }
  function setSearch(next) { searchTerm.value = String(next || '').trim(); refresh() }

  onScopeDispose(() => { version++; controller?.abort(); summaryController?.abort() })
  return {
    events, hasMore, loading, error, summary,
    selectedCategories, selectedType, selectedRange, searchTerm,
    loadMore, loadSummary, refresh, reset, ensureLoaded,
    selectCategories, setCategories, selectType, selectRange, setSearch,
  }
}
