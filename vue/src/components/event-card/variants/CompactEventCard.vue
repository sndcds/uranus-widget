<script setup>
import { computed, inject } from 'vue'
import EventImage from '../EventImage.vue'
import { formatShortDate } from '../../../lib/format'
import { buildEventUrl, isWidgetNavigationClick } from '../../../lib/url'
import { venueLabel } from '../../../composables/useEventCard'

/**
 * Kompakte Card-Variante: Bild, Datum, Titel, Ort — ohne Typen/Preis/Status.
 */
const props = defineProps({
  event: { type: Object, required: true },
  imageConfig: { type: Object, default: () => ({}) },
  apiBaseUrl: { type: String, default: '' }
})

const emit = defineEmits(['open'])

const locale = inject('locale', 'de-DE')

const venue = computed(() => venueLabel(props.event))

const cardHref = computed(() => buildEventUrl(props.event?.uuid))

// Link-Klick: ohne Modifier-Taste selbst behandeln (SPA), sonst Browser.
function onCardClick(event) {
  if (!isWidgetNavigationClick(event)) return
  event.preventDefault()
  emit('open', props.event)
}
</script>

<template>
  <a :href="cardHref" class="uw-card uw-event-card uw-event-card--compact" @click="onCardClick">
    <EventImage :event="event" :image-config="imageConfig" />
    <div class="uw-card__content">
      <div class="uw-event-card__content">
        <span class="uw-event-card__date">{{ formatShortDate(event, locale.value) }}</span>
        <span class="uw-event-card__title">{{ event.title }}</span>
        <p v-if="venue" class="uw-event-card__meta">{{ venue }}</p>
      </div>
    </div>
  </a>
</template>
