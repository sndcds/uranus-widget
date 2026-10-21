import { ref, computed, watch, onScopeDispose } from 'vue'
import { useI18n } from './useI18n'
import { resolveLinkStyle } from '../lib/linkIcon'
import { fetchApi, safeWebUrl } from '../lib/api'

export default function useEventDetail(config, uuid, dateSlug) {
  const detailData = ref(null)
  const detailLoading = ref(false)
  const detailError = ref('')
  const { t } = useI18n(computed(() => config.value.language || 'de'))
  let controller
  let version = 0
  const detailLinks = computed(() => {
    const d = detailData.value

    if (!d) return []

    const links = []

    const pushLink = (url, label, type) => {
      if (!safeWebUrl(url)) return
      const style = resolveLinkStyle(type)
      links.push({
        url,
        label,
        icon: style.path,
        svg: style.svg,
        color: style.color,
        type: type || 'web',
      })
    }

    if (d.source_link) {
      pushLink(d.source_link, t('links.eventLink'), 'source')
    }

    if (d.org_web_link) {
      pushLink(d.org_web_link, t('links.organizerWebsite'), 'web')
    }

    if (
        d.event_links &&
        Array.isArray(d.event_links)
    ) {
      for (const l of d.event_links) {
        if (!safeWebUrl(l.url)) continue

        const type = l.type || 'web'
        const translatedLabel = t(`links.${type}`)
        // Nur die Übersetzung verwenden, wenn ein Key existiert,
        // sonst auf das vom Event gelieferte Label/den Typ/URL fallen.
        const label =
            translatedLabel === `links.${type}`
                ? l.label || l.type || l.url
                : translatedLabel

        pushLink(l.url, label, type)
      }
    }

    return links
  })


  async function reload() {
    const request = ++version
    controller?.abort()
    detailData.value = null
    detailError.value = ''
    detailLoading.value = false
    if (!uuid.value) return
    controller = new AbortController()
    detailLoading.value = true
    const base = String(config.value.apiBaseUrl || '').replace(/\/$/, '')
    const datePath = dateSlug.value ? `/date/${encodeURIComponent(dateSlug.value)}` : ''
    try {
      const data = await fetchApi(`${base}/event/${encodeURIComponent(uuid.value)}${datePath}?lang=${encodeURIComponent(config.value.language || 'de')}`, { signal: controller.signal })
      if (request === version) detailData.value = data
    } catch (error) {
      if (request === version && error.name !== 'AbortError') detailError.value = error.message
    } finally {
      if (request === version) detailLoading.value = false
    }
  }
  watch([uuid, dateSlug], reload)
  onScopeDispose(() => { version++; controller?.abort() })
  return { detailData, detailLoading, detailError, detailLinks, reload }
}
