// Real-image stickers (Pinterest-style die-cut stickers saved as PNG/JPG).
// Each image gets its flat background removed (unless it already has transparency),
// is trimmed tight to the sticker, and is kept at high resolution.
import { STICKERS, STICKER_MAP } from '../data/stickers'
import { getImage, loadImage } from './assets'

const MAX_SIDE = 1800 // px; plenty for 4K exports, still light on memory

const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// prepared: the file is already a cut-out, trimmed sticker (bundled set) -> no in-browser processing
export function makeImageSticker({ id, name, src, category = 'stickers', custom = false, prepared = false, thumb = null }) {
  return { id, name, src, category, custom, prepared, kind: 'image', tags: ['img:' + category], defaultW: 0.3, w: 1, h: 1, ready: false, preview: thumb }
}

export function registerSticker(def) {
  if (STICKER_MAP[def.id]) return STICKER_MAP[def.id]
  STICKERS.unshift(def)
  STICKER_MAP[def.id] = def
  return def
}
export function unregisterSticker(id) {
  const i = STICKERS.findIndex((s) => s.id === id)
  if (i >= 0) STICKERS.splice(i, 1)
  delete STICKER_MAP[id]
}

/** Bundled stickers: src/assets/stickers/<category>/*.(png|jpg|webp) */
export function discoverStickers() {
  const files = import.meta.glob('../assets/stickers/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}', { eager: true, query: '?url', import: 'default' })
  const thumbs = import.meta.glob('../assets/sticker-thumbs/**/*.webp', { eager: true, query: '?url', import: 'default' })
  Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .reverse()
    .forEach(([path, url]) => {
      const parts = path.split('/')
      const base = parts.pop().replace(/\.[^.]+$/, '')
      const folder = parts[parts.length - 1]
      const category = folder === 'stickers' ? 'stickers' : folder
      const thumb = thumbs[path.replace('/stickers/', '/sticker-thumbs/').replace(/\.[^.]+$/, '.webp')] || null
      // bundled files with a thumbnail were pre-processed offline (cut out, trimmed, die-cut border)
      registerSticker(makeImageSticker({ id: `img-${category}-${base}`, name: titleCase(base), src: url, category, prepared: !!thumb, thumb }))
    })
}

/* ---------------- processing ---------------- */
const processed = new Map() // id -> canvas

function cutout(img) {
  const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.round(img.naturalWidth * k)
  const H = Math.round(img.naturalHeight * k)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, W, H)
  const id = ctx.getImageData(0, 0, W, H)
  const d = id.data
  const at = (x, y) => (y * W + x) * 4

  // already transparent around the edges? keep the artist's own cut.
  const corners = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)]
  const hasAlpha = corners.some((i) => d[i + 3] < 250)

  if (!hasAlpha) {
    // background colour = median of the border pixels
    const rs = [], gs = [], bs = []
    const sample = (x, y) => {
      const i = at(x, y)
      rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2])
    }
    for (let x = 0; x < W; x += 4) sample(x, 0), sample(x, H - 1)
    for (let y = 0; y < H; y += 4) sample(0, y), sample(W - 1, y)
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1]
    const br = med(rs), bgc = med(gs), bb = med(bs)
    const dist = (i) => Math.sqrt((d[i] - br) ** 2 + (d[i + 1] - bgc) ** 2 + (d[i + 2] - bb) ** 2)
    const HARD = 26 // within this: background
    const SOFT = 46 // between HARD and SOFT: anti-aliased edge
    // flood fill from every edge pixel through background-coloured pixels
    const bgMask = new Uint8Array(W * H)
    const stack = []
    const push = (p) => {
      if (!bgMask[p] && dist(p * 4) < HARD) (bgMask[p] = 1), stack.push(p)
    }
    for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x)
    for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1)
    while (stack.length) {
      const p = stack.pop()
      const x = p % W
      if (x > 0) push(p - 1)
      if (x < W - 1) push(p + 1)
      if (p >= W) push(p - W)
      if (p < W * (H - 1)) push(p + W)
    }
    for (let p = 0; p < W * H; p++) {
      const i = p * 4
      if (bgMask[p]) {
        d[i + 3] = 0
        continue
      }
      // soften pixels that touch the removed background
      const x = p % W
      const nearBg = (x > 0 && bgMask[p - 1]) || (x < W - 1 && bgMask[p + 1]) || (p >= W && bgMask[p - W]) || (p < W * (H - 1) && bgMask[p + W])
      if (nearBg) {
        const t = Math.min(1, Math.max(0, (dist(i) - HARD) / (SOFT - HARD)))
        d[i + 3] = Math.round(d[i + 3] * (0.35 + 0.65 * t))
      }
    }
    ctx.putImageData(id, 0, 0)
  }

  // trim to the visible sticker
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (d[at(x, y) + 3] > 12) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  if (x1 < 0) return c
  const pad = Math.round(Math.max(W, H) * 0.01)
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad)
  x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad)
  const out = document.createElement('canvas')
  out.width = x1 - x0 + 1
  out.height = y1 - y0 + 1
  out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height)
  return out
}

function finish(def, img) {
  const c = cutout(img)
  processed.set(def.id, c)
  def.w = c.width
  def.h = c.height
  def.ready = true
  def.preview = c.toDataURL('image/png')
  return c
}

/** Synchronous accessor for the renderer (null until the image has loaded). */
function usePrepared(def, img) {
  def.w = img.naturalWidth
  def.h = img.naturalHeight
  def.ready = true
  return img
}

export function getStickerCanvas(def) {
  const hit = processed.get(def.id)
  if (hit) return hit
  const img = getImage('sti:' + def.src, def.src)
  if (!img) return null
  return def.prepared ? usePrepared(def, img) : finish(def, img)
}

export async function prepareSticker(def) {
  if (processed.has(def.id)) return processed.get(def.id)
  const img = await loadImage('sti:' + def.src, def.src)
  if (def.prepared) return usePrepared(def, img)
  return processed.get(def.id) || finish(def, img)
}
