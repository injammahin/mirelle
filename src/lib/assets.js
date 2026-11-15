// Tiny image cache shared by the live canvas, thumbnails and exporter.
const cache = new Map() // key -> { img, status, promise }
const listeners = new Set()

export const onAssetLoaded = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const notify = () => listeners.forEach((fn) => fn())

export const svgToDataUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

export function loadImage(key, src) {
  const existing = cache.get(key)
  if (existing) return existing.promise
  const img = new Image()
  img.decoding = 'async'
  if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous'
  const entry = { img, status: 'loading', promise: null }
  entry.promise = new Promise((resolve, reject) => {
    img.onload = () => {
      entry.status = 'ready'
      notify()
      resolve(img)
    }
    img.onerror = (e) => {
      entry.status = 'error'
      reject(e)
    }
  })
  cache.set(key, entry)
  img.src = src
  return entry.promise
}

/** Returns the image synchronously if ready, otherwise starts loading and returns null. */
export function getImage(key, src) {
  const e = cache.get(key)
  if (e) return e.status === 'ready' ? e.img : null
  if (src) loadImage(key, src).catch(() => {})
  return null
}

export function getSvgImage(key, svg) {
  const e = cache.get(key)
  if (e) return e.status === 'ready' ? e.img : null
  loadImage(key, svgToDataUrl(svg)).catch(() => {})
  return null
}

export const loadSvgImage = (key, svg) => loadImage(key, svgToDataUrl(svg))
