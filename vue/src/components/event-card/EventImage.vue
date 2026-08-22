<script setup>
import { computed, inject } from 'vue'

/**
 * Rendert das Event-Bild bzw. einen Platzhalter.
 *
 * Die Bild-Parameter (ratio/width/quality/type) kommen vollständig aus
 * `config.event_card.image` und werden als Query-Parameter an
 * `event.image_path` angehängt. Es sind KEINE festen Werte enthalten.
 *
 * Einbindung:
 *   <EventImage :event="event" :image-config="config" />
 *
 * Props:
 *   event        Event-Daten (image_path, title)
 *   image-config Bild-Konfiguration (ImageConfig, normalisiert)
 */
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  imageConfig: {
    type: Object,
    default: () => ({ ratio: '16:9', width: 480, quality: 80, type: 'webp' })
  }
})

const t = inject('t', (k) => k)

const src = computed(() => {
  const base = props.event?.image_path
  if (!base) return ''

  const cfg = props.imageConfig || {}
  const params = new URLSearchParams()

  if (cfg.ratio) {
    // Die Image-API erwartet ein Verhältnis mit Doppelpunkt (z. B. "16:9").
    // Die Config nimmt auch die Schreibweise "4/3" entgegen und wird hier
    // normalisiert.
    params.set('ratio', String(cfg.ratio).replace('/', ':'))
  }
  if (cfg.width) params.set('width', String(cfg.width))
  if (cfg.quality != null) params.set('quality', String(cfg.quality))
  if (cfg.type) params.set('type', cfg.type)

  const qs = params.toString()
  return `${base}${qs ? `/?${qs}` : ''}`
})
</script>

<template>
  <div class="uw-event-card__image">
    <img
      v-if="src"
      :src="src"
      :alt="event.title || ''"
      loading="lazy"
    >
    <div v-else class="uw-card__placeholder">{{ t('noImage') }}</div>
  </div>
</template>
