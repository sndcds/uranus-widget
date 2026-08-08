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
  <div class="event-card" @click="$emit('open', event)">
    <div class="event-image">
      <img
        v-if="event.image_path"
        :src="`${event.image_path}/?ratio=1:1&width=480`"
        :alt="event.title"
        loading="lazy"
      >
      <div v-else class="image-placeholder">Kein Bild</div>
    </div>
    <div class="event-content">
      <h3 class="event-title">{{ event.title }}</h3>
      <p v-if="event.subtitle" class="event-subtitle">{{ event.subtitle }}</p>
      <p class="event-meta">
        {{ formatDate(event) }}<template v-if="event.venue_name">&middot; {{ event.venue_name }}</template><template v-if="event.venue_city">, {{ event.venue_city }}</template>
      </p>
      <p v-if="event.summary" class="event-summary">{{ event.summary.length > 300 ? event.summary.substring(0, 300) + '…' : event.summary }}</p>
    </div>
  </div>
</template>
