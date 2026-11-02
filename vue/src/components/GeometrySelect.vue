<script setup>
import { inject } from 'vue'
import useGeometryOptions from '../composables/useGeometryOptions.js'

const t = inject('t', key => key)
const props = defineProps({
  modelValue: { type: String, default: null },
  apiBaseUrl: { type: String, default: '' },
  portal: { type: String, default: '' },
  group: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue'])
const { options, loading, error, reload } = useGeometryOptions(
  () => props.apiBaseUrl,
  () => props.portal,
  () => props.group,
)
</script>

<template>
  <div class="uw-filter__geometry">
    <select
      class="uw-select uw-filter__geometry-select"
      :value="modelValue ?? ''"
      :disabled="loading || !!error || !options.length"
      :aria-label="t('geometry.ariaLabel')"
      :aria-busy="loading"
      @change="emit('update:modelValue', $event.target.value || null)"
    >
      <option value="">{{ t(loading ? 'geometry.loading' : error ? 'geometry.unavailable' : !options.length ? 'geometry.empty' : 'geometry.all') }}</option>
      <option v-for="option in options" :key="option.geometry_uuid" :value="option.geometry_uuid">{{ option.name }}</option>
    </select>
    <span v-if="error" class="uw-filter__geometry-error" role="status">
      {{ t('geometry.loadError') }}
      <button class="uw-button" type="button" @click="reload">{{ t('retry') }}</button>
    </span>
  </div>
</template>
