export const PARAM_MAP = {
  limit: 'limit',
  start: 'start',
  end: 'end',
  tags: 'tags',
  venue: 'venue',
  city: 'city',
  categories: 'categories',
  portal: 'portal',
}

export const OVERRIDABLE_PARAMS = new Set([
  'limit',
  'start',
  'end',
  'tags',
  'venue',
  'portal'
])

export const CATEGORIES = [
  { id: 1, label: 'Kultur' },
  { id: 2, label: 'Bildung' },
  { id: 3, label: 'Sport' },
  { id: 4, label: 'Freizeit' },
  { id: 5, label: 'Familie' },
  { id: 6, label: 'Gesellschaft' }
]
