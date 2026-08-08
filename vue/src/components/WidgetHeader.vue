<script setup>
defineProps({
  summary: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <div class="widget-header">
    <h2 class="widget-title">Events</h2>
    <span v-if="summary" class="event-count">{{ summary.total_event_count }} Events</span>
  </div>
</template>
