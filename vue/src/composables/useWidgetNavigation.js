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
  let currentEntry = null
  let scrollTask = null
  let hostScrollRestoration
  let frame

  function entryId() { return `${Date.now()}-${Math.random()}` }

  function read(task = null) {
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
    currentEntry = window.history.state?.uranusWidget?.id
    scrollTask = task
    revision.value++
  }

  function remember() {
    if (currentEntry && !scrollTask) positions.set(currentEntry, { x: window.scrollX, y: window.scrollY })
  }

  function reserveHeight(y, holdCurrent = false) {
    const element = root.value
    if (!element) return
    const rect = element.getBoundingClientRect()
    const documentTop = rect.top + window.scrollY
    const below = Math.max(0, document.documentElement.scrollHeight - (documentTop + rect.height))
    const minimum = y > 0 ? Math.max(0, y + window.innerHeight - documentTop - below) : 0
    // Keep enough page height to prevent the browser clamping scrollY when a
    // long list is replaced by a short map or a detail loading indicator.
    element.style.setProperty('--uw-scroll-min-height', `${Math.ceil(Math.max(minimum, holdCurrent ? rect.height : 0))}px`)
  }

  function onScroll() {
    if (scrollTask) return
    remember()
    reserveHeight(window.scrollY)
  }

  function navigate(url, replace = false, preserve = false) {
    if (url === window.location.href) return
    remember()
    cancelAnimationFrame(frame)
    const task = preserve
      ? { type: 'anchor', top: root.value?.getBoundingClientRect().top ?? 0 }
      : { type: 'start' }
    reserveHeight(window.scrollY, true)
    const id = entryId()
    ownedEntries.add(id)
    // A quick Back/Forward can revisit a tab before its first paint settles.
    if (preserve) positions.set(id, { x: window.scrollX, y: window.scrollY })
    window.history[replace ? 'replaceState' : 'pushState']({
      ...window.history.state,
      uranusWidget: { id, parent: replace ? null : currentUrl },
    }, '', url)
    // scrollRestoration belongs to the active history entry. Set it after
    // pushState so the original CMS entry retains its own restoration mode.
    window.history.scrollRestoration = 'manual'
    read(task)
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
    const task = scrollTask
    if (!task) return
    const version = revision.value
    await nextTick()
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (version !== revision.value || task !== scrollTask) return
      if (task.type === 'anchor') {
        const delta = (root.value?.getBoundingClientRect().top ?? task.top) - task.top
        window.scrollBy({ top: delta, behavior: 'instant' })
      } else if (task.type === 'position') {
        window.scrollTo({ left: task.x, top: task.y, behavior: 'instant' })
      } else if (task.type === 'start') {
        root.value?.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
      reserveHeight(window.scrollY)
      scrollTask = null
      remember()
    })
  }

  function onPopState() {
    remember()
    cancelAnimationFrame(frame)
    const id = window.history.state?.uranusWidget?.id
    const saved = positions.get(id)
    // The original host entry still uses native restoration when it was auto.
    // Unknown host entries also retain control of their own scrolling.
    const task = saved
      ? window.history.scrollRestoration === 'manual' ? { type: 'position', ...saved } : { type: 'native' }
      : ownedEntries.has(id) ? { type: 'start' } : null
    if (task) reserveHeight(Math.max(window.scrollY, saved?.y ?? 0), true)
    read(task)
  }
  function init() {
    hostScrollRestoration = window.history.scrollRestoration
    window.history.replaceState({
      ...window.history.state,
      uranusWidget: { id: entryId(), parent: null },
    }, '', window.location.href)
    read()
    remember()
    // The embedding page keeps control of its initial overview position.
    if (eventUuid.value || venueUuid.value) {
      reserveHeight(window.scrollY, true)
      scrollTask = { type: 'start' }
    }
    window.addEventListener('popstate', onPopState)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  }
  function dispose() {
    window.removeEventListener('popstate', onPopState)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    cancelAnimationFrame(frame)
    if (ownedEntries.has(window.history.state?.uranusWidget?.id) && window.history.scrollRestoration === 'manual') {
      window.history.scrollRestoration = hostScrollRestoration
    }
    root.value?.style.removeProperty('--uw-scroll-min-height')
  }

  return {
    view, venueUuid, eventUuid, dateSlug, revision, init, dispose, back, settleScroll,
    selectView: value => navigate(buildViewUrl(value), false, !eventUuid.value && !venueUuid.value),
    openVenue: uuid => navigate(buildVenueUrl(uuid)),
    openEvent: event => navigate(buildEventUrl(event)),
  }
}
