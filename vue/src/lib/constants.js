export const BASE_URL = 'https://api.kulturbytes.de/api/events'
export const DETAIL_URL = (uuid) => `https://api.kulturbytes.de/api/event/${uuid}?lang=de`

export const PARAM_MAP = {
  limit: 'limit',
  tags: 'tags',
  venue: 'venue',
  city: 'city',
  start: 'start',
  end: 'end',
  categories: 'categories'
}

export const CATEGORIES = [
  { id: 1, label: 'Kultur' },
  { id: 2, label: 'Bildung' },
  { id: 3, label: 'Sport' },
  { id: 4, label: 'Freizeit' },
  { id: 5, label: 'Familie' },
  { id: 6, label: 'Gesellschaft' }
]
