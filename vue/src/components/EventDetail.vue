<script setup>
import { computed } from 'vue'
import { formatDetailDate, markdownToHtml } from '../lib/format'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  data: {
    type: Object,
    default: null
  },
  links: {
    type: Array,
    default: () => []
  }
})

defineEmits(['close'])

const dateStr = computed(() => {
  const venue = props.data?.further_dates?.[0]
  return venue ? formatDetailDate(venue) : ''
})

const descriptionHtml = computed(() => markdownToHtml(data.description))

const venue = computed(() => props.data?.further_dates?.[0])

const venueName = computed(() => {
  const d = props.data
  if (!d) return ''
  return venue.value?.venue_name || d.org_name || ''
})

const venueCity = computed(() => venue.value?.venue_city || '')
</script>

<template>
  <div class="uw-detail__container">
    <div v-if="loading" class="uw-is-loading">Lade Details...</div>
    <div v-else-if="error" class="uw-is-error">Fehler beim Laden: {{ error }}</div>
    <div v-else-if="data" class="uw-detail">
      <div v-if="data.images?.main?.url" class="uw-detail__image">
        <img :src="`${data.images.main.url}/?ratio=16:9&width=900`" :alt="data.title">
      </div>
      <div class="uw-detail__body">
        <h2 class="uw-detail__title">{{ data.title }}</h2>
        <p v-if="data.subtitle" class="uw-detail__subtitle">{{ data.subtitle }}</p>
        <div class="uw-detail__meta">
          <p v-if="dateStr">
            <strong>Datum &amp; Uhrzeit:</strong> {{ dateStr }}
          </p>
          <p v-if="venueName">
            <strong>Ort:</strong> {{ venueName }}{{ venueCity ? `, ${venueCity}` : '' }}
          </p>
        </div>
        <div
          v-if="data.description"
          class="uw-detail__description"
          v-html="markdownToHtml(data.description)"
        ></div>
        <div class="uw-detail__links">
          <a
            v-for="link in links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener"
          >{{ link.label }}</a>
        </div>
      </div>
    </div>
  </div>
</template>
