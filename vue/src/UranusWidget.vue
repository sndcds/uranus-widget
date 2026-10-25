<script setup>
import { computed, onMounted, onUnmounted, ref, provide, watch } from 'vue'
import useEventsApi from './composables/useEventsApi'
import useEventDetail from './composables/useEventDetail'
import useWidgetNavigation from './composables/useWidgetNavigation'
import useWidgetConfig from './composables/useWidgetConfig'
import useStyles from './composables/useStyles'
import { useI18n } from './composables/useI18n'
import WidgetHeader from './components/WidgetHeader.vue'
import FilterBar from './components/FilterBar.vue'
import EventsList from './components/EventsList.vue'
import EventDetail from './components/EventDetail.vue'
import VenueMap from './components/VenueMap.vue'
import VenueDetail from './components/VenueDetail.vue'

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
  configUrl: { type: String, default: '' },
})
const { config, configLoaded, configError, styles, init: initConfig } = useWidgetConfig(props)
const lang = computed(() => config.value.language || 'de')
const apiBaseUrl = computed(() => String(config.value.apiBaseUrl || '').replace(/\/$/, ''))
const { t, locale } = useI18n(lang)
provide('lang', lang)
provide('locale', locale)
provide('t', t)
provide('apiBaseUrl', apiBaseUrl)

const { host: rootEl, styleError, applyStyles } = useStyles()
const navigation = useWidgetNavigation(config, rootEl)
const { view, venueUuid, eventUuid, revision, openEvent, openVenue, selectView, back, settleScroll } = navigation
const {
  events, hasMore, loading, error, summary, selectedCategories, selectedType, searchTerm,
  loadMore, ensureLoaded, selectCategories, selectType, selectRange, setCategories, setSearch,
} = useEventsApi(config)
const { detailData, detailLoading, detailError, detailLinks, reload: reloadDetail } = useEventDetail(config, eventUuid, navigation.dateSlug)
const mapVisited = ref(false)
const venueDetail = ref(null)
const mapActive = computed(() => view.value === 'map' && !eventUuid.value && !venueUuid.value)
let disposed = false

watch([revision, detailLoading], () => {
  if (!configLoaded.value || configError.value) return
  if (mapActive.value) mapVisited.value = true
  if (!eventUuid.value && !venueUuid.value && view.value === 'events') ensureLoaded()
  if (eventUuid.value && detailLoading.value) return
  if (!eventUuid.value && venueUuid.value && venueDetail.value?.loading !== false) return
  settleScroll()
}, { flush: 'post' })

onMounted(async () => {
  await initConfig()
  if (disposed || configError.value) return
  setCategories(config.value.filter?.categories || [])
  applyStyles(styles.value)
  navigation.init()
})
onUnmounted(() => { disposed = true; navigation.dispose() })
</script>

<template>
  <div ref="rootEl" class="uw-widget">
    <div v-if="configError" class="uw-is-error">{{ t('configError', { error: configError }) }}</div>
    <div v-else-if="!configLoaded" class="uw-is-loading">{{ t('loadingConfig') }}</div>
    <template v-else>
      <div v-if="config.map.enabled" class="uw-view-switch" role="group" :aria-label="t('views.label')">
        <button class="uw-view-switch__button" type="button" :aria-pressed="view === 'events'" @click="selectView('events')">{{ t('views.events') }}</button>
        <button class="uw-view-switch__button" type="button" :aria-pressed="view === 'map'" @click="selectView('map')">{{ t('views.map') }}</button>
      </div>
      <WidgetHeader :summary="summary" />

      <FilterBar
          v-model="selectedCategories"
          :search="searchTerm"
          :summary="summary"
          :api-base-url="config.apiBaseUrl"
          :selected-type="selectedType"
          @change="() => selectCategories(selectedCategories)"
          @type-change="selectType"
          @range-change="selectRange"
          @search="setSearch"
      />

      <EventsList
          ref="eventsList"
          :events="events"
          :loading="loading"
          :error="error"
          :layout="config.event_list.layout"
          :max-columns="config.event_list.max_columns"
          :event-card-config="config.event_card"
          :api-base-url="config.apiBaseUrl"
          @open="openDetail"
      />

      <div v-show="!eventUuid && !venueUuid && view === 'events'">
        <WidgetHeader :summary="summary" />
        <FilterBar v-model="selectedCategories" :search="searchTerm" :summary="summary"
          :api-base-url="config.apiBaseUrl" :selected-type="selectedType"
          @change="() => selectCategories(selectedCategories)" @type-change="selectType"
          @range-change="selectRange" @search="setSearch" />
        <EventsList :events="events" :loading="loading" :error="error" :layout="config.event_list.layout"
          :event-card-config="config.event_card" :api-base-url="config.apiBaseUrl" @open="openEvent" @retry="loadMore" />
        <div v-if="!loading && hasMore && events.length" class="uw-load-more">
          <button class="uw-button uw-button--big" type="button" @click="loadMore">{{ t('loadMore') }}</button>
        </div>
      </div>

      <VenueMap v-if="mapVisited" v-show="mapActive" :config="config.map" :api-base-url="config.apiBaseUrl"
        :portal="config.filter.portal || ''" :lang="lang" :active="mapActive"
        :venue-details="config.venue_details.enabled" @open="openVenue" />

      <VenueDetail v-if="venueUuid" v-show="!eventUuid" ref="venueDetail" :uuid="venueUuid" :config="config"
        :active="!eventUuid" @close="back" @open="openEvent" @ready="() => { if (!eventUuid) settleScroll() }" />

      <EventDetail v-if="eventUuid" :loading="detailLoading" :error="detailError" :data="detailData"
        :links="detailLinks" :venue-enabled="config.venue_details.enabled"
        @close="back" @venue="openVenue" @retry="reloadDetail" />
    </template>
    <div v-if="styleError" class="uw-is-error">{{ t('styleError', { error: styleError }) }}</div>
  </div>
</template>

<style src="./styles/index.css"></style>
