<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue'

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

const typeLabels = ref({})
const lookupLoading = ref(false)

watch(
  () => props.apiBaseUrl,
  (url) => {
    if (url) loadTypeLookup()
  }
)

onMounted(() => {
  if (props.apiBaseUrl) loadTypeLookup()
})

async function loadTypeLookup() {
  const base = String(props.apiBaseUrl || '').replace(/\/$/, '')

  if (!base) return

  lookupLoading.value = true

  try {
    const res = await fetch(`${base}/event/type-genre-lookup`)

    if (!res.ok) return

    const json = await res.json()

    const data = json.data || {}

    // The lookup API knows de, en, da. Prefer the current language,
    // otherwise fall back to the available ones.
    const active = data[lang.value] || data.de || data.en || data.da || {}
    const types = active.types || {}

    const labels = {}
    for (const [id, entry] of Object.entries(types)) {
      labels[id] = entry?.name || id
    }

    typeLabels.value = labels
  } catch {
    // Lookup is optional.
  } finally {
    lookupLoading.value = false
  }
}

const options = computed(() => {
  const typeSummary = props.summary?.type_summary

  if (!Array.isArray(typeSummary)) return []

  const counts = new Map()
  for (const item of typeSummary) {
    if (item && item.id != null && item.count > 0) {
      counts.set(String(item.id), item.count)
    }
  }

  return [...counts.entries()]
      .map(([id, count]) => ({
        value: Number(id),
        label: typeLabels.value[id] || id,
        count
      }))
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
    :disabled="lookupLoading"
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
