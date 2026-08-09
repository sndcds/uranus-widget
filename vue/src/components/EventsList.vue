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
  <div class="uw-container">
    <div v-if="loading" class="uw-is-loading">Lade Events...</div>
    <div v-else-if="error" class="uw-is-error">{{ error }}</div>
    <div v-else-if="events.length === 0" class="uw-is-empty">Keine Events gefunden.</div>
    <div v-else class="uw-list">
      <EventCard
        v-for="e in events"
        :key="`${e.uuid}-${e.date_slug}`"
        :event="e"
        @open="$emit('open', $event)"
      />
    </div>
  </div>
</template>
