<script setup>
import { inject } from 'vue'
import EventCard from './event-card/EventCard.vue'

const t = inject('t', (k) => k)

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  events: {
    type: Array,
    default: () => []
  },
  eventCardConfig: {
    type: Object,
    default: () => ({ variant: 'standard', image: {} })
  },
  apiBaseUrl: {
    type: String,
    default: ''
  }
})

defineEmits(['open'])

</script>

<template>
  <div class="uw-container">

    <Transition name="uw-fade" mode="out-in">

      <!-- Initial loading -->
      <div
          v-if="loading && events.length === 0"
          key="loading"
          class="uw-is-loading"
      >
        {{ t('list.loading') }}
      </div>

      <!-- Error -->
      <div
          v-else-if="error && events.length === 0"
          key="error"
          class="uw-is-error"
      >
        {{ error }}
      </div>

      <!-- Empty -->
      <div
          v-else-if="events.length === 0"
          key="empty"
          class="uw-is-empty"
      >
        {{ t('list.empty') }}
      </div>

      <!-- Events -->
      <div
          v-else
          key="events"
          class="uw-list"
      >
        <EventCard
            v-for="e in events"
            :key="`${e.uuid}-${e.date_slug}`"
            :event="e"
            :event-card-config="eventCardConfig"
            :api-base-url="apiBaseUrl"
            @open="$emit('open', $event)"
        />
      </div>

    </Transition>

    <!-- Loading additional events -->
    <div
        v-if="loading && events.length > 0"
        class="uw-container__loading"
    >
      {{ t('list.loadingMore') }}
    </div>

  </div>
</template>