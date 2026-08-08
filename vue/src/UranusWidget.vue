<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const BASE_URL = 'https://api.kulturbytes.de/api/events'

const PARAM_MAP = {
  limit: 'limit',
  tags: 'tags',
  venue: 'venue',
  city: 'city',
  start: 'start',
  end: 'end',
  categories: 'categories'
}

const CATEGORIES = [
  { id: 1, label: 'Kultur' },
  { id: 2, label: 'Bildung' },
  { id: 3, label: 'Sport' },
  { id: 4, label: 'Freizeit' },
  { id: 5, label: 'Familie' },
  { id: 6, label: 'Gesellschaft' }
]

const props = defineProps({
  limit: { type: Number, default: 12 },
  tags: { type: String, default: '' },
  venue: { type: String, default: '' },
  city: { type: String, default: '' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  categories: { type: String, default: '' }
})

const config = computed(() => {
  const cfg = { limit: props.limit || 12 }
  for (const key of Object.keys(PARAM_MAP)) {
    if (key === 'limit') continue
    const val = props[key]
    if (val !== undefined && val !== null && val !== '') {
      cfg[key] = Array.isArray(val) ? val : String(val)
    }
  }
  return cfg
})

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

const detailLinks = computed(() => {
  const d = detailData.value
  if (!d) return []
  const links = []
  if (d.source_link) {
    links.push({ url: d.source_link, label: d.source_link.startsWith('http') ? 'Veranstaltungslink' : d.source_link })
  }
  if (d.org_web_link) {
    links.push({ url: d.org_web_link, label: 'Webseite des Veranstalters' })
  }
  if (d.event_links && Array.isArray(d.event_links)) {
    for (const l of d.event_links) {
      if (l.url) links.push({ url: l.url, label: l.label || l.type || l.url })
    }
  }
  return links
})

function buildUrl(cursor) {
  const params = new URLSearchParams()
  params.set('limit', config.value.limit)
  if (selectedCategories.value.length > 0) {
    params.set('categories', selectedCategories.value.join(','))
  }
  for (const [key, val] of Object.entries(config.value)) {
    if (key === 'limit') continue
    params.set(key, Array.isArray(val) ? val.join(',') : val)
  }
  if (cursor) {
    params.set('last_event_date_uuid', cursor.date_uuid)
    params.set('last_event_start_at', cursor.start_at)
  }
  return `${BASE_URL}?${params.toString()}`
}

function buildSummaryUrl() {
  const params = new URLSearchParams()
  if (selectedCategories.value.length > 0) {
    params.set('categories', selectedCategories.value.join(','))
  }
  for (const [key, val] of Object.entries(config.value)) {
    if (key === 'limit') continue
    params.set(key, Array.isArray(val) ? val.join(',') : val)
  }
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
  }
}

