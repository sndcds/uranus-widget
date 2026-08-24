<script setup>
import { computed, inject } from 'vue'
import { aiLabelImage } from '../../lib/eventImage'

/**
 * Rendert das Event-Bild (bzw. einen Platzhalter) inkl. AI-Label-Overlay.
 *
 * Die Bild-Parameter (ratio/width/quality/type) kommen vollständig aus
 * `config.event_card.image` und werden als Query-Parameter an
 * `event.image_path` angehängt. Es sind KEINE festen Werte enthalten.
 *
 * AI-Label: nutzt das vorhandene Mapping aus `lib/eventImage.js` —
 * Quelle ist `event.image_ai_label` (Listenansicht) bzw. der Fallback
 * `event.images.main.ai_label`. Unbekannte/`"none"`-Werte zeigen KEIN Label.
 *
 * Einbindung:
 *   <EventImage :event="event" :image-config="config" />
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

// AI-Label: Listen-/Detail-Quelle vereinheitlichen, über das zentrale Mapping.
const aiLabel = computed(() => {
  const value =
      props.event?.image_ai_label ??
      props.event?.images?.main?.ai_label ??
      props.event?.image?.ai_label
  return aiLabelImage(value)
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

    <img
        v-if="aiLabel"
        class="uw-event-card__ai-label"
        :src="aiLabel"
        alt=""
    >
  </div>
</template>
