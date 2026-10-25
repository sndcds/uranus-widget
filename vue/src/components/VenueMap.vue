<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { loadMapEngine } from '../lib/assets'
import { loadMapStyle } from '../lib/mapStyle'
import { fetchApi, safeWebUrl } from '../lib/api'
import { transformVenues, isArea, mapBbox } from '../lib/mapData'
import { addVenueLayers } from '../map/layers'
import { buildVenueUrl, isWidgetNavigationClick } from '../lib/url'

const props = defineProps({
  config: { type: Object, required: true },
  apiBaseUrl: { type: String, required: true },
  portal: { type: String, default: '' },
  lang: { type: String, default: 'de' },
  active: { type: Boolean, default: true },
  venueDetails: { type: Boolean, default: true },
})
const emit = defineEmits(['open'])
const t = inject('t', k => k)
const container = ref(null)
const wrapper = ref(null)
const loading = ref(true)
const error = ref('')
const boundaryError = ref('')
const ready = ref(false)
const expanded = ref(false)
const places = ref([])
const style = computed(() => ({ height: `${props.config.height}px` }))
let map, engine, popup, observer, controller, boundaryController, timer
let disposed = false
let requestVersion = 0
let boundaryVersion = 0
let pendingPlaces = false

function open(uuid, event) {
  if (!props.venueDetails || (event && !isWidgetNavigationClick(event))) return
  event?.preventDefault()
  emit('open', uuid)
}

