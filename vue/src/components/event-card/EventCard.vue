<script setup>
import { computed } from 'vue'
import StandardEventCard from './variants/StandardEventCard.vue'
import CompactEventCard from './variants/CompactEventCard.vue'
import MinimalEventCard from './variants/MinimalEventCard.vue'
import { EVENT_CARD_VARIANTS } from '../../types/event-card'

/**
 * EventCard-Wrapper.
 *
 * Lädt abhängig von `config.event_card.variant` die passende Variante.
 * Unbekannte/fehlende Varianten fallen auf "standard" zurück.
 *
 * Neue Varianten werden ergänzt, indem in `variants/` ein neues Modul
 * (z. B. `VarianteNameEventCard.vue`) angelegt und hier registriert wird.
 */
const props = defineProps({
  event: {
    type: Object,
    required: true
  },
  /** @type {object} normalisierte EventCardConfig (variant + image) */
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

/** Registrierung bekannter Varianten. */
const VARIANT_COMPONENTS = {
  standard: StandardEventCard,
  compact: CompactEventCard,
  minimal: MinimalEventCard,
}

const variant = computed(() => {
  const requested = props.eventCardConfig?.variant

  // Nur bekannte Varianten zulassen, sonst Fallback "standard"
  if (EVENT_CARD_VARIANTS.includes(requested) && VARIANT_COMPONENTS[requested]) {
    return requested
  }
  return 'standard'
})

const resolvedComponent = computed(() => VARIANT_COMPONENTS[variant.value])
</script>

<template>
  <component
    :is="resolvedComponent"
    :event="event"
    :image-config="eventCardConfig?.image || {}"
    :api-base-url="apiBaseUrl"
    @open="$emit('open', $event)"
  />
</template>
