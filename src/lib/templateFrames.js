// Real-image photo frames ("templates"): any Pinterest-style picture with an empty card in it.
// The empty card (slot) is detected automatically, and anything that overlaps the card from
// outside (flowers, tape, torn edges) is cut out into an overlay that is drawn over the photo.
import { loadImage, getImage } from './assets'

const ANALYSIS_MAX = 1200 // px on the long side for slot + overlay analysis

/* ---------------- registry helpers ---------------- */
const titleCase = (s) => s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Per-file tweaks. Key = file name without extension.
//  slot: [x, y, w, h] as fractions of the image   style: 'print' adds a white border + shadow
export const TEMPLATE_OVERRIDES = {
  'bougainvillea-wall': { slot: [0.2, 0.43, 0.6, 0.42], style: 'print' },
}

/** Frame entries for every image in src/assets/frames/<category>/*.(jpg|png|webp) */
export function discoverTemplates() {
  const files = import.meta.glob('../assets/frames/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' })
  // Frames generated offline ship their exact photo slot + the flower layer that sits over the photo.
  const metas = import.meta.glob('../assets/frame-meta/**/*.json', { eager: true, import: 'default' })
  const overlays = import.meta.glob('../assets/frame-overlays/**/*.webp', { eager: true, query: '?url', import: 'default' })
  // small pre-rendered previews (frame + a matching portrait) for galleries: no canvas work needed
  const previews = import.meta.glob('../assets/frame-previews/**/*.webp', { eager: true, query: '?url', import: 'default' })
  return Object.entries(files)
    .map(([path, url]) => {
      const parts = path.split('/')
      const file = parts.pop()
      const base = file.replace(/\.[^.]+$/, '')
      const folder = parts[parts.length - 1]
      const category = folder === 'frames' ? 'pinterest' : folder
      const meta = metas[`../assets/frame-meta/${folder}/${base}.json`]
      const overlaySrc = overlays[`../assets/frame-overlays/${folder}/${base}.webp`] || null
      const preview = previews[`../assets/frame-previews/${folder}/${base}.webp`] || null
      return { ...makeTemplateFrame({ id: 'tpl-' + category + '-' + base, name: meta?.name || titleCase(base), src: url, category, override: TEMPLATE_OVERRIDES[base], meta, overlaySrc }), preview }
    })
    // hand-picked originals first, then generated frames in catalogue order
    .sort((a, b) => (!!a.meta - !!b.meta) || (a.meta?.order ?? 0) - (b.meta?.order ?? 0) || a.name.localeCompare(b.name))
}

export const makeTemplateFrame = ({ id, name, src, category = 'pinterest', override, custom = false, meta = null, overlaySrc = null }) => ({
  id,
  name,
  family: 'tpl:' + category,
  category,
  kind: 'template',
  src,
  override,
  custom,
  meta,
  overlaySrc,
  hasCaption: false,
})

/* ---------------- analysis ---------------- */
const cache = new Map() // src -> analysis

const dist2 = (d, i, r, g, b) => {
  const dr = d[i] - r
  const dg = d[i + 1] - g
  const db = d[i + 2] - b
  return dr * dr + dg * dg + db * db
}

function boxBlur(d, w, h) {
  const out = new Uint8ClampedArray(d.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, n = 0
      for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++)
        for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) {
          const j = (yy * w + xx) * 4
          r += d[j]; g += d[j + 1]; b += d[j + 2]; n++
        }
      const i = (y * w + x) * 4
      out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = 255
    }
  return out
}

function median(vals) {
  vals.sort((a, b) => a - b)
  return vals[vals.length >> 1]
}

