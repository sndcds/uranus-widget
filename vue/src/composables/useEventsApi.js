import { ref, computed, nextTick } from 'vue'
import {
  PARAM_MAP,
  OVERRIDABLE_PARAMS,
} from '../lib/constants'

export default function useEventsApi(config) {
  const events = ref([])
  const hasMore = ref(true)
  const cursor = ref(null)
  const loading = ref(false)
  const error = ref('')
  const summary = ref(null)

  const selectedCategories = ref([])

  const selectedType = ref(null)

  const selectedRange = ref(null)

  const searchTerm = ref('')

  const detailUuid = ref(null)
  const detailData = ref(null)
  const detailLoading = ref(false)
  const detailError = ref('')

  const detailScrollY = ref(0)

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
     * Event type selected in the filter bar narrows the results.
     */
    if (selectedType.value != null) {
      filter.event_types = [Number(selectedType.value)]
    }

    /*
     * Date range selected in the filter bar overrides the configured
     * start/end window.
     */
    if (selectedRange.value) {
      if (selectedRange.value.start) {
        filter.start = selectedRange.value.start
      } else {
        delete filter.start
      }

      if (selectedRange.value.end) {
        filter.end = selectedRange.value.end
      } else {
        delete filter.end
      }
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

    if (searchTerm.value) {
      params.set('search', searchTerm.value)
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

  async function loadMore() {
    if (loading.value || !hasMore.value) return

    loading.value = true
    error.value = ''

    try {
      const res = await fetch(
          getEventsUrl(),
          buildFilterRequest(cursor.value)
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

      // Append instead of replacing
      events.value.push(...result)

      const limit = buildPayload().limit

      hasMore.value =
          result.length === limit &&
          !!lastUuid

      if (lastUuid) {
        cursor.value = {
          date_uuid: lastUuid,
          start_at: lastStart,
        }
      }
    } catch (err) {
      error.value =
          err instanceof Error
              ? err.message
              : String(err)
    } finally {
      loading.value = false
    }
  }

  /*
   * --------------------------------------------------------------------------
   * Category selection
   * --------------------------------------------------------------------------
   */

  function selectCategories(next) {
    selectedCategories.value = next

    resetPagination()

    loadMore()
    loadSummary()
  }

  function setCategories(categories) {
    selectedCategories.value = Array.isArray(categories)
        ? [...categories]
        : []
  }

  function selectType(next) {
    selectedType.value = next == null || next === ''
        ? null
        : Number(next)

    resetPagination()

    loadMore()
    loadSummary()
  }

  function selectRange(range) {
    selectedRange.value = range && (range.start || range.end)
        ? { ...range }
        : null

    resetPagination()

    loadMore()
    loadSummary()
  }

  /*
   * --------------------------------------------------------------------------
   * Free text search
   * --------------------------------------------------------------------------
   */

  function resetPagination() {
    events.value = []
    cursor.value = null
    hasMore.value = true
    summary.value = null
  }

  function setSearch(term) {
    searchTerm.value = (term || '').toString().trim()

    resetPagination()

    loadMore()
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
    detailScrollY.value = window.scrollY

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

  async function closeDetail() {
    if (window.history.pushState) {
      window.history.pushState(
          {},
          '',
          window.location.pathname
      )
    }

    detailUuid.value = null
    detailData.value = null

    await nextTick()

    window.scrollTo({
      top: detailScrollY.value,
      behavior: 'auto',
    })
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

      resetPagination()

      loadMore()
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
    hasMore,
    loading,
    error,

    summary,
    selectedCategories,
    selectedType,
    selectedRange,
    searchTerm,

    detailUuid,
    detailData,
    detailLoading,
    detailError,
    detailLinks,

    loadMore,
    loadSummary,

    selectCategories,
    setCategories,
    setSearch,
    selectType,
    selectRange,

    openDetail,
    closeDetail,
    onUrlChange,
  }
}