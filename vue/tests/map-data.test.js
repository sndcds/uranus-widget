import { test } from 'node:test'
import assert from 'node:assert/strict'
import { transformVenues, isArea } from '../src/lib/mapData.js'
import { buildEventFilter } from '../src/lib/eventFilter.js'
import { resolveStyleResources } from '../src/lib/mapStyle.js'

test('relative style assets resolve against the style file and keep tile/glyph placeholders', () => {
  const resolved = resolveStyleResources({
    sprite: [{ id: 'basics', url: './sprites/basics/sprites' }], glyphs: '../fonts/{fontstack}/{range}.pbf',
    sources: { osm: { type: 'vector', tiles: ['../tiles/{z}/{x}/{y}'] } },
  }, 'https://example.org/widget/versatiles/style.json')
  assert.equal(resolved.sprite[0].url, 'https://example.org/widget/versatiles/sprites/basics/sprites')
  assert.equal(resolved.glyphs, 'https://example.org/widget/fonts/{fontstack}/{range}.pbf')
  assert.equal(resolved.sources.osm.tiles[0], 'https://example.org/widget/tiles/{z}/{x}/{y}')
})

test('API point/building fields become separate valid GeoJSON sources', () => {
  const building = { type: 'Polygon', coordinates: [[[9, 54], [10, 54], [10, 55], [9, 54]]] }
  const result = transformVenues({ features: [
    { properties: { uuid: 'v', name: 'Museum', type: 'museum' }, point: { type: 'Point', coordinates: [9, 54] }, building },
    { properties: { uuid: 'invalid', name: 'Invalid' }, point: { type: 'Point', coordinates: [NaN, 54] } },
    { properties: { uuid: 'other', name: 'Other', marker_style: 'unknown' }, geometry: { type: 'Point', coordinates: [10, 54] } },
  ] })
  assert.equal(result.points.features.length, 2)
  assert.equal(result.points.features[0].properties.marker_style, 'museum')
  assert.equal(result.points.features[1].properties.marker_style, 'default')
  assert.equal(result.buildings.features.length, 1)
  assert.equal(isArea({ type: 'Polygon', coordinates: [] }), false)
})
test('event filters retain configured portal and limits and ignore view parameters', () => {
  const filter = buildEventFilter({ language: 'da', filter: { portal: 'p', limit: 8, tags: 'one,two', categories: [1], venue_uuids: ['v'] } },
    { categories: [2], type: 4, search: 'music' }, '?uw-venue=other&uw-view=map&venue=Theater&portal=other')
  assert.deepEqual(filter, { portal: 'p', limit: 8, tags: ['one', 'two'], categories: [2], venue_uuids: ['v'], venue: 'Theater', event_types: [4], search: 'music', lang: 'da' })
})