/** Find the empty card: flood-fill from the centre at decreasing tolerances, keep the first clean rectangle. */
function detectSlot(img) {
  const w = 180
  const h = Math.round((w * img.naturalHeight) / img.naturalWidth)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  let d = ctx.getImageData(0, 0, w, h).data
  d = boxBlur(boxBlur(d, w, h), w, h)
  const rs = [], gs = [], bs = []
  for (let y = Math.round(h * 0.4); y < h * 0.6; y++)
    for (let x = Math.round(w * 0.4); x < w * 0.6; x++) {
      const i = (y * w + x) * 4
      rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2])
    }
  const ref = [median(rs), median(gs), median(bs)]
  // Try every tolerance and keep the most rectangular region (leaks into a similar
  // background make the region less rectangular); near-ties go to the larger tolerance.
  const found = []
  for (const T of [44, 36, 29, 23, 18, 14, 11, 8, 6]) {
    const T2 = T * T
    const mask = new Uint8Array(w * h)
    const stack = []
    for (let y = Math.round(h * 0.42); y < h * 0.58; y += 2)
      for (let x = Math.round(w * 0.42); x < w * 0.58; x += 2) {
        const p = y * w + x
        if (dist2(d, p * 4, ...ref) < T2) (mask[p] = 1), stack.push(p)
      }
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p - x) / w
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of nb) if (q >= 0 && !mask[q] && dist2(d, q * 4, ...ref) < T2) (mask[q] = 1), stack.push(q)
    }
    const rows = new Array(h).fill(0)
    const cols = new Array(w).fill(0)
    let count = 0
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) rows[y]++, cols[x]++, count++
    const rmax = Math.max(...rows)
    const cmax = Math.max(...cols)
    const y0 = rows.findIndex((v) => v > rmax * 0.5)
    const y1 = h - 1 - [...rows].reverse().findIndex((v) => v > rmax * 0.5)
    const x0 = cols.findIndex((v) => v > cmax * 0.5)
    const x1 = w - 1 - [...cols].reverse().findIndex((v) => v > cmax * 0.5)
    const area = (x1 - x0 + 1) * (y1 - y0 + 1)
    let inside = 0
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) inside += mask[y * w + x]
    const frac = area / (w * h)
    const ratio = inside / area
    if (frac > 0.06 && frac < 0.8 && ratio > 0.7) found.push({ slot: [x0 / w, y0 / h, (x1 - x0 + 1) / w, (y1 - y0 + 1) / h], ref, T, ratio })
  }
  if (!found.length) return { slot: [0.2, 0.25, 0.6, 0.5], ref, T: 20 }
  const best = Math.max(...found.map((f) => f.ratio))
  return found.find((f) => f.ratio >= best - 0.015)
}

