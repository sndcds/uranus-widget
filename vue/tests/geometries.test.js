import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, nextTick, ref } from 'vue'
import useGeometryOptions from '../src/composables/useGeometryOptions.js'

const response = data => ({ ok: true, json: async () => ({ status: 200, data }) })
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('geometry options are optional and use the configured API, portal and group in stable order', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options })
    return response({ select: [
      { name: 'Büdelsdorf', order: 2, geometry_uuid: 'city-b' },
      { name: 'Kulturregion', order: 1, geometry_uuid: 'region' },
      { name: 'Alt Duvenstedt', order: 2, geometry_uuid: 'city-a' },
    ] })
  })
  const scope = effectScope()
  const group = ref(undefined)
  const api = scope.run(() => useGeometryOptions(() => 'https://example.org/api/', () => 'portal-1', () => group.value))
  try {
    await settle()
    assert.equal(requests.length, 0)
    group.value = 1
    await nextTick()
    assert.equal(api.loading.value, true)
    await settle()
    assert.equal(requests[0].url, 'https://example.org/api/portal/portal-1/geometries/select?group=1')
    assert.deepEqual(api.options.value.map(option => option.geometry_uuid), ['region', 'city-b', 'city-a'])
    assert.equal(api.loading.value, false)
    assert.equal(api.error.value, '')

    group.value = null
    await nextTick()
    assert.equal(requests.length, 1)
    assert.deepEqual(api.options.value, [])
  } finally { scope.stop() }
})

test('changing the group cancels the old request and discards stale responses', async t => {
  const requests = []
  t.mock.method(globalThis, 'fetch', (url, options) => new Promise(resolve => requests.push({ url, options, resolve })))
  const scope = effectScope()
  const group = ref(0)
  const api = scope.run(() => useGeometryOptions(() => '/api', () => 'portal-1', () => group.value))
  try {
    assert.match(requests[0].url, /group=0$/)
    group.value = 2
    await nextTick()
    assert.equal(requests[0].options.signal.aborted, true)
    requests[1].resolve(response({ select: [{ name: 'Aktuell', order: 1, geometry_uuid: 'current' }] }))
    await settle()
    requests[0].resolve(response({ select: [{ name: 'Veraltet', order: 1, geometry_uuid: 'stale' }] }))
    await settle()
    assert.deepEqual(api.options.value.map(option => option.geometry_uuid), ['current'])
    assert.equal(api.loading.value, false)

    group.value = 3
    await nextTick()
    scope.stop()
    assert.equal(requests[2].options.signal.aborted, true)
    requests[2].resolve(response({ select: [{ name: 'Zu spät', geometry_uuid: 'late' }] }))
    await settle()
    assert.deepEqual(api.options.value, [])
  } finally { scope.stop() }
})

test('unavailable or malformed geometry responses can be retried; an empty group is valid', async t => {
  const replies = [
    { ok: false, status: 503 },
    response({}),
    response({ select: [] }),
    response({ select: [{ name: 'Rendsburg', geometry_uuid: 'rendsburg', order: 2 }] }),
  ]
  t.mock.method(globalThis, 'fetch', async () => replies.shift())
  const scope = effectScope()
  const api = scope.run(() => useGeometryOptions(() => '/api', () => 'portal-1', () => 1))
  try {
    await settle()
    assert.equal(api.error.value, 'HTTP 503')
    assert.equal(api.loading.value, false)
    await api.reload()
    assert.equal(api.error.value, 'Invalid geometry selection response')
    await api.reload()
    assert.equal(api.error.value, '')
    assert.deepEqual(api.options.value, [])
    await api.reload()
    assert.equal(api.options.value[0].geometry_uuid, 'rendsburg')
    assert.equal(api.error.value, '')
  } finally { scope.stop() }
})
