<script setup>
import { computed, inject } from 'vue'
import { useEventTypes } from '../composables/useEventTypes'

const t = inject('t', (k) => k)
const lang = inject('lang', { value: 'de' })

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  },
  summary: {
    type: Object,
    default: null
  },
  apiBaseUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const { isLoading, label } = useEventTypes(
    () => props.apiBaseUrl,
    () => lang.value || 'de'
)

const options = computed(() => {
  const typeSummary = props.summary?.type_summary

  if (!Array.isArray(typeSummary)) return []

  const counts = new Map()
  for (const item of typeSummary) {
    if (item && item.id != null && item.count > 0) {
      counts.set(String(item.id), item.count)
    }
  }

  const unknownFallback = (id) => `Typ ${id}`

  return [...counts.entries()]
      .map(([id, count]) => {
        const lbl = label(id) || unknownFallback(id)
        return {
          value: Number(id),
          label: lbl,
          count
        }
      })
      .sort((a, b) =>
          a.label.localeCompare(b.label, lang.value || 'de')
      )
})

function onChange(event) {
  const value = event.target.value === ''
      ? null
      : Number(event.target.value)

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <select
    class="uw-select"
    :value="modelValue ?? ''"
    :disabled="isLoading"
    :aria-label="t('eventType.ariaLabel')"
    @change="onChange"
  >
    <option value="">{{ t('eventType.all') }}</option>
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }} ({{ opt.count }})
    </option>
  </select>
</template>
