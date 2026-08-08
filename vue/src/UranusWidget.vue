<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import useEventsApi from './composables/useEventsApi'
import WidgetHeader from './components/WidgetHeader.vue'
import FilterBar from './components/FilterBar.vue'
import EventsList from './components/EventsList.vue'
import Pagination from './components/Pagination.vue'
import EventDetail from './components/EventDetail.vue'
import { PARAM_MAP } from './lib/constants'

const props = defineProps({
  limit: { type: Number, default: 12 },
  tags: { type: String, default: '' },
  venue: { type: String, default: '' },
  city: { type: String, default: '' },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  categories: { type: String, default: '' }
})

const config = computed(() => {
  const cfg = { limit: props.limit || 12 }
  for (const key of Object.keys(PARAM_MAP)) {
    if (key === 'limit') continue
    const val = props[key]
    if (val !== undefined && val !== null && val !== '') {
      cfg[key] = Array.isArray(val) ? val : String(val)
    }
  }
  return cfg
})

const {
  events,
  page,
  hasNext,
  loading,
  error,
  summary,
  totalPages,
  selectedCategories,
  detailUuid,
  detailData,
  detailLoading,
  detailError,
  detailLinks,
  loadEvents,
  selectCategories,
  openDetail,
  closeDetail,
  onUrlChange
} = useEventsApi(config)

onMounted(() => {
  window.addEventListener('popstate', onUrlChange)
  onUrlChange()
})

onUnmounted(() => {
  window.removeEventListener('popstate', onUrlChange)
})
</script>

<template>
  <div class="widget">
    <template v-if="detailUuid">
      <button class="btn-back" @click="closeDetail">← Zurück zur Übersicht</button>
      <EventDetail
        :loading="detailLoading"
        :error="detailError"
        :data="detailData"
        :links="detailLinks"
      />
    </template>

    <template v-else>
      <WidgetHeader :summary="summary" />

      <FilterBar
        v-model="selectedCategories"
        @change="() => selectCategories(selectedCategories)"
      />

      <EventsList
        :loading="loading"
        :error="error"
        :events="events"
        @open="openDetail"
      />

      <Pagination
        v-if="!loading && !error && totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        :has-next="hasNext"
        @prev="loadEvents('prev')"
        @next="loadEvents('next')"
      />
    </template>
  </div>
</template>

<style src="./styles/index.css"></style>
