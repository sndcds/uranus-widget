import { ref, watch, onScopeDispose } from 'vue'
import { fetchApi } from '../lib/api.js'

export default function useGeometryOptions(baseGetter, portalGetter, groupGetter) {
  const options = ref([])
  const loading = ref(false)
  const error = ref('')
  let version = 0
  let controller

  async function reload() {
    const request = ++version
    controller?.abort()
    options.value = []
    loading.value = false
    error.value = ''

    const group = groupGetter()
    if (group == null || group === '') return
    const portal = portalGetter()
    if (!portal) {
      error.value = 'Missing portal'
      return
    }

    const base = String(baseGetter() || '').replace(/\/$/, '')
    const params = new URLSearchParams({ group: String(group) })
    controller = new AbortController()
    loading.value = true
    try {
      const data = await fetchApi(`${base}/portal/${encodeURIComponent(portal)}/geometries/select?${params}`, {
        signal: controller.signal,
      })
      if (request !== version) return
      if (!Array.isArray(data?.select)) throw new Error('Invalid geometry selection response')
      options.value = data.select
        .filter(item => typeof item?.geometry_uuid === 'string' && item.geometry_uuid
          && typeof item.name === 'string' && item.name)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
    } catch (err) {
      if (request === version && err.name !== 'AbortError') error.value = err.message
    } finally {
      if (request === version) loading.value = false
    }
  }

  watch([baseGetter, portalGetter, groupGetter], reload, { immediate: true })
  onScopeDispose(() => { version++; controller?.abort() })

  return { options, loading, error, reload }
}
