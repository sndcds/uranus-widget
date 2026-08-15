<script setup>
import { ref, watch } from 'vue'
import { CATEGORIES } from '../lib/constants'
import EventTypeSelect from './EventTypeSelect.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  search: {
    type: String,
    default: ''
  },
  summary: {
    type: Object,
    default: null
  },
  apiBaseUrl: {
    type: String,
    default: ''
  },
  selectedType: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'search', 'update:selectedType', 'typeChange'])

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

function onTypeChange(value) {
  emit('update:selectedType', value)
  emit('typeChange', value)
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

    <EventTypeSelect
      :model-value="selectedType"
      :summary="summary"
      :api-base-url="apiBaseUrl"
      @update:model-value="onTypeChange"
    />

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
