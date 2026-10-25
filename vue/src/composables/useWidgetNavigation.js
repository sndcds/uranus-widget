import { ref, nextTick } from 'vue'
import { buildEventUrl, buildVenueUrl, buildViewUrl, readWidgetRoute } from '../lib/url.js'

export default function useWidgetNavigation(config, root) {
  const view = ref('events')
  const venueUuid = ref(null)
  const eventUuid = ref(null)
  const dateSlug = ref(null)
  const revision = ref(0)
  const positions = new Map()
  const ownedEntries = new Set()
  let currentUrl = ''
  let scrollTarget = null
  let frame

  function read() {
    const route = readWidgetRoute(window.location.href, {
      mapEnabled: config.value.map?.enabled,
      venueEnabled: config.value.venue_details?.enabled,
      initialView: config.value.map?.initialView,
    })
    view.value = route.view
    venueUuid.value = route.venueUuid
    eventUuid.value = route.eventUuid
    dateSlug.value = route.dateSlug
    currentUrl = window.location.href
    scrollTarget = positions.get(currentUrl) ?? null
    revision.value++
  }

  function remember() {
    if (currentUrl) positions.set(currentUrl, window.scrollY)
  }

  function navigate(url, replace = false) {
    if (url === window.location.href) return
    remember()
    const id = `${Date.now()}-${Math.random()}`
    ownedEntries.add(id)
    window.history[replace ? 'replaceState' : 'pushState']({
      ...window.history.state,
      uranusWidget: { id, parent: replace ? null : currentUrl },
    }, '', url)
    read()
  }

  function back() {
    const entry = window.history.state?.uranusWidget
    if (entry?.parent && ownedEntries.has(entry.id)) {
      window.history.back()
      return
    }
    const fallback = eventUuid.value && venueUuid.value
      ? buildEventUrl(null)
      : buildVenueUrl(null)
    navigate(eventUuid.value || venueUuid.value ? fallback : buildViewUrl(view.value), true)
  }

  async function settleScroll() {
    const version = revision.value
    await nextTick()
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (version !== revision.value) return
      if (scrollTarget != null) window.scrollTo({ top: scrollTarget, behavior: 'instant' })
      else root.value?.scrollIntoView({ behavior: 'instant', block: 'start' })
    })
  }

  function onPopState() { remember(); read() }
  function init() {
    read()
    // The embedding page keeps control of its initial scroll position.
    if (!eventUuid.value && !venueUuid.value) scrollTarget = window.scrollY
    window.addEventListener('popstate', onPopState)
  }
  function dispose() {
    window.removeEventListener('popstate', onPopState)
    cancelAnimationFrame(frame)
  }

  return {
    view, venueUuid, eventUuid, dateSlug, revision, init, dispose, back, settleScroll,
    selectView: value => navigate(buildViewUrl(value)),
    openVenue: uuid => navigate(buildVenueUrl(uuid)),
    openEvent: event => navigate(buildEventUrl(event)),
  }
}