function toggleCategory(id) {
  const idx = selectedCategories.value.indexOf(id)
  if (idx === -1) {
    selectedCategories.value.push(id)
  } else {
    selectedCategories.value.splice(idx, 1)
  }
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
    const res = await fetch(`https://api.kulturbytes.de/api/event/${detailUuid.value}?lang=de`)
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

function formatDateStr(str) {
  try {
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

function formatDate(e) {
  const parts = []
  if (e.start_date) {
    parts.push(formatDateStr(e.start_date))
    if (e.start_time) parts[parts.length - 1] += `, ${e.start_time}`
  }
  if (e.end_date && e.end_date !== e.start_date) {
    parts.push(`– ${formatDateStr(e.end_date)}`)
    if (e.end_time) parts[parts.length - 1] += `, ${e.end_time}`
  } else if (e.end_time && e.end_time !== e.start_time) {
    parts.push(`– ${e.end_time}`)
  }
  return parts.join(' ')
}

function formatDetailDate(venue) {
  return formatDate(venue || {})
}

function renderDescription(text) {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

onMounted(() => {
  window.addEventListener('popstate', onUrlChange)
  onUrlChange()
})

onUnmounted(() => {
  window.removeEventListener('popstate', onUrlChange)
})
</script>

<template>
  <div class="widget">
    <template v-if="detailUuid">
      <button class="btn-back" @click="closeDetail">← Zurück zur Übersicht</button>
      <div class="detail-container">
        <div v-if="detailLoading" class="loading">Lade Details...</div>
        <div v-else-if="detailError" class="error">Fehler beim Laden: {{ detailError }}</div>
        <div v-else-if="detailData" class="detail">
          <div v-if="detailData.images?.main?.url" class="detail-image">
            <img :src="`${detailData.images.main.url}/?ratio=16:9&width=900`" :alt="detailData.title">
          </div>
          <div class="detail-body">
            <h2 class="detail-title">{{ detailData.title }}</h2>
            <p v-if="detailData.subtitle" class="detail-subtitle">{{ detailData.subtitle }}</p>
            <div class="detail-meta">
              <p v-if="detailData.further_dates && detailData.further_dates[0]">
                <strong>Datum &amp; Uhrzeit:</strong> {{ formatDetailDate(detailData.further_dates[0]) }}
              </p>
              <p v-if="(detailData.further_dates && detailData.further_dates[0]?.venue_name) || detailData.org_name">
                <strong>Ort:</strong> {{ detailData.further_dates?.[0]?.venue_name || detailData.org_name }}{{ detailData.further_dates?.[0]?.venue_city ? `, ${detailData.further_dates[0].venue_city}` : '' }}
              </p>
            </div>
            <div
              v-if="detailData.description"
              class="detail-description"
              v-html="renderDescription(detailData.description)"
            ></div>
            <div class="detail-links">
              <a
                v-for="link in detailLinks"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener"
              >{{ link.label }}</a>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="widget-header">
        <h2 class="widget-title">Events</h2>
        <span v-if="summary" class="event-count">{{ summary.total_event_count }} Events</span>
      </div>

      <div class="filter-bar">
        <button
          v-for="c in CATEGORIES"
          :key="c.id"
          class="filter-chip"
          :class="{ active: selectedCategories.includes(c.id) }"
          @click="toggleCategory(c.id)"
        >{{ c.label }}</button>
      </div>

      <div class="events-container">
        <div v-if="loading" class="loading">Lade Events...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="events.length === 0" class="empty">Keine Events gefunden.</div>
        <div v-else class="events-list">
          <div
            v-for="e in events"
            :key="`${e.uuid}-${e.date_slug}`"
            class="event-card"
            @click="openDetail(e)"
          >
            <div class="event-image">
              <img
                v-if="e.image_path"
                :src="`${e.image_path}/?ratio=1:1&width=480`"
                :alt="e.title"
                loading="lazy"
              >
              <div v-else class="image-placeholder">Kein Bild</div>
            </div>
            <div class="event-content">
              <h3 class="event-title">{{ e.title }}</h3>
              <p v-if="e.subtitle" class="event-subtitle">{{ e.subtitle }}</p>
              <p class="event-meta">
                {{ formatDate(e) }}<template v-if="e.venue_name">&middot; {{ e.venue_name }}</template><template v-if="e.venue_city">, {{ e.venue_city }}</template>
              </p>
              <p v-if="e.summary" class="event-summary">{{ e.summary.length > 300 ? e.summary.substring(0, 300) + '…' : e.summary }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && !error && totalPages > 1" class="pagination">
        <button class="btn-prev" :disabled="page <= 1" @click="loadEvents('prev')">←</button>
        <span class="page-info">SEITE {{ page }} VON {{ totalPages }}</span>
        <button class="btn-next" :disabled="!hasNext" @click="loadEvents('next')">→</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #1a1a1a;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

.widget-header {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.widget-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.event-count {
  font-size: 0.9rem;
  color: #777;
}

.events-container {
  min-height: 120px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-chip {
  padding: 6px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  background: #fff;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.filter-chip:hover {
  background: #f0f0f0;
}

.filter-chip.active {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-card {
  display: flex;
  gap: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.event-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.event-image {
  flex: 0 0 150px;
  width: 150px;
  height: 150px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.85rem;
}

.event-content {
  flex: 1;
  padding: 12px 12px 12px 0;
  min-width: 0;
}

.event-title {
  margin: 0 0 4px;
  font-size: 1.125rem;
  font-weight: 600;
}

.event-subtitle {
  margin: 0 0 6px;
  font-size: 0.95rem;
  color: #555;
}

.event-meta {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #777;
}

.event-summary {
  margin: 0;
  font-size: 0.9rem;
  color: #444;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading,
.error,
.empty {
  padding: 40px 0;
  text-align: center;
  color: #888;
}

.error {
  color: #d32f2f;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.pagination button {
  padding: 6px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fafafa;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.pagination button:hover:not(:disabled) {
  background: #eaeaea;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-info {
  color: #555;
  font-weight: 500;
  min-width: 140px;
  text-align: center;
  font-size: 0.9rem;
}

.btn-back {
  display: inline-block;
  margin-bottom: 16px;
  padding: 8px 20px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fafafa;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-back:hover {
  background: #eaeaea;
}

.detail-image {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.detail-image img {
  width: 100%;
  display: block;
}

.detail-title {
  margin: 0 0 4px;
  font-size: 1.375rem;
  font-weight: 700;
}

.detail-subtitle {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #555;
}

.detail-meta {
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #444;
}

.detail-meta p {
  margin: 0 0 4px;
}

.detail-description {
  margin-bottom: 20px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
}

.detail-description p {
  margin: 0 0 8px;
}

.detail-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-links a {
  color: #1a73e8;
  text-decoration: none;
}

.detail-links a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .event-card {
    flex-direction: column;
  }
  .event-image {
    flex: 0 0 auto;
    width: 100%;
    height: 200px;
  }
  .event-content {
    padding: 0 12px 12px;
  }
}
</style>
