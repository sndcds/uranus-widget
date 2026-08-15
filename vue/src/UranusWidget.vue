<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
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
  hasMore,
  loading,
  error,
  summary,
  selectedCategories,
  selectedType,
  searchTerm,
  detailUuid,
  detailData,
  detailLoading,
  detailError,
  detailLinks,
  loadMore,
  selectCategories,
  selectType,
  setCategories,
  setSearch,
  openDetail,
  closeDetail,
  onUrlChange
} = useEventsApi(config)

const { host: rootEl, styleError, applyStyles } = useStyles()

const eventsList = ref(null)

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
      <button
          class="uw-button uw-big"
          @click="closeDetail"
      >
        Zurück
      </button>

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
          :search="searchTerm"
          :summary="summary"
          :api-base-url="config.apiBaseUrl"
          :selected-type="selectedType"
          @change="() => selectCategories(selectedCategories)"
          @type-change="selectType"
          @search="setSearch"
      />

      <EventsList
          ref="eventsList"
          :events="events"
          :loading="loading"
          :error="error"
          @open="openDetail"
      />

      <div
          v-if="!loading && hasMore"
          class="uw-load-more"
      >
        <button
            class="uw-button uw-big"
            type="button"
            @click="loadMore"
        >
          Mehr laden
        </button>
      </div>

    </template>

    <div v-if="styleError" class="uw-is-error">
      Styles konnten nicht geladen werden: {{ styleError }}
    </div>

  </div>
</template>

<style src="./styles/index.css"></style>
