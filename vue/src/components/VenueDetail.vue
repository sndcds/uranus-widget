<script setup>
import { ref, computed, watch, onBeforeUnmount, inject, nextTick } from 'vue'
import { fetchApi, safeWebUrl } from '../lib/api'
import { markdownToHtml } from '../lib/format'
import { aiLabelImage } from '../lib/eventImage'
import useEventsApi from '../composables/useEventsApi'
import EventsList from './EventsList.vue'
import VenueLocationMap from './VenueLocationMap.vue'

const props = defineProps({ uuid: String, config: Object, active: Boolean })
const emit = defineEmits(['close', 'open', 'ready'])
const t = inject('t', k => k)
const venue = ref(null)
const loading = ref(false)
const error = ref('')
const titleEl = ref(null)
const showMap = ref(false)
defineExpose({ loading })
const venueUuid = computed(() => props.uuid)
const { events, hasMore, loading: eventsLoading, error: eventsError, reset, loadMore } = useEventsApi(computed(() => props.config), { venueUuid })
const description = computed(() => markdownToHtml(venue.value?.description || ''))
const photo = computed(() => venue.value?.images?.main_photo)
const imageUrl = computed(() => {
  const url = safeWebUrl(photo.value?.url)
  if (!url) return ''
  const parsed = new URL(url)
  parsed.searchParams.set('width', '960')
  return parsed.href
})
const credit = computed(() => [photo.value?.creator, photo.value?.copyright && `© ${photo.value.copyright}`, photo.value?.license_name].filter(Boolean).join(', '))
const logo = computed(() => safeWebUrl(venue.value?.logos?.main_logo?.url))
const hasCoordinates = computed(() => Number.isFinite(venue.value?.lat) && Number.isFinite(venue.value?.lon))
let controller, version = 0

async function load() {
  const request = ++version
  controller?.abort()
  controller = new AbortController()
  venue.value = null
  error.value = ''
  loading.value = true
  showMap.value = false
  reset()
  try {
    const base = String(props.config.apiBaseUrl).replace(/\/$/, '')
    const data = await fetchApi(`${base}/venue/${encodeURIComponent(props.uuid)}?lang=${encodeURIComponent(props.config.language)}`, { signal: controller.signal })
    if (request !== version) return
    if (!data?.uuid || !data?.name) throw new Error(t('venue.notFound'))
    venue.value = data
    loadMore()
  } catch (err) {
    if (request === version && err.name !== 'AbortError') error.value = err.message
  } finally {
    if (request === version) { loading.value = false; emit('ready') }
  }
}
watch(() => props.uuid, load, { immediate: true })
watch(() => [loading.value, props.active], async () => {
  if (!loading.value && props.active && venue.value) {
    await nextTick()
    titleEl.value?.focus({ preventScroll: true })
  }
})
onBeforeUnmount(() => { version++; controller?.abort() })
</script>

<template>
  <section class="uw-venue" :aria-busy="loading">
    <button class="uw-button uw-button--big" type="button" @click="emit('close')">{{ t('back') }}</button>
    <p v-if="loading" class="uw-is-loading" role="status">{{ t('venue.loading') }}</p>
    <div v-else-if="error" class="uw-is-error" role="alert">
      <p>{{ t('detail.error', { error }) }}</p>
      <button class="uw-button" type="button" @click="load">{{ t('retry') }}</button>
    </div>
    <template v-else-if="venue">
      <div class="uw-venue__layout">
        <div>
          <figure v-if="imageUrl" class="uw-venue__image">
            <div class="uw-venue__image-frame">
              <img :src="imageUrl" :alt="photo.alt || venue.name">
              <img v-if="aiLabelImage(photo.ai_label)" class="uw-venue__ai-label" :src="aiLabelImage(photo.ai_label)" alt="">
            </div>
            <figcaption v-if="credit">{{ credit }}</figcaption>
          </figure>
          <h2 ref="titleEl" class="uw-title" tabindex="-1">{{ venue.name }}</h2>
          <div v-if="venue.description" class="uw-detail__description" v-html="description"></div>
        </div>
        <aside class="uw-venue__info">
          <img v-if="logo" :src="logo" :alt="venue.name" class="uw-venue__logo">
          <h3>{{ t('venue.address') }}</h3>
          <address>
            <span>{{ venue.name }}</span>
            <span v-if="venue.street || venue.house_number">{{ [venue.street, venue.house_number].filter(Boolean).join(' ') }}</span>
            <span v-if="venue.postal_code || venue.city">{{ [venue.postal_code, venue.city].filter(Boolean).join(' ') }}</span>
          </address>
          <a v-if="safeWebUrl(venue.web_link)" :href="safeWebUrl(venue.web_link)" target="_blank" rel="noopener noreferrer">{{ t('venue.website') }} ↗</a>
          <template v-if="venue.organization?.name">
            <h3>{{ t('venue.organization') }}</h3>
            <a v-if="safeWebUrl(venue.organization.web_link)" :href="safeWebUrl(venue.organization.web_link)" target="_blank" rel="noopener noreferrer">{{ venue.organization.name }} ↗</a>
            <p v-else>{{ venue.organization.name }}</p>
          </template>
          <template v-if="hasCoordinates">
            <button class="uw-button" type="button" :aria-expanded="showMap" @click="showMap = !showMap">{{ t(showMap ? 'venue.hideMap' : 'venue.showMap') }}</button>
            <VenueLocationMap v-if="showMap && active" :venue="venue" :settings="config.map" />
          </template>
        </aside>
      </div>
      <section class="uw-venue__events">
        <h3>{{ t('venue.events') }}</h3>
        <EventsList :events="events" :loading="eventsLoading" :error="eventsError"
          :layout="config.event_list.layout" :event-card-config="config.event_card" :api-base-url="config.apiBaseUrl"
          @open="emit('open', $event)" @retry="loadMore" />
        <div v-if="hasMore && !eventsLoading && events.length" class="uw-load-more">
          <button class="uw-button uw-button--big" type="button" @click="loadMore">{{ t('loadMore') }}</button>
        </div>
      </section>
    </template>
  </section>
</template>
