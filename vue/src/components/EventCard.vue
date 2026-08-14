<script setup>
import { formatDate } from '../lib/format'

defineProps({
  event: {
    type: Object,
    required: true
  }
})

defineEmits(['open'])
</script>

<template>
  <div class="uw-card" @click="$emit('open', event)">

    <div class="uw-card__image">
      <img
        v-if="event.image_path"
        :src="`${event.image_path}/?ratio=1:1&width=480`"
        :alt="event.title"
        loading="lazy"
      >
      <div v-else class="uw-card__placeholder">Kein Bild</div>
    </div>

    <div class="uw-card__content">
      <h3 class="uw-card__title">{{ event.title }}</h3>
      <p v-if="event.subtitle" class="uw-events-card__subtitle">{{ event.subtitle }}</p>
      <p class="uw-events-card__meta">
        {{ formatDate(event) }}<template v-if="event.venue_name">&middot; {{ event.venue_name }}</template><template v-if="event.venue_city">, {{ event.venue_city }}</template>
      </p>
      <p v-if="event.summary" class="uw-events-card__summary">{{ event.summary.length > 300 ? event.summary.substring(0, 300) + '…' : event.summary }}</p>
    </div>

  </div>
</template>