/** Build the overlay: non-card pixels inside the slot that touch the slot border (flowers, tape, torn rim). */
function buildOverlay(img, slot, ref, T) {
  const k = Math.min(1, ANALYSIS_MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.round(img.naturalWidth * k)
  const H = Math.round(img.naturalHeight * k)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, W, H)
  const id = ctx.getImageData(0, 0, W, H)
  const src = id.data
  // refine edges at this resolution: walk each edge until the line is mostly card-coloured
  let x0 = Math.round(slot[0] * W), y0 = Math.round(slot[1] * H)
  let x1 = Math.round((slot[0] + slot[2]) * W), y1 = Math.round((slot[1] + slot[3]) * H)
  const T2 = (T * 1.25) ** 2
  const card = (i) => dist2(src, i, ...ref) < T2
  const rowFrac = (y) => { let n = 0, m = 0; for (let x = x0 + ((x1 - x0) >> 3); x < x1 - ((x1 - x0) >> 3); x += 2) (m++, (n += card((y * W + x) * 4)))
    return n / m }
  const colFrac = (x) => { let n = 0, m = 0; for (let y = y0 + ((y1 - y0) >> 3); y < y1 - ((y1 - y0) >> 3); y += 2) (m++, (n += card((y * W + x) * 4)))
    return n / m }
  const R = Math.round(W * 0.012)
  const scan = (v, dir, fn, lo, hi) => { let best = v; for (let t = -R; t <= R; t++) { const q = v + t * dir; if (q < lo || q > hi) continue; if (fn(q) > 0.55) { best = q; break } } return best }
  y0 = scan(y0, 1, rowFrac, 0, H - 1)
  y1 = scan(y1, -1, rowFrac, 0, H - 1)
  x0 = scan(x0, 1, colFrac, 0, W - 1)
  x1 = scan(x1, -1, colFrac, 0, W - 1)
  const inset = Math.max(1, Math.round(W * 0.004))
  x0 += inset; y0 += inset; x1 -= inset; y1 -= inset
  const sw = x1 - x0 + 1
  const sh = y1 - y0 + 1
  // classify inside slot on a lightly blurred copy
  const sub = ctx.getImageData(x0, y0, sw, sh)
  const bl = boxBlur(sub.data, sw, sh)
  const not = new Uint8Array(sw * sh)
  for (let p = 0; p < sw * sh; p++) not[p] = dist2(bl, p * 4, ...ref) >= T2 ? 1 : 0
  const keep = new Uint8Array(sw * sh)
  const stack = []
  const seed = (p) => { if (not[p] && !keep[p]) (keep[p] = 1), stack.push(p) }
  for (let x = 0; x < sw; x++) seed(x), seed((sh - 1) * sw + x)
  for (let y = 0; y < sh; y++) seed(y * sw), seed(y * sw + sw - 1)
  while (stack.length) {
    const p = stack.pop()
    const x = p % sw
    const y = (p - x) / sw
    if (x > 0) seed(p - 1)
    if (x < sw - 1) seed(p + 1)
    if (y > 0) seed(p - sw)
    if (y < sh - 1) seed(p + sw)
  }
  // ignore thin speckle along the border (paper texture): drop pixels whose 5x5 neighbourhood is mostly empty
  const out = ctx.createImageData(W, H)
  const o = out.data
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++) {
      let n = 0, m = 0
      for (let yy = Math.max(0, y - 1); yy <= Math.min(sh - 1, y + 1); yy++)
        for (let xx = Math.max(0, x - 1); xx <= Math.min(sw - 1, x + 1); xx++) (m++, (n += keep[yy * sw + xx]))
      if (!n) continue
      const gi = ((y + y0) * W + (x + x0)) * 4
      o[gi] = src[gi]; o[gi + 1] = src[gi + 1]; o[gi + 2] = src[gi + 2]
      o[gi + 3] = Math.round((n / m) * 255)
    }
  const ov = document.createElement('canvas')
  ov.width = W
  ov.height = H
  ov.getContext('2d').putImageData(out, 0, 0)
  return { overlay: ov, slot: [x0 / W, y0 / H, sw / W, sh / H] }
}

function analyse(frame, img) {
  const o = frame.override || {}
  if (o.slot) return { img, slot: o.slot, overlay: null, style: o.style, aspect: img.naturalWidth / img.naturalHeight }
  const { slot, ref, T } = detectSlot(img)
  const r = buildOverlay(img, slot, ref, T)
  return { img, slot: r.slot, overlay: r.overlay, style: o.style, aspect: img.naturalWidth / img.naturalHeight }
}

/**
 * Many saved pins carry a flat border (screenshot margins, grey mat). Trim any uniform
 * band on each side so the design reaches the edges of the canvas.
 */
function trimBorders(img) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const w = 200
  const h = Math.round((w * ih) / iw)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const d = ctx.getImageData(0, 0, w, h).data
  const px = (x, y) => (y * w + x) * 4
  const flat = (cells) => {
    // a line is "border" when every sample is close to the line's first pixel and low-texture
    const [x0, y0] = cells[0]
    const i0 = px(x0, y0)
    return cells.every(([x, y]) => dist2(d, px(x, y), d[i0], d[i0 + 1], d[i0 + 2]) < 22 * 22)
  }
  const row = (y) => Array.from({ length: w }, (_, x) => [x, y])
  const col = (x) => Array.from({ length: h }, (_, y) => [x, y])
  let t = 0, b = h - 1, l = 0, r = w - 1
  while (t < h * 0.2 && flat(row(t))) t++
  while (b > h * 0.8 && flat(row(b))) b--
  while (l < w * 0.2 && flat(col(l))) l++
  while (r > w * 0.8 && flat(col(r))) r--
  if (!t && !l && b === h - 1 && r === w - 1) return img
  const pad = 1 // step one more sample inside to drop the anti-aliased seam
  const sx = Math.round(((l ? l + pad : 0) / w) * iw)
  const sy = Math.round(((t ? t + pad : 0) / h) * ih)
  const ex = Math.round(((r < w - 1 ? r - pad + 1 : w) / w) * iw)
  const ey = Math.round(((b < h - 1 ? b - pad + 1 : h) / h) * ih)
  const out = document.createElement('canvas')
  out.width = ex - sx
  out.height = ey - sy
  out.getContext('2d').drawImage(img, sx, sy, out.width, out.height, 0, 0, out.width, out.height)
  out.naturalWidth = out.width // so the rest of the pipeline treats it like an <img>
  out.naturalHeight = out.height
  return out
}

