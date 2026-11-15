// "Magic outline": finds the main subject of the photo, traces a hand-drawn line around it
// and scatters little doodles (sparkles, hearts, stars, swirls, rays) in the background.
import { mulberry32 } from './random'

export const DOODLES = [
  { id: 'none', name: 'None' },
  { id: 'outline', name: 'Outline' },
  { id: 'sketch', name: 'Sketch' },
  { id: 'rays', name: 'Sunburst' },
  { id: 'sparkle', name: 'Sparkles only' },
]
export const DOODLE_COLORS = ['#ffffff', '#f6c1cf', '#fff1d6', '#e9b949', '#d98fa3']

const cache = new WeakMap() // filtered photo canvas -> { mask, [style|color]: overlay }
const mk = (w, h) => {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

/* ---------- subject detection (colour contrast vs the photo's edges + centre bias) ---------- */
function subjectMask(src) {
  const k = 220 / Math.max(src.width, src.height)
  const w = Math.max(8, Math.round(src.width * k))
  const h = Math.max(8, Math.round(src.height * k))
  const c = mk(w, h)
  const x = c.getContext('2d', { willReadFrequently: true })
  x.filter = 'blur(1.5px)'
  x.drawImage(src, 0, 0, w, h)
  const d = x.getImageData(0, 0, w, h).data
  const border = []
  for (let i = 0; i < w; i++) border.push(i, (h - 1) * w + i)
  for (let j = 0; j < h; j++) border.push(j * w, j * w + w - 1)
  const step = Math.max(1, Math.floor(border.length / 56))
  const S = []
  for (let i = 0; i < border.length; i += step) S.push([d[border[i] * 4], d[border[i] * 4 + 1], d[border[i] * 4 + 2]])
  const v = new Float32Array(w * h)
  let max = 1
  for (let y = 0; y < h; y++)
    for (let xx = 0; xx < w; xx++) {
      const p = y * w + xx
      const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2]
      let m = Infinity
      for (const s of S) {
        const q = (r - s[0]) ** 2 + (g - s[1]) ** 2 + (b - s[2]) ** 2
        if (q < m) m = q
      }
      const dx = (xx / w - 0.5) * 2, dy = (y / h - 0.5) * 2
      const val = Math.sqrt(m) * (1 - 0.4 * Math.min(1, dx * dx + dy * dy))
      v[p] = val
      if (val > max) max = val
    }
  // Otsu threshold
  const hist = new Float64Array(256)
  for (let p = 0; p < v.length; p++) hist[Math.min(255, Math.round((v[p] / max) * 255))]++
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sB = 0, wB = 0, best = 0, thr = 128
  for (let i = 0; i < 256; i++) {
    wB += hist[i]
    if (!wB) continue
    const wF = v.length - wB
    if (!wF) break
    sB += i * hist[i]
    const mB = sB / wB, mF = (sum - sB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > best) (best = between), (thr = i)
  }
  let m = new Uint8Array(w * h)
  for (let p = 0; p < v.length; p++) m[p] = (v[p] / max) * 255 > thr ? 1 : 0
  const morph = (src, erode) => {
    const out = new Uint8Array(w * h)
    for (let y = 0; y < h; y++)
      for (let xx = 0; xx < w; xx++) {
        let any = erode ? 1 : 0
        for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++)
          for (let x2 = Math.max(0, xx - 1); x2 <= Math.min(w - 1, xx + 1); x2++) {
            const b = src[yy * w + x2]
            if (erode && !b) any = 0
            if (!erode && b) any = 1
          }
        out[y * w + xx] = any
      }
    return out
  }
  m = morph(morph(m, true), false)
  // largest connected part
  const lab = new Int32Array(w * h)
  let bestId = 0, bestN = 0, id = 0
  for (let p = 0; p < m.length; p++) {
    if (!m[p] || lab[p]) continue
    id++
    let n = 0
    const st = [p]
    lab[p] = id
    while (st.length) {
      const q = st.pop()
      n++
      const qx = q % w
      for (const r of [qx > 0 ? q - 1 : -1, qx < w - 1 ? q + 1 : -1, q - w, q + w])
        if (r >= 0 && r < m.length && m[r] && !lab[r]) (lab[r] = id), st.push(r)
    }
    if (n > bestN) (bestN = n), (bestId = id)
  }
  // fill holes inside the subject
  const out = new Uint8Array(w * h)
  for (let p = 0; p < m.length; p++) out[p] = lab[p] === bestId ? 1 : 0
  const outside = new Uint8Array(w * h)
  const st = []
  for (const p of border) if (!out[p] && !outside[p]) (outside[p] = 1), st.push(p)
  while (st.length) {
    const q = st.pop()
    const qx = q % w
    for (const r of [qx > 0 ? q - 1 : -1, qx < w - 1 ? q + 1 : -1, q - w, q + w])
      if (r >= 0 && r < out.length && !out[r] && !outside[r]) (outside[r] = 1), st.push(r)
  }
  let area = 0, cx = 0, cy = 0, x0 = w, x1 = 0, y0 = h, y1 = 0
  const img = x.createImageData(w, h)
  for (let p = 0; p < out.length; p++) {
    if (outside[p]) continue
    area++
    const px = p % w, py = (p - px) / w
    cx += px; cy += py
    if (px < x0) x0 = px
    if (px > x1) x1 = px
    if (py < y0) y0 = py
    if (py > y1) y1 = py
    img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = img.data[p * 4 + 3] = 255
  }
  const frac = area / (w * h)
  if (frac < 0.06 || frac > 0.8) return null
  // only trust a subject that clearly stands out from its surroundings
  let inS = 0, outS = 0
  for (let p = 0; p < v.length; p++) outside[p] ? (outS += v[p]) : (inS += v[p])
  const sep = inS / area / (outS / Math.max(1, v.length - area) || 1)
  if (sep < 2.4) return null
  const mc = mk(w, h)
  mc.getContext('2d').putImageData(img, 0, 0)
  return { canvas: mc, cx: cx / area / w, cy: cy / area / h, rx: (x1 - x0) / 2 / w, ry: (y1 - y0) / 2 / h }
}

