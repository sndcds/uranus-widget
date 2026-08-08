<script setup>
import { computed } from 'vue'
import { formatDetailDate, renderDescription } from '../lib/format'

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

const venue = computed(() => props.data?.further_dates?.[0])

const venueName = computed(() => {
  const d = props.data
  if (!d) return ''
  return venue.value?.venue_name || d.org_name || ''
})

const venueCity = computed(() => venue.value?.venue_city || '')
</script>

<template>
  <div class="detail-container">
    <div v-if="loading" class="loading">Lade Details...</div>
    <div v-else-if="error" class="error">Fehler beim Laden: {{ error }}</div>
    <div v-else-if="data" class="detail">
      <div v-if="data.images?.main?.url" class="detail-image">
        <img :src="`${data.images.main.url}/?ratio=16:9&width=900`" :alt="data.title">
      </div>
      <div class="detail-body">
        <h2 class="detail-title">{{ data.title }}</h2>
        <p v-if="data.subtitle" class="detail-subtitle">{{ data.subtitle }}</p>
        <div class="detail-meta">
          <p v-if="dateStr">
            <strong>Datum &amp; Uhrzeit:</strong> {{ dateStr }}
          </p>
          <p v-if="venueName">
            <strong>Ort:</strong> {{ venueName }}{{ venueCity ? `, ${venueCity}` : '' }}
          </p>
        </div>
        <div
          v-if="data.description"
          class="detail-description"
          v-html="renderDescription(data.description)"
        ></div>
        <div class="detail-links">
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
