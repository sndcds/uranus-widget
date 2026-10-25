import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEventUrl, buildVenueUrl, buildViewUrl, readWidgetRoute } from '../src/lib/url.js'

const original = 'https://example.org/cms/page?portal=p&venue=Theater&tracking=1#calendar'
test('venue navigation preserves CMS path, hash and the existing venue name filter', () => {
  const url = new URL(buildVenueUrl('place-id', original))
  assert.equal(url.pathname, '/cms/page')
  assert.equal(url.hash, '#calendar')
  assert.equal(url.searchParams.get('venue'), 'Theater')
  assert.equal(url.searchParams.get('uw-venue'), 'place-id')
})
test('event links retain the venue context and round-trip the date slug', () => {
  const url = buildEventUrl({ uuid: 'event-id', date_slug: 'second-date' }, buildVenueUrl('place-id', buildViewUrl('map', original)))
  assert.deepEqual(readWidgetRoute(url, { mapEnabled: true }), {
    view: 'map', venueUuid: 'place-id', eventUuid: 'event-id', dateSlug: 'second-date',
  })
  assert.equal(new URL(buildEventUrl(null, url)).searchParams.get('uw-venue'), 'place-id')
})
test('switching to an overview clears details while preserving host parameters', () => {
  const url = new URL(buildViewUrl('events', buildEventUrl({ uuid: 'e' }, buildVenueUrl('v', original))))
  assert.equal(url.searchParams.get('event'), null)
  assert.equal(url.searchParams.get('uw-venue'), null)
  assert.equal(url.searchParams.get('tracking'), '1')
  assert.equal(url.searchParams.get('date'), null)
})
test('disabled map and venue views fall back safely for bookmarked URLs', () => {
  assert.deepEqual(readWidgetRoute('https://example.org/?uw-view=map&uw-venue=v&event=e', { venueEnabled: false }), {
    view: 'events', venueUuid: null, eventUuid: 'e', dateSlug: null,
  })
})
