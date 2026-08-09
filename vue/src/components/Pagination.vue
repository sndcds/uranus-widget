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
  <div class="uw-pagination">
    <button class="uw-pagination__button uw-pagination__button--prev" :disabled="page <= 1" @click="$emit('prev')">←</button>
    <span class="uw-pagination__info">SEITE {{ page }} VON {{ totalPages }}</span>
    <button class="uw-pagination__button uw-pagination__button--next" :disabled="!hasNext" @click="$emit('next')">→</button>
  </div>
</template>
