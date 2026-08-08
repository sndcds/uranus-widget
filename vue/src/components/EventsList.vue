<script setup>
import EventCard from './EventCard.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  events: {
    type: Array,
    default: () => []
  }
})

defineEmits(['open'])
</script>

<template>
  <div class="events-container">
    <div v-if="loading" class="loading">Lade Events...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="events.length === 0" class="empty">Keine Events gefunden.</div>
    <div v-else class="events-list">
      <EventCard
        v-for="e in events"
        :key="`${e.uuid}-${e.date_slug}`"
        :event="e"
        @open="$emit('open', $event)"
      />
    </div>
  </div>
</template>
