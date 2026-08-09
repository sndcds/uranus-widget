<script setup>
defineProps({
  summary: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <div class="uw-widget__header">
    <h2 class="uw-widget__title">Events</h2>
    <span v-if="summary" class="uw-widget__count">{{ summary.total_event_count }} Events</span>
  </div>
</template>
