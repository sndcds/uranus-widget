import { test, expect } from '@playwright/test'

const event = { uuid: 'event-1', date_slug: '2026-11-01', title: 'Konzert am Hafen', start_date: '2026-11-01', venue_name: 'Kulturhaus', venue_uuid: 'venue-1', venue_city: 'Rendsburg', event_types: [] }
const venue = { uuid: 'venue-1', name: 'Kulturhaus', description: 'Ein **schöner** Ort.', city: 'Rendsburg', street: 'Hafenstraße', house_number: '1', lat: 54.3, lon: 9.67, web_link: 'https://example.org', organization: { name: 'Kulturverein' } }
const point = { type: 'Feature', point: { type: 'Point', coordinates: [9.67, 54.3] }, properties: venue, building: { type: 'Polygon', coordinates: [[[9.669, 54.299], [9.671, 54.299], [9.671, 54.301], [9.669, 54.299]]] } }
const boundary = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[9.5, 54.2], [9.8, 54.2], [9.8, 54.4], [9.5, 54.2]]] } }

async function setup(page, overrides = {}, points = [point]) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && message.text().includes('[uranus-widget]')) console.log(message.text()) })
  await page.route('**/demo/config.json', route => route.fulfill({ json: {
    apiBaseUrl: '/api', language: 'de', map: { enabled: true, center: [9.67, 54.3], zoom: 11 },
    filter: { portal: 'portal-1', limit: 12, categories: [1] }, ...overrides,
  } }))
  await page.route('**/versatiles/versatiles-style.json', route => route.fulfill({ json: {
    version: 8, glyphs: 'http://127.0.0.1:4187/glyphs/{fontstack}/{range}.pbf', sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#eef0e9' } }],
  } }))
  await page.route('**/glyphs/**', route => route.fulfill({ body: Buffer.from([]), contentType: 'application/x-protobuf' }))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    let data
    if (url.pathname === '/api/events/filter') data = { events: [event] }
    else if (url.pathname === '/api/events/type-summary') data = { total_event_count: 1, types: [] }
    else if (url.pathname === '/api/venues/geojson') data = { type: 'FeatureCollection', features: points }
    else if (url.pathname.startsWith('/api/portal/')) data = boundary
    else if (url.pathname.startsWith('/api/venue/')) data = venue
    else if (url.pathname.startsWith('/api/event/')) data = { ...event, date: { ...event, slug: event.date_slug }, description: 'Musik im Hafen.' }
    else data = []
    return route.fulfill({ json: { status: 200, data } })
  })
  return errors
}

test('map is loaded on demand; place → event → back preserves map, filters and host URL', async ({ page }) => {
  const errors = await setup(page)
  const engineRequests = []
  const eventRequests = []
  page.on('request', r => {
    if (r.url().includes('uranus-widget-map.js')) engineRequests.push(r.url())
    if (r.url().includes('/events/filter')) eventRequests.push(r.postDataJSON())
  })
  await page.goto('/demo/embed.html?tracking=keep#calendar')
  await expect(page.getByText(event.title)).toBeVisible()
  expect(engineRequests).toHaveLength(0)
  await page.getByRole('button', { name: 'Orte / Karte', exact: true }).click()
  await expect(page.locator('.uw-map__places')).toBeVisible({ timeout: 20000 })
  expect(engineRequests).toHaveLength(1)
  await page.locator('.uw-map__places summary').click()
  await test.step('place link', async () => { await page.locator('.uw-map__places a').click() })
  await expect(page.getByRole('heading', { name: venue.name, exact: true })).toBeVisible()
  expect(eventRequests.at(-1)).toMatchObject({ portal: 'portal-1', venue_uuids: ['venue-1'], categories: [1] })
  await test.step('event link', async () => { await page.locator('.uw-venue__events').getByRole('link', { name: /Konzert am Hafen/ }).click() })
  await expect(page.locator('.uw-event-detail__header')).toContainText(event.title)
  await test.step('event back', async () => { await page.getByRole('button', { name: 'Zurück', exact: true }).last().click() })
  await expect(page.getByRole('heading', { name: venue.name, exact: true })).toBeVisible()
  await test.step('venue back', async () => { await page.getByRole('button', { name: 'Zurück', exact: true }).click() })
  await expect(page.locator('.uw-map__canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Veranstaltungen', exact: true }).click()
  await expect(page.locator('.uw-filter__chip--active')).toHaveText('Kultur')
  expect(new URL(page.url()).searchParams.get('tracking')).toBe('keep')
  expect(new URL(page.url()).hash).toBe('#calendar')
  expect(engineRequests).toHaveLength(1)
  expect(errors).toEqual([])
})

test('direct event links use the date slug and return to the containing venue', async ({ page }) => {
  await setup(page)
  const requested = []
  page.on('request', r => { if (r.url().includes('/api/event/')) requested.push(r.url()) })
  await page.goto('/demo/embed.html?uw-view=map&uw-venue=venue-1&event=event-1&date=2026-11-01')
  await expect(page.locator('.uw-event-detail__header')).toContainText(event.title)
  expect(requested.some(url => url.includes('/event/event-1/date/2026-11-01?lang=de'))).toBe(true)
  await test.step('event back', async () => { await page.getByRole('button', { name: 'Zurück', exact: true }).last().click() })
  await expect(page.getByRole('heading', { name: venue.name, exact: true })).toBeVisible()
})

