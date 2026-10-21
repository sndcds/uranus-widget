<script setup>
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import { loadMapEngine } from '../lib/assets'
import { loadMapStyle } from '../lib/mapStyle'
const props = defineProps({ venue: Object, settings: Object })
const t = inject('t', k => k)
const container = ref(null)
const error = ref(false)
let map, disposed = false
onMounted(async () => {
  try {
    const [{ maplibregl, css }, mapStyle] = await Promise.all([loadMapEngine(), loadMapStyle(props.settings.styleUrl)])
    if (disposed) return
    const shadow = container.value.getRootNode()
    if (!shadow.querySelector('style[data-uw-map]')) {
      const style = document.createElement('style')
      style.dataset.uwMap = ''
      style.textContent = css
      shadow.prepend(style)
    }
    map = new maplibregl.Map({
      container: container.value, style: mapStyle,
      center: [props.venue.lon, props.venue.lat], zoom: 15, cooperativeGestures: true,
    })
    map.addControl(new maplibregl.NavigationControl())
    new maplibregl.Marker({ color: '#243f6e' }).setLngLat([props.venue.lon, props.venue.lat]).addTo(map)
    map.getCanvas().setAttribute('aria-label', props.venue.name)
    map.on('error', () => { if (!disposed) error.value = true })
  } catch { if (!disposed) error.value = true }
})
onBeforeUnmount(() => { disposed = true; map?.remove() })
</script>

<template>
  <div class="uw-venue__location">
    <div ref="container" class="uw-venue__map" :aria-label="venue.name"></div>
    <p v-if="error" role="status">{{ t('map.loadError') }}</p>
  </div>
</template>
