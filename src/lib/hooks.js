import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { onAssetLoaded, loadImage } from './assets'
import { loadAllFonts } from '../data/fonts'

let assetVersion = 0
onAssetLoaded(() => {
  assetVersion++
})
const subscribeAssets = (cb) => onAssetLoaded(cb)
export const useAssetsVersion = () => useSyncExternalStore(subscribeAssets, () => assetVersion)

let fontsVersion = 0
const fontListeners = new Set()
if (typeof window !== 'undefined') {
  loadAllFonts().then(() => {
    fontsVersion++
    fontListeners.forEach((f) => f())
  })
}
export const useFontsVersion = () =>
  useSyncExternalStore(
    (cb) => {
      fontListeners.add(cb)
      return () => fontListeners.delete(cb)
    },
    () => fontsVersion,
  )

export function useImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    let alive = true
    if (!src) return setImg(null)
    loadImage(src, src)
      .then((i) => alive && setImg(i))
      .catch(() => alive && setImg(null))
    return () => {
      alive = false
    }
  }, [src])
  return img
}

export function useElementSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export function useMediaQuery(q) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [q])
  return m
}

export function useDebounced(value, ms = 200) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
