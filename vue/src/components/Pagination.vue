<script setup>
defineProps({
  page: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  hasNext: {
    type: Boolean,
    default: true
  }
})

defineEmits(['prev', 'next'])
</script>

<template>
  <div class="pagination">
    <button class="btn-prev" :disabled="page <= 1" @click="$emit('prev')">←</button>
    <span class="page-info">SEITE {{ page }} VON {{ totalPages }}</span>
    <button class="btn-next" :disabled="!hasNext" @click="$emit('next')">→</button>
  </div>
</template>
