<script setup>
import { inject } from 'vue'

defineProps({
  summary: {
    type: Object,
    default: null
  }
})

const t = inject('t', (k) => k)
</script>

<template>
  <div class="uw-widget__header">
    <h2 class="uw-widget__title">{{ t('header.title') }}</h2>
    <span v-if="summary" class="uw-widget__count">{{ t('header.count', { count: summary.total_event_count }) }}</span>
  </div>
</template>
