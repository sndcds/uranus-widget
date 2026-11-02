import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import useEventsApi from '../src/composables/useEventsApi.js'

test('changing filters discards an outstanding response and fetches the new selection', async () => {
  globalThis.window = { location: { search: '' } }
  const requests = []
  const previousFetch = globalThis.fetch
  globalThis.fetch = (url, options) => {
    if (!options?.body) return Promise.resolve({ ok: true, json: async () => ({ data: {} }) })
    return new Promise(resolve => requests.push({ payload: JSON.parse(options.body), resolve }))
  }
  const scope = effectScope()
  const api = scope.run(() => useEventsApi(ref({ filter: { portal: 'p', limit: 12 } })))
  try {
    const first = api.loadMore()
    api.selectCategories([2])
    assert.equal(requests.length, 2)
    assert.deepEqual(requests[1].payload.categories, [2])
    requests[1].resolve({ ok: true, json: async () => ({ data: { events: [{ uuid: 'new' }] } }) })
    await new Promise(resolve => setTimeout(resolve, 0))
    requests[0].resolve({ ok: true, json: async () => ({ data: { events: [{ uuid: 'old' }] } }) })
    await first
    assert.deepEqual(api.events.value, [{ uuid: 'new' }])
    assert.equal(api.loading.value, false)
  } finally { scope.stop(); globalThis.fetch = previousFetch; delete globalThis.window }
})

test('venue results retain the portal and never widen a configured venue UUID restriction', async () => {
  globalThis.window = { location: { search: '' } }
  const requests = []
  const previousFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    requests.push(JSON.parse(options.body))
    return { ok: true, json: async () => ({ data: { events: [] } }) }
  }
  const scope = effectScope()
  try {
    const config = ref({ filter: { portal: 'p', venue_uuids: ['allowed'], categories: [2] } })
    const allowed = scope.run(() => useEventsApi(config, { venueUuid: ref('allowed') }))
    await allowed.loadMore()
    assert.deepEqual(requests[0].venue_uuids, ['allowed'])
    assert.equal(requests[0].portal, 'p')
    assert.deepEqual(requests[0].categories, [2])
    const denied = scope.run(() => useEventsApi(config, { venueUuid: ref('other') }))
    await denied.loadMore()
    assert.equal(requests.length, 1)
    assert.equal(denied.hasMore.value, false)
  } finally { scope.stop(); globalThis.fetch = previousFetch; delete globalThis.window }
})

test('geometry changes refresh events and counts, reset pagination, and retain the other filters', async t => {
  const previousWindow = globalThis.window
  globalThis.window = { location: { search: '' } }
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, filter: options?.body ? JSON.parse(options.body) : Object.fromEntries(new URL(url).searchParams) })
    return { ok: true, json: async () => ({ data: options?.body
      ? { events: [{ uuid: 'event' }], last_event_date_uuid: 'cursor', last_event_start_at: '2026-11-02' }
      : { total_event_count: 1 } }) }
  })
  const scope = effectScope()
  const api = scope.run(() => useEventsApi(ref({ apiBaseUrl: 'https://example.org/api', filter: { portal: 'p', geometry_group: 1, limit: 1 } })))
  const settle = () => new Promise(resolve => setTimeout(resolve, 0))
  try {
    api.selectCategories([2])
    await settle()
    api.selectType(4)
    await settle()
    api.setSearch('Musik')
    await settle()
    await api.loadMore()
    assert.equal(requests.at(-1).filter.last_event_date_uuid, 'cursor')

    api.selectGeometry('geometry-1')
    await settle()
    const [events, summary] = requests.slice(-2)
    assert.deepEqual(events.filter, { portal: 'p', limit: 1, categories: [2], event_types: [4], search: 'Musik', geometry: 'geometry-1', lang: 'de' })
    assert.equal(summary.filter.geometry, 'geometry-1')
    assert.equal('geometry_group' in summary.filter, false)
    assert.equal(api.selectedGeometry.value, 'geometry-1')
    assert.equal(api.events.value.length, 1)

    await api.loadMore()
    assert.equal(requests.at(-1).filter.geometry, 'geometry-1')
    assert.equal(requests.at(-1).filter.last_event_date_uuid, 'cursor')

    api.selectGeometry(null)
    await settle()
    for (const { filter } of requests.slice(-2)) {
      assert.equal('geometry' in filter, false)
      assert.equal('geometry_group' in filter, false)
      assert.equal('last_event_date_uuid' in filter, false)
    }
    assert.equal(api.selectedGeometry.value, null)
  } finally { scope.stop(); globalThis.window = previousWindow }
})
