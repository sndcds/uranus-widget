<script setup>
import { ref } from 'vue'
import EventCard from './EventCard.vue'

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
        Lade Events...
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
        Keine Events gefunden.
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
            @open="$emit('open', $event)"
        />
      </div>

    </Transition>

    <!-- Loading additional events -->
    <div
        v-if="loading && events.length > 0"
        class="uw-container__loading"
    >
      Lädt…
    </div>

  </div>
</template>