const styles = {
  art_gallery: 'cultural_place', cultural_center: 'cultural_place', event_house: 'cultural_place',
  exhibition_hall: 'cultural_place', theatre: 'cultural_place', youth_center: 'cultural_place',
  beach: 'public_area', park: 'public_area', castle: 'historic_site',
  educational_institution: 'education', library: 'education', music_school: 'education',
  museum: 'museum', outdoor_area: 'outdoor_area', playground: 'small_place',
  public_place: 'public_place', sacred_space: 'sacred_space',
}

export const markerFiles = {
  default: 'default.png', cultural_place: 'cultural-place.png', outdoor_area: 'outdoor-area.png',
  public_area: 'public-place.png', public_place: 'public-place.png', sacred_space: 'sacred-space.png',
  city_district: 'city-district.png', historic_site: 'cultural-place.png',
  small_place: 'outdoor-area.png', museum: 'museum.png', education: 'education.png',
}
export const collection = (features = []) => ({ type: 'FeatureCollection', features })
const position = p => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite)
const polygon = p => Array.isArray(p) && p.length > 0 && p.every(ring =>
  Array.isArray(ring) && ring.length >= 4 && ring.every(position))

export function isArea(geometry) {
  return geometry?.type === 'Polygon' ? polygon(geometry.coordinates)
    : geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)
      && geometry.coordinates.length > 0 && geometry.coordinates.every(polygon)
}

export function transformVenues(data) {
  const points = [], buildings = []
  for (const f of Array.isArray(data?.features) ? data.features : []) {
    if (!f?.properties?.uuid || !f.properties.name) continue
    const style = f.properties.marker_style || styles[f.properties.type]
    const properties = { ...f.properties, marker_style: markerFiles[style] ? style : 'default' }
    const point = f.point || f.geometry
    if (point?.type === 'Point' && position(point.coordinates)) {
      points.push({ type: 'Feature', geometry: point, properties })
    }
    if (isArea(f.building)) buildings.push({ type: 'Feature', geometry: f.building, properties })
  }
  return { points: collection(points), buildings: collection(buildings) }
}

export function mapBbox(bounds) {
  // The API expects a non-wrapping envelope within the WGS84 coordinate range.
  const west = bounds.getWest(), east = bounds.getEast()
  return [Math.max(-180, west), Math.max(-85, bounds.getSouth()),
    Math.min(180, east), Math.min(85, bounds.getNorth())].join(',')
}
