import { ref, computed } from 'vue'
import { BASE_URL, DETAIL_URL, PARAM_MAP } from '../lib/constants'

export default function useEventsApi(config) {
  const events = ref([])
  const page = ref(1)
  const requestCursors = ref([])
  const hasNext = ref(true)
  const loading = ref(false)
  const error = ref('')
  const summary = ref(null)
  const selectedCategories = ref([])
  const detailUuid = ref(null)
  const detailData = ref(null)
  const detailLoading = ref(false)
  const detailError = ref('')

  const totalPages = computed(() => {
    if (!summary.value) return 0
    return Math.ceil(summary.value.total_event_count / config.value.limit)
  })

  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false
    try {
      const parsed = new URL(url, window.location.href)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const detailLinks = computed(() => {
    const d = detailData.value
    if (!d) return []
    const links = []
    if (isSafeUrl(d.source_link)) {
      links.push({ url: d.source_link, label: 'Veranstaltungslink' })
    }
    if (isSafeUrl(d.org_web_link)) {
      links.push({ url: d.org_web_link, label: 'Webseite des Veranstalters' })
    }
    if (d.event_links && Array.isArray(d.event_links)) {
      for (const l of d.event_links) {
        if (isSafeUrl(l.url)) links.push({ url: l.url, label: l.label || l.type || l.url })
      }
    }
    return links
  })

  function buildParams() {
    const params = new URLSearchParams()
    if (selectedCategories.value.length > 0) {
      params.set('categories', selectedCategories.value.join(','))
    }
    for (const [key, val] of Object.entries(config.value)) {
      if (key === 'limit') continue
      const apiKey = PARAM_MAP[key]
      if (!apiKey) continue
      params.set(apiKey, Array.isArray(val) ? val.join(',') : val)
    }
    return params
  }

  function buildUrl(cursor) {
    const params = buildParams()
    params.set('limit', config.value.limit)
    if (cursor) {
      params.set('last_event_date_uuid', cursor.date_uuid)
      params.set('last_event_start_at', cursor.start_at)
    }
    return `${BASE_URL}?${params.toString()}`
  }

  function buildSummaryUrl() {
    const params = buildParams()
    return `${BASE_URL.replace('/events', '/events/type-summary')}?${params.toString()}`
  }

  async function loadSummary() {
    try {
      const res = await fetch(buildSummaryUrl())
      if (!res.ok) return
      const json = await res.json()
      if (json.status !== 200 || !json.data) return
      summary.value = json.data
    } catch {
      // stille ignorieren – Summary ist optional
    }
  }

  function selectCategories(next) {
    selectedCategories.value = next
    page.value = 1
    requestCursors.value = []
    hasNext.value = true
    events.value = []
    summary.value = null
    loadEvents()
    loadSummary()
  }

  async function loadEvents(direction) {
    if (loading.value) return
    loading.value = true
    error.value = ''
    try {
      let cursor = null
      if (direction === 'next') {
        cursor = requestCursors.value[page.value - 1] || null
      } else if (direction === 'prev') {
        requestCursors.value.pop()
        page.value--
        cursor = requestCursors.value[page.value - 1] || null
        events.value = []
      }

      const res = await fetch(buildUrl(cursor))
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      if (json.status !== 200 || !json.data) throw new Error('Ungültige API-Antwort')

      const result = json.data.events || []
      const lastUuid = json.data.last_event_date_uuid
      const lastStart = json.data.last_event_start_at

      events.value = result
      hasNext.value = result.length === config.value.limit && !!lastUuid
      if (lastUuid) {
        requestCursors.value.push({ date_uuid: lastUuid, start_at: lastStart })
      }
      if (direction === 'next') page.value++
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadDetail() {
    if (!detailUuid.value) return
    detailLoading.value = true
    detailError.value = ''
    try {
      const res = await fetch(DETAIL_URL(detailUuid.value))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.status !== 200 || !json.data) throw new Error('Ungültige Antwort')
      detailData.value = json.data
    } catch (err) {
      detailError.value = err.message
    } finally {
      detailLoading.value = false
    }
  }

  function openDetail(e) {
    detailUuid.value = e.uuid
    detailData.value = null
    if (window.history.pushState) {
      window.history.pushState({}, '', `?event=${e.uuid}`)
    }
    loadDetail()
  }

  function closeDetail() {
    if (window.history.pushState) {
      window.history.pushState({}, '', window.location.pathname)
    }
    detailUuid.value = null
    detailData.value = null
    loadEvents()
    loadSummary()
  }

  function onUrlChange() {
    const params = new URLSearchParams(window.location.search)
    const uuid = params.get('event')
    if (uuid) {
      detailUuid.value = uuid
      detailData.value = null
      loadDetail()
    } else {
      detailUuid.value = null
      detailData.value = null
      loadEvents()
      loadSummary()
    }
  }

  return {
    events,
    page,
    hasNext,
    loading,
    error,
    summary,
    totalPages,
    selectedCategories,
    detailUuid,
    detailData,
    detailLoading,
    detailError,
    detailLinks,
    loadEvents,
    loadDetail,
    loadSummary,
    selectCategories,
    openDetail,
    closeDetail,
    onUrlChange
  }
}
