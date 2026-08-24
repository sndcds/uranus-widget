<script setup>
import { inject, ref, watch } from 'vue'
import { CATEGORIES } from '../lib/constants'
import EventTypeSelect from './EventTypeSelect.vue'

const t = inject('t', (k) => k)

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

const emit = defineEmits(['update:modelValue', 'change', 'search', 'update:selectedType', 'typeChange', 'rangeChange'])

const query = ref(props.search)

const dateRangeKey = ref('all')

const DATE_RANGE_OPTIONS = [
  { value: 'all', labelKey: 'dateRange.all' },
  { value: 'today', labelKey: 'dateRange.today' },
  { value: 'tomorrow', labelKey: 'dateRange.tomorrow' },
  { value: 'weekend', labelKey: 'dateRange.weekend' },
  { value: 'next_week', labelKey: 'dateRange.nextWeek' },
  { value: 'weekend_after', labelKey: 'dateRange.weekendAfter' },
  { value: 'six_months', labelKey: 'dateRange.sixMonths' }
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function computeDateRange(key) {
  if (key === 'all') return null

  const now = new Date()
  const dow = now.getDay() // 0 = Sonntag .. 6 = Samstag

  if (key === 'today' || key === 'tomorrow') {
    const day = addDays(now, key === 'today' ? 0 : 1)
    return { start: toDateStr(day), end: toDateStr(day) }
  }

  if (key === 'weekend' || key === 'weekend_after') {
    const satOffset = (6 - dow + 7) % 7 + (key === 'weekend_after' ? 7 : 0)
    const sat = addDays(now, satOffset)
    return { start: toDateStr(sat), end: toDateStr(addDays(sat, 1)) }
  }

  if (key === 'next_week') {
    const curMonOffset = (dow + 6) % 7
    const curMon = addDays(now, -curMonOffset)
    const nextMon = addDays(curMon, 7)
    return { start: toDateStr(nextMon), end: toDateStr(addDays(nextMon, 6)) }
  }

  if (key === 'six_months') {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 6, 0)
    return { start: toDateStr(firstOfMonth), end: toDateStr(endMonth) }
  }

  return null
}

function onDateRangeChange(event) {
  dateRangeKey.value = event.target.value
  emit('rangeChange', computeDateRange(dateRangeKey.value))
}

watch(
  () => props.search,
  (val) => {
    query.value = val || ''
  }
)

function submitSearch() {
  emit('search', query.value.trim())
}

function onClearSearch() {
  if (!query.value || query.value.trim() === '') {
    query.value = ''
    emit('search', '')
  }
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
        :placeholder="t('search.placeholder')"
        @input="onClearSearch"
        @keydown.enter.prevent="onKeydownEnter"
      >
      <button type="submit" class="uw-filter__search-button">{{ t('search.submit') }}</button>
    </form>

    <div class="uw-filter__selects">
      <EventTypeSelect
        :model-value="selectedType"
        :summary="summary"
        :api-base-url="apiBaseUrl"
        @update:model-value="onTypeChange"
      />

      <select
        v-model="dateRangeKey"
        class="uw-select"
        :aria-label="t('dateRange.ariaLabel')"
        @change="onDateRangeChange"
      >
        <option
          v-for="opt in DATE_RANGE_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >{{ t(opt.labelKey) }}</option>
      </select>
    </div>

    <div class="uw-filter__chips">
      <button
        v-for="c in CATEGORIES"
        :key="c.id"
        class="uw-filter__chip"
        :class="{ 'uw-filter__chip--active': modelValue.includes(c.id) }"
        @click="toggle(c.id)"
      >{{ t(`categories.${c.id}`) }}</button>
    </div>
  </div>
</template>
