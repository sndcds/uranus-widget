import { PARAM_MAP, OVERRIDABLE_PARAMS } from './constants.js'

export function buildEventFilter(config, selection = {}, search = '') {
  const filter = { ...(config.filter || {}) }
  for (const [key, value] of Object.entries(config)) {
    if (PARAM_MAP[key] && key !== 'limit') filter[PARAM_MAP[key]] = value
  }
  if (selection.categories?.length) filter.categories = [...selection.categories]
  if (selection.type != null) filter.event_types = [Number(selection.type)]
  if (selection.range) {
    for (const key of ['start', 'end']) {
      if (selection.range[key]) filter[key] = selection.range[key]
      else delete filter[key]
    }
  }
  for (const [key, value] of new URLSearchParams(search)) {
    if (!OVERRIDABLE_PARAMS.has(key)) continue
    filter[key] = key === 'limit' ? Math.max(1, Number.parseInt(value, 10) || 12) : value
  }
  // POST /events/filter expects categories/tags/UUIDs as arrays, venue as a name string.
  for (const key of ['categories', 'tags', 'venue_uuids', 'org_uuids', 'space_uuids']) {
    if (typeof filter[key] === 'string') filter[key] = filter[key].split(',').map(v => v.trim()).filter(Boolean)
  }
  if (Array.isArray(filter.categories)) filter.categories = filter.categories.map(Number).filter(Number.isFinite)
  if (selection.search) filter.search = selection.search
  // Keep every view inside the embedding portal, including venue result lists.
  if (config.filter?.portal) filter.portal = config.filter.portal
  filter.limit = Math.max(1, Number(filter.limit) || 12)
  filter.lang = config.language || 'de'
  return filter
}
