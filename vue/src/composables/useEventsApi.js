import { ref, computed } from 'vue'
import {
  PARAM_MAP,
  OVERRIDABLE_PARAMS,
} from '../lib/constants'

export default function useEventsApi(config) {
  const events = ref([])
  const page = ref(1)
  const requestCursors = ref([])
  const hasNext = ref(true)
  const loading = ref(false)
  const error = ref('')
  const summary = ref(null)

  const selectedCategories = ref([])

  const searchTerm = ref('')

  const detailUuid = ref(null)
  const detailData = ref(null)
  const detailLoading = ref(false)
  const detailError = ref('')

  const totalPages = computed(() => {
    if (!summary.value) return 0

    const limit = Number(config.value.filter.limit)
    if (!limit || limit <= 0) return 0

    return Math.ceil(summary.value.total_event_count / limit)
  })


  /*
   * --------------------------------------------------------------------------
   * Url
   * --------------------------------------------------------------------------
   */

  function getApiBaseUrl() {
    return String(config.value.apiBaseUrl || '').replace(/\/$/, '')
  }

  function getEventsUrl() {
    return `${getApiBaseUrl()}/events/filter`
  }

  function getSummaryUrl() {
    return `${getApiBaseUrl()}/events/type-summary`
  }

  function getDetailUrl(uuid) {
    return `${getApiBaseUrl()}/event/${uuid}?lang=de`
  }

  /*
   * --------------------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------------------
   */

  function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false

    try {
      const parsed = new URL(url, window.location.href)

      return (
          parsed.protocol === 'http:' ||
          parsed.protocol === 'https:'
      )
    } catch {
      return false
    }
  }

  function parseUrlValue(key, value) {
    /*
     * URL parameters are always strings.
     * Convert them back to the types expected by the JSON API.
     */

    // Comma-separated arrays
    const arrayParameters = new Set([
      'categories',
      'genres',
      'venue',
    ])

    if (arrayParameters.has(key)) {
      return value
          .split(',')
          .map(v => v.trim())
          .filter(Boolean)
    }

    // Integer parameters
    const integerParameters = new Set([
      'min_age',
      'max_age',
    ])

    if (integerParameters.has(key)) {
      const parsed = Number.parseInt(value, 10)
      return Number.isNaN(parsed) ? value : parsed
    }

    // Float parameters
    const floatParameters = new Set([
      'latitude',
      'longitude',
      'radius_km',
      'min_price',
      'max_price',
    ])

    if (floatParameters.has(key)) {
      const parsed = Number.parseFloat(value)
      return Number.isNaN(parsed) ? value : parsed
    }

    // Boolean parameters
    const booleanParameters = new Set([
      'use_current_location',
    ])

    if (booleanParameters.has(key)) {
      if (value === 'true') return true
      if (value === 'false') return false
    }

    return value
  }

  /*
   * --------------------------------------------------------------------------
   * Filter / request payload
   * --------------------------------------------------------------------------
   */

  function buildFilter() {
    const filter = {
      ...(config.value.filter || {}),
    }

    /*
     * Backwards compatibility:
     *
     * If the configuration still contains properties such as start,
     * end, city, etc. directly on config, PARAM_MAP can translate them
     * into the API filter.
     */
    for (const [key, value] of Object.entries(config.value)) {
      const apiKey = PARAM_MAP[key]

      if (!apiKey) continue
      if (key === 'limit') continue

      filter[apiKey] = value
    }

    /*
     * Categories selected interactively in the widget take precedence
     * over the configured categories.
     */
    if (selectedCategories.value.length > 0) {
      filter.categories = selectedCategories.value
    }

    /*
     * URL query parameters override the widget configuration.
     */
    const urlParams = new URLSearchParams(window.location.search)

    for (const [key, value] of urlParams.entries()) {
      if (!OVERRIDABLE_PARAMS.has(key)) continue

      filter[key] = parseUrlValue(key, value)
    }

    return filter
  }

  function buildPayload(cursor = null) {
    const payload = buildFilter()
    payload.limit = Number(config.value.filter.limit)
    payload.start = config.value.filter.start
    payload.end = config.value.filter.end
    payload.portal = config.value.filter.portal

    if (searchTerm.value) {
      payload.search = searchTerm.value
    }

    if (cursor) {
      payload.last_event_date_uuid = cursor.date_uuid
      payload.last_event_start_at = cursor.start_at
    }

    /*
     * Allow the host page URL to override the pagination limit too.
     */
    const urlParams = new URLSearchParams(window.location.search)

    if (urlParams.has('limit')) {
      const limit = Number.parseInt(
          urlParams.get('limit'),
          10
      )

      if (!Number.isNaN(limit)) {
        payload.limit = limit
      }
    }

    return payload
  }

  function buildFilterRequest(cursor = null) {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(cursor)),
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Summary
   * --------------------------------------------------------------------------
   */

  function buildSummaryUrl() {
    const params = new URLSearchParams()

    const filter = buildFilter()

    for (const [key, value] of Object.entries(filter)) {
      if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else if (value !== null && value !== undefined) {
        params.set(key, String(value))
      }
    }

    return `${config.value.apiBaseUrl}/events/type-summary?${params.toString()}`
  }

  async function loadSummary() {
    try {
      const res = await fetch(buildSummaryUrl())

      if (!res.ok) return

      const json = await res.json()

      if (json.status !== 200 || !json.data) return

      summary.value = json.data
    } catch {
      // Summary is optional.
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Events
   * --------------------------------------------------------------------------
   */

  async function loadEvents(direction) {
    if (loading.value) return

    loading.value = true
    error.value = ''

    try {
      let cursor = null

      if (direction === 'next') {
        cursor =
            requestCursors.value[page.value - 1] ||
            null
      } else if (direction === 'prev') {
        requestCursors.value.pop()
        page.value--
        if (page.value > 1) {
          cursor =
              requestCursors.value[page.value - 2] ||
              null
        } else {
          cursor = [];
        }

        events.value = []
      }

      const res = await fetch(
          getEventsUrl(),
          buildFilterRequest(cursor)
      )

      if (!res.ok) {
        throw new Error(
            `HTTP ${res.status}: ${res.statusText}`
        )
      }

      const json = await res.json()

      if (json.status !== 200 || !json.data) {
        throw new Error('Ungültige API-Antwort')
      }

      const result = json.data.events || []

      const lastUuid =
          json.data.last_event_date_uuid

      const lastStart =
          json.data.last_event_start_at

      events.value = result

      const limit =
          buildPayload().limit

      hasNext.value =
          result.length === limit &&
          !!lastUuid

      if (lastUuid && direction !== 'prev') {
        requestCursors.value.push({
          date_uuid: lastUuid,
          start_at: lastStart,
        })
      }

      if (direction === 'next') {
        page.value++
      }
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }

    // console.log("requestCursors:", JSON.stringify(requestCursors.value, null, 2))
  }

  /*
   * --------------------------------------------------------------------------
   * Category selection
   * --------------------------------------------------------------------------
   */

  function selectCategories(next) {
    selectedCategories.value = next

    resetPagination()

    loadEvents()
    loadSummary()
  }

  function setCategories(categories) {
    selectedCategories.value = Array.isArray(categories)
        ? [...categories]
        : []
  }

  /*
   * --------------------------------------------------------------------------
   * Free text search
   * --------------------------------------------------------------------------
   */

  function resetPagination() {
    page.value = 1
    requestCursors.value = []
    hasNext.value = true
    summary.value = null
  }

  function setSearch(term) {
    searchTerm.value = (term || '').toString().trim()

    resetPagination()

    loadEvents()
    loadSummary()
  }

  /*
   * --------------------------------------------------------------------------
   * Event detail
   * --------------------------------------------------------------------------
   */

  const detailLinks = computed(() => {
    const d = detailData.value

    if (!d) return []

    const links = []

    if (isSafeUrl(d.source_link)) {
      links.push({
        url: d.source_link,
        label: 'Veranstaltungslink',
      })
    }

    if (isSafeUrl(d.org_web_link)) {
      links.push({
        url: d.org_web_link,
        label: 'Webseite des Veranstalters',
      })
    }

    if (
        d.event_links &&
        Array.isArray(d.event_links)
    ) {
      for (const l of d.event_links) {
        if (isSafeUrl(l.url)) {
          links.push({
            url: l.url,
            label:
                l.label ||
                l.type ||
                l.url,
          })
        }
      }
    }

    return links
  })

  async function loadDetail() {
    if (!detailUuid.value) return

    detailLoading.value = true
    detailError.value = ''

    try {
      const res = await fetch(
          getDetailUrl(detailUuid.value)
      )

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const json = await res.json()

      if (json.status !== 200 || !json.data) {
        throw new Error('Ungültige Antwort')
      }

      detailData.value = json.data
    } catch (err) {
      detailError.value = err.message
    } finally {
      detailLoading.value = false
    }
  }

  function openDetail(event) {
    detailUuid.value = event.uuid
    detailData.value = null

    if (window.history.pushState) {
      window.history.pushState(
          {},
          '',
          `?event=${event.uuid}`
      )
    }

    loadDetail()
  }

  function closeDetail() {
    if (window.history.pushState) {
      window.history.pushState(
          {},
          '',
          window.location.pathname
      )
    }

    detailUuid.value = null
    detailData.value = null

    loadEvents()
    loadSummary()
  }

  /*
   * --------------------------------------------------------------------------
   * Browser URL changes
   * --------------------------------------------------------------------------
   */

  function onUrlChange() {
    const params = new URLSearchParams(
        window.location.search
    )

    const uuid = params.get('event')

    if (uuid) {
      detailUuid.value = uuid
      detailData.value = null

      loadDetail()
    } else {
      detailUuid.value = null
      detailData.value = null

      /*
       * URL filter parameters may have changed, so
       * start pagination from the beginning.
       */
      page.value = 1
      requestCursors.value = []
      hasNext.value = true

      loadEvents()
      loadSummary()
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Public API
   * --------------------------------------------------------------------------
   */

  return {
    events,
    page,
    hasNext,
    loading,
    error,

    summary,
    totalPages,

    selectedCategories,

    searchTerm,

    detailUuid,
    detailData,
    detailLoading,
    detailError,
    detailLinks,

    loadEvents,
    loadDetail,
    loadSummary,

    selectCategories,
    setCategories,

    setSearch,

    openDetail,
    closeDetail,
    onUrlChange,
  }
}