test('map API errors are retryable and a failed venue still has a back button', async ({ page }) => {
  await setup(page)
  await page.route('**/api/venues/geojson?**', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/demo/embed.html?uw-view=map')
  await expect(page.locator('.uw-map__error')).toBeVisible({ timeout: 20000 })
  await page.unroute('**/api/venues/geojson?**')
  await page.getByRole('button', { name: 'Erneut versuchen' }).click()
  await expect(page.locator('.uw-map__places')).toBeVisible()
  await page.route('**/api/venue/venue-1?**', route => route.fulfill({ status: 404, body: '' }))
  await page.locator('.uw-map__places summary').click()
  await test.step('place link', async () => { await page.locator('.uw-map__places a').click() })
  await expect(page.locator('.uw-venue [role=alert]')).toBeVisible()
  await test.step('venue back', async () => { await page.getByRole('button', { name: 'Zurück', exact: true }).click() })
  await expect(page.locator('.uw-map__canvas')).toBeVisible()
})

test('mobile layout fits its container and enlarged map closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page)
  await page.goto('/demo/embed.html?uw-view=map')
  await expect(page.locator('.uw-map__places')).toBeVisible({ timeout: 20000 })
  await page.getByRole('button', { name: 'Karte vergrößern' }).click()
  await expect(page.locator('.uw-map')).toHaveClass(/uw-map--expanded/)
  await page.keyboard.press('Escape')
  await expect(page.locator('.uw-map')).not.toHaveClass(/uw-map--expanded/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('existing embeds can keep the map disabled', async ({ page }) => {
  await setup(page, { map: { enabled: false }, venue_details: { enabled: false } })
  await page.goto('/demo/embed.html?uw-view=map')
  await expect(page.getByText(event.title)).toBeVisible()
  await expect(page.locator('.uw-view-switch')).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('clicking a marker opens its popup and venue details', async ({ page }, testInfo) => {
  await setup(page)
  await page.goto('/demo/embed.html?uw-view=map')
  await expect(page.locator('.uw-map__places')).toBeVisible()
  const canvas = page.locator('.uw-map__canvas')
  const box = await canvas.boundingBox()
  await expect(async () => {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 - 12 } })
    await expect(page.locator('.uw-map-popup')).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 5000 })
  await expect(page.locator('.uw-map-popup')).toContainText(venue.name)
  await page.screenshot({ path: testInfo.outputPath('map.png'), fullPage: true })
  await page.locator('.uw-map-popup').getByRole('link', { name: 'Details zum Ort' }).click()
  await expect(page.getByRole('heading', { name: venue.name, exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('venue.png'), fullPage: true })
})

test('cluster click zooms in and loads the new map envelope', async ({ page }) => {
  await setup(page, {}, [point, { ...point, point: { type: 'Point', coordinates: [9.6702, 54.3] }, properties: { ...venue, uuid: 'venue-2', name: 'Galerie' } }])
  const envelopes = []
  page.on('request', r => { if (r.url().includes('/venues/geojson?')) envelopes.push(new URL(r.url()).searchParams.get('bbox')) })
  await page.goto('/demo/embed.html?uw-view=map')
  await expect(page.locator('.uw-map__places')).toBeVisible()
  const canvas = page.locator('.uw-map__canvas')
  const box = await canvas.boundingBox()
  const before = envelopes[0].split(',').map(Number)
  await expect(async () => {
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } })
    expect(envelopes.length).toBeGreaterThan(1)
  }).toPass({ timeout: 7000 })
  const after = envelopes.at(-1).split(',').map(Number)
  expect(after[2] - after[0]).toBeLessThan(before[2] - before[0])
})

test('browser forward reloads the right date for a repeated event UUID', async ({ page }) => {
  await setup(page)
  await page.route('**/api/events/filter', route => route.fulfill({ json: { status: 200, data: {
    events: [event, { ...event, date_slug: '2026-11-02', start_date: '2026-11-02' }],
  } } }))
  const dates = []
  page.on('request', r => { if (r.url().includes('/event/event-1/')) dates.push(r.url()) })
  await page.goto('/demo/embed.html')
  await page.locator('.uw-event-card').first().click()
  await expect(page.locator('.uw-event-detail__header')).toBeVisible()
  await page.goBack()
  await page.locator('.uw-event-card').nth(1).click()
  await expect(page.locator('.uw-event-detail__header')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.uw-event-card').nth(1)).toBeVisible()
  await page.goForward()
  await expect(page.locator('.uw-event-detail__header')).toBeVisible()
  expect(dates.at(-1)).toContain('/date/2026-11-02?lang=de')
})

test('returning to a long result list restores its scroll position', async ({ page }) => {
  await setup(page)
  await page.route('**/api/events/filter', route => route.fulfill({ json: { status: 200, data: {
    events: Array.from({ length: 12 }, (_, i) => ({ ...event, uuid: `event-${i + 1}`, title: `Konzert ${i + 1}` })),
  } } }))
  await page.goto('/demo/embed.html')
  const target = page.locator('.uw-event-card').nth(8)
  await target.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => window.scrollY)
  expect(before).toBeGreaterThan(300)
  await target.click()
  await expect(page.locator('.uw-event-detail__header')).toBeVisible()
  await page.goBack()
  await expect(target).toBeVisible()
  await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(10)
})

test('venue location map loads on demand and reuses the engine after event navigation', async ({ page }) => {
  await setup(page)
  const engines = []
  page.on('request', r => { if (r.url().includes('uranus-widget-map.js')) engines.push(r.url()) })
  await page.goto('/demo/embed.html?uw-venue=venue-1')
  await expect(page.locator('.uw-venue__layout')).toBeVisible()
  expect(engines).toHaveLength(0)
  await page.getByRole('button', { name: 'Standort auf Karte anzeigen' }).click()
  await expect(page.locator('.uw-venue__map canvas')).toBeVisible()
  expect(engines).toHaveLength(1)
  await page.locator('.uw-venue__events .uw-event-card').click()
  await expect(page.locator('.uw-event-detail__header')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.uw-venue__map canvas')).toBeVisible()
  expect(engines).toHaveLength(1)
})
