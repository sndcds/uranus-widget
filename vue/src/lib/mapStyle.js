const styles = new Map()

export function resolveStyleResources(style, styleUrl) {
  const resolve = url => new URL(url, styleUrl).href.replace(/%7B/gi, '{').replace(/%7D/gi, '}')
  return {
    ...style,
    ...(style.sprite ? { sprite: Array.isArray(style.sprite)
      ? style.sprite.map(sprite => ({ ...sprite, url: resolve(sprite.url) }))
      : resolve(style.sprite) } : {}),
    ...(style.glyphs ? { glyphs: resolve(style.glyphs) } : {}),
    sources: Object.fromEntries(Object.entries(style.sources || {}).map(([name, source]) => [name, {
      ...source,
      ...(source.url ? { url: resolve(source.url) } : {}),
      ...(source.tiles ? { tiles: source.tiles.map(resolve) } : {}),
    }])),
  }
}

export function loadMapStyle(url) {
  const absolute = new URL(url, window.location.href).href
  if (!styles.has(absolute)) {
    styles.set(absolute, fetch(absolute).then(async response => {
      if (!response.ok) throw new Error(`Map style: HTTP ${response.status}`)
      const style = await response.json()
      if (style.version !== 8 || !Array.isArray(style.layers)) throw new Error('Invalid map style')
      return resolveStyleResources(style, absolute)
    }).catch(error => { styles.delete(absolute); throw error }))
  }
  return styles.get(absolute)
}
