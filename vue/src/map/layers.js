import { widgetAsset } from '../lib/assets'
import { collection, markerFiles } from '../lib/mapData'

export async function addVenueLayers(map, { buildings = true } = {}) {
  await Promise.all(Object.entries(markerFiles).map(async ([name, file]) => {
    const image = await map.loadImage(widgetAsset(`map/markers/${file}`))
    if (!map.hasImage(name)) map.addImage(name, image.data, { pixelRatio: 2 })
  }))
  map.addSource('uw-venues', { type: 'geojson', data: collection(), cluster: true, clusterRadius: 50, clusterMaxZoom: 14 })
  if (buildings) {
    map.addSource('uw-buildings', { type: 'geojson', data: collection() })
    map.addLayer({ id: 'uw-buildings-fill', type: 'fill', source: 'uw-buildings', paint: {
      'fill-color': '#243f6e', 'fill-opacity': 0.5,
    } })
    map.addLayer({ id: 'uw-buildings-outline', type: 'line', source: 'uw-buildings', paint: {
      'line-color': '#243f6e', 'line-opacity': 1, 'line-width': 2,
    } })
  }
  map.addLayer({ id: 'uw-clusters', type: 'circle', source: 'uw-venues', filter: ['has', 'point_count'], paint: {
    'circle-color': '#ffffff', 'circle-radius': 16, 'circle-stroke-width': 2, 'circle-stroke-color': '#243f6e',
  } })
  map.addLayer({ id: 'uw-cluster-count', type: 'symbol', source: 'uw-venues', filter: ['has', 'point_count'],
    layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 14, 'text-allow-overlap': true, 'text-font': ['noto_sans_regular'] },
    paint: { 'text-color': '#243f6e' },
  })
  const unclustered = ['!', ['has', 'point_count']]
  map.addLayer({ id: 'uw-markers', type: 'symbol', source: 'uw-venues', filter: unclustered, layout: {
    'icon-image': ['get', 'marker_style'], 'icon-size': 2, 'icon-anchor': 'bottom',
    'icon-allow-overlap': true, 'icon-ignore-placement': true,
  } })
  map.addLayer({ id: 'uw-labels', type: 'symbol', source: 'uw-venues', filter: unclustered, minzoom: 12,
    layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 0.5], 'text-anchor': 'top', 'text-font': ['noto_sans_regular'] },
    paint: { 'text-color': '#243f6e', 'text-halo-color': '#ffffff', 'text-halo-width': 1 },
  })
}