/** Synchronous accessor used by the renderer: returns null (and starts loading) until ready. */
export function getTemplate(frame) {
  const hit = cache.get(frame.src)
  if (hit) return hit
  const raw = getImage('tpl:' + frame.src, frame.src)
  if (!raw) return null
  if (frame.meta) {
    // pre-built frame: exact slot from metadata, overlay image instead of analysis
    const ov = frame.overlaySrc ? getImage('tplo:' + frame.overlaySrc, frame.overlaySrc) : null
    if (frame.overlaySrc && !ov) return null
    const a = { img: raw, slot: frame.meta.slot, overlay: ov, style: frame.meta.style || null, aspect: raw.naturalWidth / raw.naturalHeight }
    cache.set(frame.src, a)
    return a
  }
  const a = analyse(frame, trimBorders(raw))
  cache.set(frame.src, a)
  return a
}

export async function loadTemplate(frame) {
  await Promise.all([loadImage('tpl:' + frame.src, frame.src), frame.overlaySrc ? loadImage('tplo:' + frame.overlaySrc, frame.overlaySrc) : null])
  return getTemplate(frame)
}

/* ---------------- rendering ---------------- */
function placement(t, W, H) {
  const iw = t.img.naturalWidth
  const ih = t.img.naturalHeight
  const k = Math.max(W / iw, H / ih)
  return { k, ox: (W - iw * k) / 2, oy: (H - ih * k) / 2, dw: iw * k, dh: ih * k }
}

export function templateLayout(frame, W, H) {
  const t = getTemplate(frame)
  if (!t) return { x: W * 0.15, y: H * 0.15, w: W * 0.7, h: H * 0.7, shape: 'rect', pending: true }
  const p = placement(t, W, H)
  const toL = (sl, shape) => {
    const [sx, sy, sw, sh] = sl
    const L = { x: p.ox + sx * p.dw, y: p.oy + sy * p.dh, w: sw * p.dw, h: sh * p.dh, shape: shape || 'rect' }
    if (L.shape === 'rounded') L.radius = Math.min(L.w, L.h) * 0.06
    return L
  }
  const slots = frame.meta?.slots
  if (slots?.length) {
    const all = slots.map((s) => toL(s.slot, s.shape))
    return { ...all[0], slots: all }
  }
  return toL(t.slot)
}

export function drawTemplateBack(ctx, frame, W, H, L) {
  const t = getTemplate(frame)
  if (!t) {
    ctx.fillStyle = '#efe8dc'
    ctx.fillRect(0, 0, W, H)
    return
  }
  const p = placement(t, W, H)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(t.img, p.ox, p.oy, p.dw, p.dh)
  if (t.style === 'print') {
    const s = Math.min(W, H)
    const b = s * 0.03
    ctx.save()
    ctx.shadowColor = 'rgba(40,30,30,0.35)'
    ctx.shadowBlur = s * 0.04
    ctx.shadowOffsetY = s * 0.015
    ctx.fillStyle = '#fbfaf7'
    ctx.fillRect(L.x - b, L.y - b, L.w + 2 * b, L.h + 2 * b)
    ctx.restore()
  }
}

export function drawTemplateFront(ctx, frame, W, H) {
  const t = getTemplate(frame)
  if (!t?.overlay) return
  const p = placement(t, W, H)
  ctx.save()
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(t.overlay, p.ox, p.oy, p.dw, p.dh)
  ctx.restore()
}

/** Nearest supported canvas aspect for a template. */
export function templateAspect(frame) {
  const t = getTemplate(frame)
  const r = t ? t.aspect : 9 / 16
  const opts = [['1:1', 1], ['4:5', 0.8], ['9:16', 0.5625]]
  return opts.reduce((a, b) => (Math.abs(b[1] - r) < Math.abs(a[1] - r) ? b : a))[0]
}
