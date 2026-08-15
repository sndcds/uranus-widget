<script setup>
import { computed, inject } from 'vue'
import { formatDate, formatShortDate, markdownToHtml } from '../lib/format'


const props = defineProps({
  event: {
    type: Object,
    required: true
  }
})

const t = inject('t', (k) => k)
const locale = inject('locale', 'de-DE')

defineEmits(['open'])

const summaryHTML = computed(() => {
  const text = props.event.summary || ''
  const maxLength = 300

  const shortenedText = text.length > maxLength
      ? text.substring(0, maxLength) + '…'
      : text

  return markdownToHtml(shortenedText)
})

</script>

<template>
  <div
      class="uw-card uw-event-card"
      @click="$emit('open', event)">

    <div class="uw-event-card__image">
      <img
        v-if="event.image_path"
        :src="`${event.image_path}/?ratio=16:9&width=480`"
        :alt="event.title"
        loading="lazy"
      >
      <div v-else class="uw-card__placeholder">{{ t('noImage') }}</div>
    </div>

    <div class="uw-card__content">
      <div class="uw-event-card__content">

        <!-- Date -->
        <span class="uw-event-card__date">{{ formatShortDate(event, locale) }}</span>

        <!-- Title -->
        <span class="uw-event-card__title">{{ event.title }}</span>

        <!-- Subtitle -->
        <p v-if="event.subtitle" class="uw-event-card__subtitle">{{ event.subtitle }}</p>

        <!-- Venue and City -->
        <p class="uw-event-card__meta">
          <template v-if="event.venue_name">
            {{ event.venue_name }}
          </template>
          <template v-if="event.venue_city">
            , {{ event.venue_city }}
          </template>
        </p>

        <!-- Summary -->
        <div
            v-if="event.summary"
            class="uw-event-card__summary"
            v-html="summaryHTML"
        />
      </div>
    </div>

  </div>
</template>
