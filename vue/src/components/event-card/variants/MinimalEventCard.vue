<script setup>
import { inject } from 'vue'
import { formatShortDate } from '../../../lib/format'

/**
 * Minimale Card-Variante: nur Datum + Titel, ohne Bild.
 */
const props = defineProps({
  event: { type: Object, required: true },
  imageConfig: { type: Object, default: () => ({}) },
  apiBaseUrl: { type: String, default: '' }
})

defineEmits(['open'])

const locale = inject('locale', 'de-DE')
</script>

<template>
  <div class="uw-card uw-event-card uw-event-card--minimal" @click="$emit('open', event)">
    <div class="uw-card__content">
      <div class="uw-event-card__content">
        <span class="uw-event-card__date">{{ formatShortDate(event, locale.value) }}</span>
        <span class="uw-event-card__title">{{ event.title }}</span>
      </div>
    </div>
  </div>
</template>