/* ---------- little doodles ---------- */
function sparkle(c, x, y, r) {
  c.beginPath()
  c.moveTo(x, y - r)
  c.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x + r, y)
  c.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x, y + r)
  c.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x - r, y)
  c.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x, y - r)
  c.fill()
}
function heart(c, x, y, r) {
  c.beginPath()
  c.moveTo(x, y + r * 0.85)
  c.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35)
  c.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.85)
  c.stroke()
}
function star(c, x, y, r) {
  c.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.45 : r
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  c.closePath()
  c.fill()
}
function swirl(c, x, y, r) {
  c.beginPath()
  for (let t = 0; t < Math.PI * 4; t += 0.2) c.lineTo(x + Math.cos(t) * r * (t / (Math.PI * 4)), y + Math.sin(t) * r * (t / (Math.PI * 4)))
  c.stroke()
}
function rays(c, x, y, r, a0) {
  for (let i = -1; i <= 1; i++) {
    const a = a0 + i * 0.35
    c.beginPath()
    c.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4)
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    c.stroke()
  }
}

function buildOverlay(W, H, mask, style, color) {
  const R = Math.min(1, 900 / Math.max(W, H))
  const ow = Math.round(W * R), oh = Math.round(H * R)
  const s = Math.min(ow, oh)
  const out = mk(ow, oh)
  const o = out.getContext('2d')
  const rng = mulberry32(11)
  let keepOut = null
  if (mask && style !== 'sparkle') {
    // smooth, full-resolution subject shape
    const sm = mk(ow, oh)
    const sc = sm.getContext('2d', { willReadFrequently: true })
    sc.imageSmoothingQuality = 'high'
    sc.drawImage(mask.canvas, 0, 0, ow, oh)
    const id = sc.getImageData(0, 0, ow, oh)
    for (let i = 3; i < id.data.length; i += 4) id.data[i] = id.data[i] > 127 ? 255 : 0
    sc.putImageData(id, 0, 0)
    const dil = (r) => {
      const c = mk(ow, oh)
      const cc = c.getContext('2d')
      cc.drawImage(sm, 0, 0)
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2
        cc.drawImage(sm, Math.cos(a) * r, Math.sin(a) * r)
      }
      return c
    }
    const gap = s * (style === 'outline' ? 0.012 : 0.03)
    const thick = s * (style === 'outline' ? 0.009 : 0.008)
    const ring = dil(gap + thick)
    const rc = ring.getContext('2d')
    rc.globalCompositeOperation = 'destination-out'
    rc.drawImage(dil(gap), 0, 0)
    if (style !== 'outline') {
      // break the line into hand-drawn strokes
      const wedge = mk(ow, oh)
      const wc = wedge.getContext('2d')
      const cx = mask.cx * ow, cy = mask.cy * oh
      let a = rng() * Math.PI * 2
      const end = a + Math.PI * 2
      while (a < end) {
        const len = 0.3 + rng() * 0.45
        wc.beginPath()
        wc.moveTo(cx, cy)
        wc.arc(cx, cy, s * 3, a, Math.min(end, a + len))
        wc.closePath()
        wc.fill()
        a += len + 0.14 + rng() * 0.16
      }
      rc.globalCompositeOperation = 'destination-in'
      rc.drawImage(wedge, 0, 0)
    }
    rc.globalCompositeOperation = 'source-in'
    rc.fillStyle = color
    rc.fillRect(0, 0, ow, oh)
    o.save()
    o.shadowColor = 'rgba(0,0,0,0.22)'
    o.shadowBlur = s * 0.008
    o.drawImage(ring, 0, 0)
    o.restore()
    keepOut = dil(s * 0.07).getContext('2d').getImageData(0, 0, ow, oh).data
  }
  // scattered doodles, kept off the subject
  o.fillStyle = color
  o.strokeStyle = color
  o.lineWidth = Math.max(1.5, s * 0.006)
  o.lineCap = 'round'
  o.lineJoin = 'round'
  o.shadowColor = 'rgba(0,0,0,0.18)'
  o.shadowBlur = s * 0.006
  const free = (x, y) => {
    if (x < s * 0.05 || y < s * 0.05 || x > ow - s * 0.05 || y > oh - s * 0.05) return false
    if (keepOut) return keepOut[(Math.round(y) * ow + Math.round(x)) * 4 + 3] === 0
    return Math.hypot(x / ow - 0.5, y / oh - 0.5) > 0.28
  }
  if (style === 'rays' && mask) {
    const cx = mask.cx * ow, cy = mask.cy * oh
    const rx = mask.rx * ow * 1.25, ry = mask.ry * oh * 1.2
    o.lineWidth = Math.max(2, s * 0.012)
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rng() * 0.1
      const r0 = 1.02 + rng() * 0.08
      o.beginPath()
      o.moveTo(cx + Math.cos(a) * rx * r0, cy + Math.sin(a) * ry * r0)
      o.lineTo(cx + Math.cos(a) * rx * (r0 + 0.1), cy + Math.sin(a) * ry * (r0 + 0.1))
      o.stroke()
    }
    o.lineWidth = Math.max(1.5, s * 0.006)
  }
  const kinds = style === 'sketch' ? ['heart', 'swirl', 'heart', 'sparkle'] : style === 'rays' ? ['dot', 'sparkle', 'heart'] : ['sparkle', 'star', 'heart', 'sparkle', 'rays']
  const n = style === 'sparkle' ? 16 : 11
  let placed = 0
  for (let tries = 0; placed < n && tries < 400; tries++) {
    const x = rng() * ow, y = rng() * oh
    if (!free(x, y)) continue
    const k = kinds[placed % kinds.length]
    const r = s * (0.014 + rng() * 0.02)
    if (k === 'sparkle') sparkle(o, x, y, r * 1.3)
    else if (k === 'star') star(o, x, y, r)
    else if (k === 'heart') heart(o, x, y, r * 0.9)
    else if (k === 'swirl') swirl(o, x, y, r * 1.1)
    else if (k === 'rays') rays(o, x, y, r * 1.6, -Math.PI / 2 + (rng() - 0.5))
    else {
      o.beginPath()
      o.arc(x, y, r * 0.35, 0, Math.PI * 2)
      o.fill()
    }
    placed++
  }
  return out
}

/** Draws the magic outline for one photo slot. `fp` is the filtered photo canvas for that slot. */
export function drawDoodle(ctx, fp, S, opts) {
  if (!opts?.style || opts.style === 'none') return
  let e = cache.get(fp)
  if (!e) cache.set(fp, (e = {}))
  if (!('mask' in e)) e.mask = subjectMask(fp)
  const key = opts.style + '|' + (opts.color || '#ffffff')
  if (!e[key]) e[key] = buildOverlay(fp.width, fp.height, e.mask, opts.style, opts.color || '#ffffff')
  ctx.drawImage(e[key], S.x, S.y, S.w, S.h)
}
