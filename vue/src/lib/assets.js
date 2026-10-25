// Capture the embedding script while it executes; later callbacks have no currentScript.
const scriptUrl = typeof document !== 'undefined' ? document.currentScript?.src : null
const baseUrl = scriptUrl ? new URL('.', scriptUrl).href : null

export function widgetAsset(path) {
  return baseUrl ? new URL(path, baseUrl).href : new URL(`/${path}`, window.location.href).href
}

let enginePromise
export function loadMapEngine() {
  if (!enginePromise) {
    const url = import.meta.env.DEV ? '/src/map/engine.js' : widgetAsset('uranus-widget-map.js')
    enginePromise = import(/* @vite-ignore */ url).catch(error => {
      enginePromise = null
      throw error
    })
  }
  return enginePromise
}
