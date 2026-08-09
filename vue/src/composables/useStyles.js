import { shallowRef } from 'vue'

async function fetchCss(path) {
  const resolved = new URL(path, window.location.href)
  const res = await fetch(resolved.toString())
  if (!res.ok) throw new Error(`CSS ${res.status}: ${res.statusText}`)
  return res.text()
}

export default function useStyles() {
  const host = shallowRef(null)
  const styleError = shallowRef('')
  const appendedSheets = []

  function injectStyleElement(cssText) {
    const shadow = host.value?.getRootNode?.()
    if (!shadow || shadow.nodeType !== 11) return
    const style = document.createElement('style')
    style.textContent = cssText
    shadow.appendChild(style)
    appendedSheets.push(style)
  }

  async function applyStyles(paths) {
    styleError.value = ''
    const list = Array.isArray(paths) ? paths : paths ? [paths] : []
    for (const path of list) {
      try {
        const cssText = await fetchCss(path)
        injectStyleElement(cssText)
      } catch (err) {
        styleError.value = `${path}: ${err.message || 'konnte nicht geladen werden'}`
      }
    }
  }

  return {
    host,
    styleError,
    appendedSheets,
    applyStyles
  }
}
