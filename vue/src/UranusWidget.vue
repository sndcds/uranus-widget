<script setup>
import { onMounted, onUnmounted } from 'vue'
import useEventsApi from './composables/useEventsApi'
import useWidgetConfig from './composables/useWidgetConfig'
import useStyles from './composables/useStyles'
import WidgetHeader from './components/WidgetHeader.vue'
import FilterBar from './components/FilterBar.vue'
import EventsList from './components/EventsList.vue'
import Pagination from './components/Pagination.vue'
import EventDetail from './components/EventDetail.vue'

const props = defineProps({
  limit: { type: Number, default: null },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  portal: { type: String, default: null },
  tags: { type: String, default: '' },
  venue: { type: String, default: '' },
  city: { type: String, default: '' },
  categories: { type: String, default: '' },
  config: { type: Object, default: null },
  configUrl: { type: String, default: '' }
})

const {
  config,
  configLoaded,
  configError,
  styles,
  init: initConfig
} = useWidgetConfig(props)

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
  setCategories,
  openDetail,
  closeDetail,
  onUrlChange
} = useEventsApi(config)

const { host: rootEl, styleError, applyStyles } = useStyles()

async function start() {
  await initConfig()
  setCategories(config.value.filter?.categories || [])
  applyStyles(styles.value)
  window.addEventListener('popstate', onUrlChange)
  onUrlChange()
}

onMounted(() => {
  start()
})

onUnmounted(() => {
  window.removeEventListener('popstate', onUrlChange)
})
</script>

<template>
  <div ref="rootEl" class="uw-widget">
    <template v-if="configError">
      <div class="uw-is-error">Konfiguration konnte nicht geladen werden: {{ configError }}</div>
    </template>

    <template v-else-if="!configLoaded">
      <div class="uw-is-loading">Lade Konfiguration...</div>
    </template>

    <template v-else-if="detailUuid">
      <button class="uw-btn-back" @click="closeDetail">← Zurück zur Übersicht</button>
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

    <div v-if="styleError" class="uw-is-error">Styles konnten nicht geladen werden: {{ styleError }}</div>
  </div>
</template>

<style src="./styles/index.css"></style>
