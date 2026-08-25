<script setup>
import { computed, inject } from 'vue'
import EventImage from '../EventImage.vue'
import { formatShortDate } from '../../../lib/format'
import { buildEventUrl, isWidgetNavigationClick } from '../../../lib/url'
import { useEventTypes } from '../../../composables/useEventTypes'
import {
  priceKey,
  releaseStatusKey,
  venueLabel,
} from '../../../composables/useEventCard'

/**
 * Standard-Card-Variante.
 *
 * Content-Bereich:
 *   1. Datum / Uhrzeit   (bestehendes Format + Widget-Lokalisierung)
 *   2. Titel
 *   3. Ort               "Ortname, Stadt" (nur wenn Daten vorhanden)
 *   4. Event-Typen       als Chips (bestehende Chip-Konvention)
 *   5. Preis-Hinweise    "Kostenlos" / "Spende" (aus Event-Daten)
 *   6. Release-Status    Abgesagt / Verschoben / Verlegt, visuell hervorgehoben
 */
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  imageConfig: {
    type: Object,
    default: () => ({ ratio: '16:9', width: 480, quality: 80, type: 'webp' })
  },
  apiBaseUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open'])

const t = inject('t', (k) => k)
const locale = inject('locale', 'de-DE')
const lang = inject('lang', { value: 'de' })

// Event-Typ-Labels aus dem geteilten Lookup
const { label: typeLabel } = useEventTypes(
    () => props.apiBaseUrl,
    () => lang.value || 'de'
)

const dateStr = computed(() => formatShortDate(props.event, locale.value || 'de-DE'))

const cardHref = computed(() => buildEventUrl(props.event?.uuid))

// Link-Klick: ohne Modifier-Taste selbst behandeln (SPA), sonst Browser.
function onCardClick(event) {
  if (!isWidgetNavigationClick(event)) return
  event.preventDefault()
  emit('open', props.event)
}

const venue = computed(() => venueLabel(props.event))

const typeIds = computed(() =>
    Array.isArray(props.event?.event_types)
        ? props.event.event_types.map((et) => et?.type_id).filter((id) => id != null)
        : []
)

const price = computed(() => {
  const key = priceKey(props.event)
  return key ? t(key) : ''
})

const releaseStatus = computed(() => {
  const key = releaseStatusKey(props.event)
  return key ? t(key).toUpperCase() : ''
})
</script>

<template>
  <a
      :href="cardHref"
      class="uw-card uw-event-card"
      @click="onCardClick"
  >
    <EventImage :event="event" :image-config="imageConfig" />

    <div class="uw-card__content">
      <div class="uw-event-card__content">

        <!-- 1. Datum / Uhrzeit -->
        <span class="uw-event-card__date">{{ dateStr }}</span>

        <!-- 6. Release-Status (visuell hervorgehoben) -->
        <span
            v-if="releaseStatus"
            class="uw-event-card__status"
        >{{ releaseStatus }}</span>

        <!-- 2. Titel -->
        <span class="uw-event-card__title">{{ event.title }}</span>

        <!-- 3. Ort -->
        <p v-if="venue" class="uw-event-card__meta">
          {{ venue }}
        </p>

        <!-- 4. Event-Typen als Chips -->
        <p v-if="typeIds.length" class="uw-event-card__chips">
          <span
              v-for="(id, i) in typeIds"
              :key="`${id}-${i}`"
              class="uw-filter__chip uw-chip-static"
          >{{ typeLabel(id) || `Typ ${id}` }}</span>
        </p>

        <!-- 5. Preis-Hinweis -->
        <p v-if="price" class="uw-event-card__price">
          {{ price }}
        </p>

      </div>
    </div>
  </a>
</template>
