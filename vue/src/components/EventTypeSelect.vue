<script setup>
import { computed, onMounted, ref, watch } from 'vue'

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
    const types = (data.de || data.en || data.da || {}).types || {}

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
          a.label.localeCompare(b.label, 'de')
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
    aria-label="Nach Event-Typ filtern"
    @change="onChange"
  >
    <option value="">Alle Event-Typen</option>
    <option
      v-for="opt in options"
      :key="opt.value"
      :value="opt.value"
    >
      {{ opt.label }} ({{ opt.count }})
    </option>
  </select>
</template>
