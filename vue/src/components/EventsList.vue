<script setup>
import { computed } from 'vue'
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

const listKey = computed(() => {
  if (!props.events.length) return 'none'
  return props.events.map(e => e.uuid || '').join(',')
})
</script>

<template>
  <div class="uw-container">
    <Transition name="uw-fade" mode="out-in">
      <div v-if="loading && events.length === 0" key="loading" class="uw-is-loading">
        Lade Events...
      </div>
      <div v-else-if="error" key="error" class="uw-is-error">
        {{ error }}
      </div>
      <div v-else-if="events.length === 0" key="empty" class="uw-is-empty">
        Keine Events gefunden.
      </div>
      <div v-else :key="listKey" class="uw-list">
        <EventCard
          v-for="e in events"
          :key="`${e.uuid}-${e.date_slug}`"
          :event="e"
          @open="$emit('open', $event)"
        />
      </div>
    </Transition>

    <div v-if="loading && events.length > 0" class="uw-container__loading">
      Lädt…
    </div>
  </div>
</template>