function showPopup(feature) {
  popup?.remove()
  const p = feature.properties
  const content = document.createElement('div')
  content.className = 'uw-map-popup'
  const title = document.createElement('h3')
  title.textContent = p.name
  content.append(title)
  const address = document.createElement('p')
  address.textContent = [[p.street, p.house_number].filter(Boolean).join(' '),
    [p.postal_code, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  content.append(address)
  const actions = document.createElement('div')
  actions.className = 'uw-map-popup__actions'
  if (safeWebUrl(p.web_link)) {
    const website = document.createElement('a')
    website.href = safeWebUrl(p.web_link)
    website.textContent = t('venue.website')
    website.target = '_blank'
    website.rel = 'noopener noreferrer'
    actions.append(website)
  }
  if (props.venueDetails) {
    const details = document.createElement('a')
    details.href = buildVenueUrl(p.uuid)
    details.textContent = t('venue.details')
    details.addEventListener('click', e => open(p.uuid, e))
    actions.append(details)
  }
  content.append(actions)
  popup = new engine.Popup({ closeButton: true, maxWidth: '350px', offset: [0, -22] })
    .setLngLat(feature.geometry.coordinates).setDOMContent(content).addTo(map)
  popup.getElement().querySelector('.maplibregl-popup-close-button')?.setAttribute('aria-label', t('map.closePopup'))
}

async function loadPlaces() {
  if (!ready.value || disposed) return
  if (!props.active) { pendingPlaces = true; return }
  pendingPlaces = false
  const version = ++requestVersion
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  const query = new URLSearchParams({ bbox: mapBbox(map.getBounds()), lang: props.lang })
  if (props.portal) query.set('portal', props.portal)
  try {
    const data = await fetchApi(`${props.apiBaseUrl.replace(/\/$/, '')}/venues/geojson?${query}`, { signal: controller.signal })
    if (disposed || version !== requestVersion) return
    const { points, buildings } = transformVenues(data)
    map.getSource('uw-venues').setData(points)
    map.getSource('uw-buildings')?.setData(buildings)
    places.value = points.features.map(f => f.properties)
  } catch (err) {
    if (!disposed && version === requestVersion && err.name !== 'AbortError') error.value = t('map.loadError')
  } finally {
    if (!disposed && version === requestVersion) loading.value = false
  }
}

function schedulePlaces() {
  clearTimeout(timer)
  // Invalidate immediately, so an old response cannot win during the debounce.
  requestVersion++
  controller?.abort()
  timer = setTimeout(loadPlaces, 180)
}

async function loadBoundary() {
  const version = ++boundaryVersion
  boundaryController?.abort()
  boundaryError.value = ''
  if (map.getLayer('uw-boundary')) map.removeLayer('uw-boundary')
  if (map.getSource('uw-boundary')) map.removeSource('uw-boundary')
  if (!props.portal || !props.config.showPortalBoundary) return
  boundaryController = new AbortController()
  try {
    const data = await fetchApi(`${props.apiBaseUrl.replace(/\/$/, '')}/portal/${encodeURIComponent(props.portal)}/geojson`, {
      signal: boundaryController.signal,
    })
    if (disposed || version !== boundaryVersion) return
    if (data?.type !== 'Feature' || !isArea(data.geometry)) throw new Error('Invalid boundary')
    map.addSource('uw-boundary', { type: 'geojson', data })
    map.addLayer({ id: 'uw-boundary', source: 'uw-boundary', type: 'line', paint: {
      'line-color': '#243f6e', 'line-opacity': 0.75, 'line-width': 2,
    } }, 'uw-clusters')
  } catch (err) {
    if (!disposed && version === boundaryVersion && err.name !== 'AbortError') boundaryError.value = t('map.boundaryError')
  }
}

async function start() {
  error.value = ''
  loading.value = true
  ready.value = false
  map?.remove()
  observer?.disconnect()
  try {
    const [module, mapStyle] = await Promise.all([loadMapEngine(), loadMapStyle(props.config.styleUrl)])
    if (disposed) return
    engine = module.maplibregl
    const shadow = container.value.getRootNode()
    if (!shadow.querySelector('style[data-uw-map]')) {
      const sheet = document.createElement('style')
      sheet.dataset.uwMap = ''
      sheet.textContent = module.css
      shadow.prepend(sheet)
    }
    const instance = new engine.Map({
      container: container.value, style: mapStyle, center: props.config.center,
      zoom: props.config.zoom, minZoom: 2, maxZoom: 19, renderWorldCopies: false,
      cooperativeGestures: true, fadeDuration: 0,
    })
    map = instance
    map.addControl(new engine.NavigationControl())
    map.on('error', event => {
      if (!disposed && map === instance && !ready.value) {
        console.error('[uranus-widget] Map resource failed', event.error)
        error.value = t('map.loadError'); loading.value = false
      }
    })
    map.once('load', async () => {
      try {
        await addVenueLayers(instance, { buildings: props.config.showBuildings })
        if (disposed || map !== instance) return
        ready.value = true
        error.value = ''
        map.getCanvas().setAttribute('aria-label', t('map.title'))
        for (const layer of ['uw-clusters', 'uw-cluster-count']) {
          map.on('click', layer, async e => {
            const f = e.features?.[0]
            if (!f) return
            try {
              const zoom = await map.getSource('uw-venues').getClusterExpansionZoom(f.properties.cluster_id)
              if (!disposed) { popup?.remove(); map.easeTo({ center: f.geometry.coordinates, zoom }) }
            } catch { /* The source may have changed during a move. */ }
          })
        }
        for (const layer of ['uw-clusters', 'uw-cluster-count', 'uw-markers', 'uw-labels']) {
          map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
          map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
        }
        map.on('click', 'uw-markers', e => { if (e.features?.[0]) showPopup(e.features[0]) })
        map.on('click', 'uw-labels', e => { if (e.features?.[0]) showPopup(e.features[0]) })
        map.on('moveend', schedulePlaces)
        loadPlaces()
        loadBoundary()
      } catch (err) {
        if (!disposed && map === instance) {
          console.error('[uranus-widget] Map layers failed', err)
          error.value = t('map.loadError'); loading.value = false
        }
      }
    })
    observer = new ResizeObserver(() => { if (props.active && !disposed) map.resize() })
    observer.observe(container.value)
  } catch (err) {
    if (!disposed) {
      console.error('[uranus-widget] Map initialization failed', err)
      error.value = t('map.loadError'); loading.value = false
    }
  }
}

function retry() {
  if (!ready.value) return start()
  loadPlaces()
  if (boundaryError.value) loadBoundary()
}
function escape(event) { if (event.key === 'Escape') expanded.value = false }
watch(expanded, async value => {
  await nextTick()
  map?.setCooperativeGestures(!value)
  map?.resize()
  wrapper.value?.querySelector('.uw-map__expand')?.focus({ preventScroll: true })
})
watch(() => props.active, async active => {
  if (!active) { expanded.value = false; popup?.remove(); return }
  await nextTick()
  map?.resize()
  if (pendingPlaces) loadPlaces()
})
watch(() => [props.portal, props.lang], () => {
  if (ready.value) { popup?.remove(); schedulePlaces(); loadBoundary() }
})
onMounted(() => { start(); window.addEventListener('keydown', escape) })
onBeforeUnmount(() => {
  disposed = true
  requestVersion++; boundaryVersion++
  clearTimeout(timer)
  controller?.abort(); boundaryController?.abort()
  observer?.disconnect(); popup?.remove(); map?.remove()
  window.removeEventListener('keydown', escape)
})
</script>

<template>
  <section ref="wrapper" class="uw-map" :class="{ 'uw-map--expanded': expanded }" :aria-label="t('map.title')">
    <p class="uw-map__description">{{ t('map.description') }}</p>
    <div class="uw-map__frame" :style="style">
      <div ref="container" class="uw-map__canvas"></div>
      <button class="uw-button uw-map__expand" type="button" :aria-pressed="expanded" @click="expanded = !expanded">
        {{ t(expanded ? 'map.shrink' : 'map.expand') }}
      </button>
      <span v-if="loading" class="uw-map__status" role="status">{{ t('map.loading') }}</span>
    </div>
    <div v-if="error || boundaryError" class="uw-map__error" role="alert">
      <span>{{ error || boundaryError }}</span>
      <button class="uw-button" type="button" @click="retry">{{ t('retry') }}</button>
    </div>
    <p v-if="ready && !loading && !error && !places.length" role="status">{{ t('map.empty') }}</p>
    <details v-if="places.length && venueDetails" class="uw-map__places">
      <summary>{{ t('map.places', { count: places.length }) }}</summary>
      <ul>
        <li v-for="place in places" :key="place.uuid">
          <a :href="buildVenueUrl(place.uuid)" @click="open(place.uuid, $event)">{{ place.name }}<span v-if="place.city">, {{ place.city }}</span></a>
        </li>
      </ul>
    </details>
  </section>
</template>
