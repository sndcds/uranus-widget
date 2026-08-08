<script setup>
import { CATEGORIES } from '../lib/constants'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

function toggle(id) {
  const idx = props.modelValue.indexOf(id)
  const next = [...props.modelValue]
  if (idx === -1) {
    next.push(id)
  } else {
    next.splice(idx, 1)
  }
  emit('update:modelValue', next)
  emit('change')
}
</script>

<template>
  <div class="filter-bar">
    <button
      v-for="c in CATEGORIES"
      :key="c.id"
      class="filter-chip"
      :class="{ active: modelValue.includes(c.id) }"
      @click="toggle(c.id)"
    >{{ c.label }}</button>
  </div>
</template>
