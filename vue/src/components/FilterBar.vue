<script setup>
import { ref, watch } from 'vue'
import { CATEGORIES } from '../lib/constants'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  search: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'search'])

const query = ref(props.search)

watch(
  () => props.search,
  (val) => {
    query.value = val || ''
  }
)

function submitSearch() {
  emit('search', query.value.trim())
}

function onKeydownEnter() {
  submitSearch()
}

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
  <div class="uw-filter">
    <form class="uw-filter__search" @submit.prevent="submitSearch">
      <input
        v-model="query"
        class="uw-filter__search-input"
        type="search"
        placeholder="Freitextsuche…"
        @keydown.enter.prevent="onKeydownEnter"
      >
      <button type="submit" class="uw-filter__search-button">Suchen</button>
    </form>

    <div class="uw-filter__chips">
      <button
        v-for="c in CATEGORIES"
        :key="c.id"
        class="uw-filter__chip"
        :class="{ 'uw-filter__chip--active': modelValue.includes(c.id) }"
        @click="toggle(c.id)"
      >{{ c.label }}</button>
    </div>
  </div>
</template>
