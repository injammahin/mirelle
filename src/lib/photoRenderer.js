// Mirelle photo engine — one renderer for the live canvas, thumbnails and exports,
// so what you see is exactly what you download.
import { getSvgImage } from './assets'
import { STICKER_MAP } from '../data/stickers'
import { fontString } from '../data/fonts'
import { mulberry32 } from './random'
import { FRAME_MAP } from '../data/frames'
import { getStickerCanvas } from './imageStickers'
import { templateLayout, drawTemplateBack, drawTemplateFront } from './templateFrames'

export function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

/* ---------------- shared geometry helpers ---------------- */
export function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function tornRectPath(ctx, { x, y, w, h }, seed = 3, amp) {
  const rng = mulberry32(seed)
  const s = Math.min(w, h)
  amp = amp ?? s * 0.016
  const step = s * 0.022
  const j = () => (rng() - 0.5) * 2 * amp
  ctx.moveTo(x + j() * 0.3, y + j())
  for (let px = x + step; px < x + w; px += step) ctx.lineTo(px, y + j())
  for (let py = y; py < y + h; py += step) ctx.lineTo(x + w + j() * 0.4, py)
  for (let px = x + w; px > x; px -= step) ctx.lineTo(px, y + h + j())
  for (let py = y + h; py > y; py -= step) ctx.lineTo(x + j() * 0.4, py)
  ctx.closePath()
}

/* ---------------- frame layout ---------------- */
export function getFrameLayout(frameId, W, H) {
  const s = Math.min(W, H)
  const fr = FRAME_MAP[frameId]
  if (fr?.kind === 'template') return templateLayout(fr, W, H)
  switch (frameId) {
    case 'polaroid': {
      const m = s * 0.065
      return { x: m, y: m, w: W - 2 * m, h: H - m - Math.max(s * 0.2, H * 0.17), shape: 'rect' }
    }
    case 'torn': {
      const mx = s * 0.11
      const my = s * 0.1
      return { x: mx, y: my, w: W - 2 * mx, h: H - my - Math.max(s * 0.22, H * 0.18), shape: 'torn' }
    }
    case 'film': {
      const band = s * 0.15
      return { x: s * 0.035, y: band, w: W - s * 0.07, h: H - 2 * band, shape: 'rounded', radius: s * 0.012 }
    }
    case 'oval': {
      const mx = s * 0.14
      const my = s * 0.13
      return { x: mx, y: my, w: W - 2 * mx, h: H - 2 * my, shape: 'ellipse' }
    }
    case 'passepartout': {
      const mx = s * 0.14
      const my = s * 0.12
      return { x: mx, y: my, w: W - 2 * mx, h: H - my - Math.max(s * 0.22, H * 0.18), shape: 'rect' }
    }
    case 'lace': {
      const m = s * 0.13
      return { x: m, y: m + s * 0.02, w: W - 2 * m, h: H - 2 * m - s * 0.02, shape: 'rounded', radius: s * 0.05 }
    }
    default:
      return { x: 0, y: 0, w: W, h: H, shape: 'rect' }
  }
}

function shapePath(ctx, L) {
  ctx.beginPath()
  if (L.shape === 'ellipse') ctx.ellipse(L.x + L.w / 2, L.y + L.h / 2, L.w / 2, L.h / 2, 0, 0, Math.PI * 2)
  else if (L.shape === 'rounded') roundRectPath(ctx, L.x, L.y, L.w, L.h, L.radius)
  else if (L.shape === 'torn') tornRectPath(ctx, L, 11)
  else ctx.rect(L.x, L.y, L.w, L.h)
}

/* ---------------- filtered photo (pixel pipeline) ---------------- */
const imgIds = new WeakMap()
let nextImgId = 1
const imgId = (img) => {
  if (!imgIds.has(img)) imgIds.set(img, nextImgId++)
  return imgIds.get(img)
}
const LRU = new Map()
const LRU_MAX = 6
const noiseCache = new Map()
let filterSupport = null
const supportsCanvasFilter = () => {
  if (filterSupport !== null) return filterSupport
  try {
    const c = document.createElement('canvas').getContext('2d')
    c.filter = 'blur(2px)'
    filterSupport = c.filter === 'blur(2px)'
  } catch {
    filterSupport = false
  }
  return filterSupport
}

function getNoise(w, h) {
  const key = `${w}x${h}`
  if (noiseCache.has(key)) return noiseCache.get(key)
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')
  const id = ctx.createImageData(c.width, c.height)
  const d = id.data
  const rng = mulberry32(1337)
  for (let i = 0; i < d.length; i += 4) {
    const n = (rng() + rng() + rng()) / 3 - 0.5
    const v = 128 + n * 255 * 1.6
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  ctx.putImageData(id, 0, 0)
  if (noiseCache.size > 4) noiseCache.delete(noiseCache.keys().next().value)
  noiseCache.set(key, c)
  return c
}

export function renderFilteredPhoto(img, adj, crop, w, h, { cache = true } = {}) {
  w = Math.max(1, Math.round(w))
  h = Math.max(1, Math.round(h))
  crop = crop || { zoom: 1, x: 0, y: 0 }
  const key = `${imgId(img)}|${w}x${h}|${JSON.stringify(adj)}|${crop.zoom},${crop.x},${crop.y}`
  if (cache && LRU.has(key)) {
    const v = LRU.get(key)
    LRU.delete(key)
    LRU.set(key, v)
    return v
  }
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#e9e1d4'
  ctx.fillRect(0, 0, w, h)

  // cover-fit with zoom + pan
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  const r = w / h
  let sw, sh
  if (iw / ih > r) {
    sh = ih
    sw = ih * r
  } else {
    sw = iw
    sh = iw / r
  }
  const z = Math.max(1, crop.zoom || 1)
  sw /= z
  sh /= z
  const mx = (iw - sw) / 2
  const my = (ih - sh) / 2
  const sx = mx + (crop.x || 0) * mx
  const sy = my + (crop.y || 0) * my
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const blurPx = ((adj.blur || 0) / 100) * Math.min(w, h) * 0.018
  if (blurPx > 0.3) {
    if (supportsCanvasFilter()) {
      ctx.filter = `blur(${blurPx.toFixed(2)}px)`
      ctx.drawImage(img, sx, sy, sw, sh, -blurPx * 2, -blurPx * 2, w + blurPx * 4, h + blurPx * 4)
      ctx.filter = 'none'
    } else {
      const f = 1 + blurPx * 0.55
      const t = makeCanvas(w / f, h / f)
      const tc = t.getContext('2d')
      tc.imageSmoothingQuality = 'high'
      tc.drawImage(img, sx, sy, sw, sh, 0, 0, t.width, t.height)
      ctx.drawImage(t, 0, 0, w, h)
    }
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  }

  // ---- per-pixel colour grading ----
  const B = (adj.brightness || 0) / 100
  const C = (adj.contrast || 0) * 1.28
  const cf = (259 * (C + 255)) / (255 * (259 - C))
  const S = 1 + (adj.saturation || 0) / 100
  const Wm = (adj.warmth || 0) / 100
  const sep = (adj.sepia || 0) / 100
  const fade = (adj.fade || 0) / 100
  const tint = adj.tint
  const ta = tint ? (tint.a || 0) / 100 : 0
  const needsPixels = B || C || S !== 1 || Wm || sep || fade || ta
  if (needsPixels) {
    const lut = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      let v = i * (1 + B * 0.55) + B * 28
      v = cf * (v - 128) + 128
      lut[i] = v
    }
    const id = ctx.getImageData(0, 0, w, h)
    const d = id.data
    const tr = tint ? (tint.r - 128) * ta * 0.55 : 0
    const tg = tint ? (tint.g - 128) * ta * 0.55 : 0
    const tb = tint ? (tint.b - 128) * ta * 0.55 : 0
    const fk = 1 - fade * 0.3
    const fr = 240 * fade * 0.3
    const fg = 230 * fade * 0.3
    const fb = 218 * fade * 0.3
    for (let i = 0; i < d.length; i += 4) {
      let r0 = lut[d[i]]
      let g0 = lut[d[i + 1]]
      let b0 = lut[d[i + 2]]
      if (S !== 1) {
        const gray = 0.299 * r0 + 0.587 * g0 + 0.114 * b0
        r0 = gray + (r0 - gray) * S
        g0 = gray + (g0 - gray) * S
        b0 = gray + (b0 - gray) * S
      }
      if (Wm) {
        r0 += Wm * 38
        g0 += Wm * 9
        b0 -= Wm * 38
      }
      if (sep) {
        const sr = r0 * 0.393 + g0 * 0.769 + b0 * 0.189
        const sg = r0 * 0.349 + g0 * 0.686 + b0 * 0.168
        const sb = r0 * 0.272 + g0 * 0.534 + b0 * 0.131
        r0 += (sr - r0) * sep
        g0 += (sg - g0) * sep
        b0 += (sb - b0) * sep
      }
      if (ta) {
        r0 += tr
        g0 += tg
        b0 += tb
      }
      if (fade) {
        r0 = r0 * fk + fr
        g0 = g0 * fk + fg
        b0 = b0 * fk + fb
      }
      d[i] = r0
      d[i + 1] = g0
      d[i + 2] = b0
    }
    ctx.putImageData(id, 0, 0)
  }

  // ---- light leak ----
  if (adj.leak > 0) {
    const a = adj.leak / 100
    ctx.globalCompositeOperation = 'screen'
    let g = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * 0.75)
    g.addColorStop(0, `rgba(255,120,50,${0.75 * a})`)
    g.addColorStop(0.45, `rgba(255,170,90,${0.3 * a})`)
    g.addColorStop(1, 'rgba(255,170,90,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    g = ctx.createRadialGradient(w, h * 0.85, 0, w, h * 0.85, Math.max(w, h) * 0.5)
    g.addColorStop(0, `rgba(255,90,120,${0.45 * a})`)
    g.addColorStop(1, 'rgba(255,90,120,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  // ---- vignette ----
  if (adj.vignette > 0) {
    const a = adj.vignette / 100
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.hypot(w, h) / 2)
    g.addColorStop(0, 'rgba(28,18,12,0)')
    g.addColorStop(1, `rgba(28,18,12,${0.75 * a})`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  // ---- film grain ----
  if (adj.grain > 0) {
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = Math.min(1, (adj.grain / 100) * 0.7)
    ctx.drawImage(getNoise(w, h), 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }
  // ---- orange date stamp ----
  if (adj.dateStamp) {
    const fs = Math.min(w, h) * 0.05
    ctx.font = `700 ${fs}px "Courier Prime", monospace`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    ctx.shadowColor = 'rgba(255,110,40,0.85)'
    ctx.shadowBlur = fs * 0.5
    ctx.fillStyle = '#ff9a4a'
    ctx.fillText("'98  8  14", w - fs * 0.9, h - fs * 0.9)
    ctx.shadowBlur = 0
    ctx.shadowColor = 'transparent'
  }

  if (cache) {
    LRU.set(key, c)
    if (LRU.size > LRU_MAX) LRU.delete(LRU.keys().next().value)
  }
  return c
}

/* ---------------- text drawing ---------------- */
function drawLine(ctx, text, cx, cy, arc, sp) {
  const chars = [...text]
  if (!chars.length) return
  if (!arc && !sp) {
    ctx.fillText(text, cx, cy)
    return
  }
  const widths = chars.map((c) => ctx.measureText(c).width + sp)
  const total = widths.reduce((a, b) => a + b, 0) - sp
  if (!arc) {
    let x = cx - total / 2
    chars.forEach((c, i) => {
      ctx.fillText(c, x + (widths[i] - sp) / 2, cy)
      x += widths[i]
    })
    return
  }
  const angle = (arc / 100) * Math.PI * 0.9
  const r = total / Math.abs(angle)
  const sag = r * (1 - Math.cos(Math.abs(angle) / 2))
  const up = angle > 0
  const y0 = up ? cy - sag / 2 : cy + sag / 2
  let a = -Math.abs(angle) / 2
  chars.forEach((c, i) => {
    const cw = widths[i]
    const mid = a + (cw - sp) / 2 / r
    ctx.save()
    if (up) {
      ctx.translate(cx + r * Math.sin(mid), y0 + r - r * Math.cos(mid))
      ctx.rotate(mid)
    } else {
      ctx.translate(cx + r * Math.sin(mid), y0 - r + r * Math.cos(mid))
      ctx.rotate(-mid)
    }
    ctx.fillText(c, 0, 0)
    ctx.restore()
    a += cw / r
  })
}

let _mctx = null
const measureCtx = () => (_mctx ||= makeCanvas(8, 8).getContext('2d'))

/** Bounding box of a text layer in canvas pixels for a canvas of width W. */
export function measureTextLayer(l, W) {
  const px = l.size * W
  const ctx = measureCtx()
  ctx.font = fontString(l.font, px)
  const sp = ((l.letterSpacing || 0) / 100) * px
  const lines = (l.text || ' ').split('\n')
  let maxW = 0
  lines.forEach((line) => {
    const chars = [...line]
    const w = chars.reduce((a, c) => a + ctx.measureText(c).width + sp, 0) - sp
    maxW = Math.max(maxW, w)
  })
  let h = lines.length * px * 1.2
  if (l.arc) {
    const angle = (Math.abs(l.arc) / 100) * Math.PI * 0.9
    const r = maxW / angle
    h += r * (1 - Math.cos(angle / 2))
  }
  return { w: Math.max(maxW, px * 0.6) + px * 0.4, h: h + px * 0.2 }
}

export function drawTextLayer(ctx, l, W, H) {
  const px = l.size * W
  ctx.save()
  ctx.translate(l.x * W, l.y * H)
  ctx.rotate(((l.rotation || 0) * Math.PI) / 180)
  ctx.globalAlpha = l.opacity ?? 1
  ctx.font = fontString(l.font, px)
  ctx.fillStyle = l.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (l.shadow) {
    ctx.shadowColor = 'rgba(30,20,15,0.45)'
    ctx.shadowBlur = px * 0.25
    ctx.shadowOffsetY = px * 0.06
  }
  const lines = (l.text || '').split('\n')
  const lh = px * 1.2
  const sp = ((l.letterSpacing || 0) / 100) * px
  lines.forEach((line, i) => drawLine(ctx, line, 0, (i - (lines.length - 1) / 2) * lh, l.arc || 0, sp))
  ctx.restore()
}

export { drawLine as drawSpacedLine }

/* ---------------- stickers ---------------- */
export function drawSticker(ctx, l, W, H) {
  const def = STICKER_MAP[l.stickerId]
  if (!def) return
  const img = def.kind === 'image' ? getStickerCanvas(def) : getSvgImage('st:' + def.id, def.svg)
  if (!img) return
  const w = l.w * W
  const h = (w * def.h) / def.w
  ctx.save()
  ctx.translate(l.x * W, l.y * H)
  ctx.rotate(((l.rotation || 0) * Math.PI) / 180)
  if (l.flip) ctx.scale(-1, 1)
  ctx.globalAlpha = l.opacity ?? 1
  if (def.shadow !== false) {
    ctx.shadowColor = 'rgba(60,40,30,0.24)'
    ctx.shadowBlur = W * 0.012
    ctx.shadowOffsetY = W * 0.005
  }
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
}

export function drawLayers(ctx, layers, W, H) {
  for (const l of layers) {
    if (l.hidden) continue
    if (l.type === 'sticker') drawSticker(ctx, l, W, H)
    else if (l.type === 'text') drawTextLayer(ctx, l, W, H)
  }
}

/* ---------------- frames ---------------- */
const gold = (ctx, x0, y0, x1, y1) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, '#a87a2e')
  g.addColorStop(0.3, '#f3d891')
  g.addColorStop(0.55, '#b98a3a')
  g.addColorStop(0.8, '#f1d58f')
  g.addColorStop(1, '#8f6424')
  return g
}

function drawFrameBack(ctx, id, W, H, L) {
  const s = Math.min(W, H)
  switch (id) {
    case 'polaroid': {
      const g = ctx.createLinearGradient(0, 0, W, H)
      g.addColorStop(0, '#fdfbf6')
      g.addColorStop(1, '#f3eee4')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      break
    }
    case 'torn': {
      ctx.fillStyle = '#f5eee1'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(110,140,175,0.22)'
      ctx.lineWidth = Math.max(1, s * 0.0025)
      const gap = s * 0.045
      for (let y = gap * 1.5; y < H; y += gap) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(205,95,95,0.35)'
      ctx.beginPath()
      ctx.moveTo(s * 0.06, 0)
      ctx.lineTo(s * 0.06, H)
      ctx.stroke()
      // torn photo paper underneath
      const pad = s * 0.018
      ctx.save()
      ctx.shadowColor = 'rgba(60,40,25,0.25)'
      ctx.shadowBlur = s * 0.025
      ctx.shadowOffsetY = s * 0.008
      ctx.fillStyle = '#fffdf8'
      ctx.beginPath()
      tornRectPath(ctx, { x: L.x - pad, y: L.y - pad, w: L.w + pad * 2, h: L.h + pad * 2 }, 4, s * 0.012)
      ctx.fill()
      ctx.restore()
      break
    }
    case 'film':
      ctx.fillStyle = '#181412'
      ctx.fillRect(0, 0, W, H)
      break
    case 'oval': {
      const g = ctx.createRadialGradient(W / 2, H / 2, s * 0.1, W / 2, H / 2, Math.hypot(W, H) / 2)
      g.addColorStop(0, '#f4ecdf')
      g.addColorStop(1, '#e2d4bd')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      // damask diamonds
      ctx.strokeStyle = 'rgba(150,115,70,0.08)'
      ctx.lineWidth = Math.max(1, s * 0.002)
      const step = s * 0.07
      for (let x = -H; x < W + H; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + H, H)
        ctx.moveTo(x, H)
        ctx.lineTo(x + H, 0)
        ctx.stroke()
      }
      ctx.save()
      ctx.shadowColor = 'rgba(60,40,20,0.35)'
      ctx.shadowBlur = s * 0.03
      ctx.shadowOffsetY = s * 0.01
      ctx.fillStyle = '#d9bf86'
      ctx.beginPath()
      ctx.ellipse(W / 2, H / 2, L.w / 2 + s * 0.03, L.h / 2 + s * 0.03, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }
    case 'passepartout': {
      ctx.fillStyle = '#2c2523'
      ctx.fillRect(0, 0, W, H)
      const b = s * 0.028
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#fcfaf5')
      g.addColorStop(1, '#f2ede3')
      ctx.fillStyle = g
      ctx.fillRect(b, b, W - 2 * b, H - 2 * b)
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = Math.max(1, s * 0.003)
      ctx.strokeRect(b, b, W - 2 * b, H - 2 * b)
      break
    }
    case 'lace': {
      ctx.fillStyle = '#f5e1de'
      ctx.fillRect(0, 0, W, H)
      const inset = s * 0.055
      const R = { x: inset, y: inset, w: W - 2 * inset, h: H - 2 * inset }
      const step = s * 0.042
      const rad = step * 0.62
      ctx.fillStyle = '#fffaf7'
      const along = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0)
        const n = Math.max(1, Math.round(len / step))
        for (let i = 0; i <= n; i++) {
          ctx.beginPath()
          ctx.arc(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, rad, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.save()
      ctx.shadowColor = 'rgba(160,90,100,0.18)'
      ctx.shadowBlur = s * 0.02
      along(R.x, R.y, R.x + R.w, R.y)
      along(R.x + R.w, R.y, R.x + R.w, R.y + R.h)
      along(R.x + R.w, R.y + R.h, R.x, R.y + R.h)
      along(R.x, R.y + R.h, R.x, R.y)
      ctx.fillRect(R.x, R.y, R.w, R.h)
      ctx.restore()
      // eyelets
      ctx.fillStyle = '#f2d6d3'
      const e = s * 0.03
      const eyelet = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0)
        const n = Math.max(1, Math.round(len / (step * 1)))
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n
          const y = y0 + ((y1 - y0) * i) / n
          ctx.beginPath()
          ctx.arc(x, y, s * 0.006, 0, Math.PI * 2)
          ctx.fill()
          if (i < n) {
            ctx.beginPath()
            ctx.ellipse(x + (x1 - x0) / n / 2, y + (y1 - y0) / n / 2, s * 0.009, s * 0.004, Math.atan2(y1 - y0, x1 - x0), 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      eyelet(R.x + e, R.y + e, R.x + R.w - e, R.y + e)
      eyelet(R.x + R.w - e, R.y + e, R.x + R.w - e, R.y + R.h - e)
      eyelet(R.x + R.w - e, R.y + R.h - e, R.x + e, R.y + R.h - e)
      eyelet(R.x + e, R.y + R.h - e, R.x + e, R.y + e)
      break
    }
    case 'y2k':
    case 'none':
    default:
      ctx.fillStyle = '#f3ede2'
      ctx.fillRect(0, 0, W, H)
  }
}

function drawFrameFront(ctx, id, W, H, L, captions) {
  const s = Math.min(W, H)
  const cap = (captions && captions[id]) || ''
  ctx.save()
  switch (id) {
    case 'polaroid': {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = Math.max(1, s * 0.003)
      ctx.strokeRect(L.x, L.y, L.w, L.h)
      if (cap) {
        const bottom = L.y + L.h
        const fs = Math.min(s * 0.075, (H - bottom) * 0.42)
        ctx.font = fontString('caveat', fs)
        ctx.fillStyle = '#3a2f2b'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cap, W / 2, bottom + (H - bottom) * 0.5, W * 0.9)
      }
      break
    }
    case 'torn': {
      // washi pieces on corners
      const tape = (x, y, rot) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        ctx.fillStyle = 'rgba(233,214,178,0.78)'
        ctx.fillRect(-s * 0.09, -s * 0.025, s * 0.18, s * 0.05)
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(-s * 0.09, -s * 0.025, s * 0.18, s * 0.012)
        ctx.restore()
      }
      tape(L.x + s * 0.02, L.y + s * 0.01, -Math.PI / 5)
      tape(L.x + L.w - s * 0.02, L.y + s * 0.01, Math.PI / 5)
      if (cap) {
        const bottom = L.y + L.h
        const fs = Math.min(s * 0.075, (H - bottom) * 0.38)
        ctx.font = fontString('caveat', fs)
        ctx.fillStyle = '#4a3b34'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(cap, L.x, bottom + (H - bottom) * 0.5, L.w)
      }
      break
    }
    case 'film': {
      const hw = s * 0.038
      const hh = s * 0.05
      const gap = s * 0.072
      ctx.fillStyle = '#efe8dc'
      const rowY = [L.y * 0.36, H - L.y * 0.36]
      rowY.forEach((cy) => {
        for (let x = gap * 0.4; x < W; x += gap) {
          ctx.beginPath()
          roundRectPath(ctx, x, cy - hh / 2, hw, hh, hw * 0.25)
          ctx.fill()
        }
      })
      const fs = s * 0.03
      ctx.font = `700 ${fs}px "Courier Prime", monospace`
      ctx.fillStyle = '#e8a25c'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillText(cap || 'AURA 400', s * 0.04, L.y * 0.8)
      ctx.textAlign = 'right'
      ctx.fillText('▸ 24A', W - s * 0.04, L.y * 0.8)
      ctx.textAlign = 'left'
      ctx.fillText('25', s * 0.04, H - L.y * 0.8)
      ctx.textAlign = 'right'
      ctx.fillText('SAFETY FILM', W - s * 0.04, H - L.y * 0.8)
      break
    }
    case 'oval': {
      const cx = W / 2
      const cy = H / 2
      ctx.strokeStyle = gold(ctx, L.x, L.y, L.x + L.w, L.y + L.h)
      ctx.lineWidth = s * 0.024
      ctx.beginPath()
      ctx.ellipse(cx, cy, L.w / 2 + s * 0.012, L.h / 2 + s * 0.012, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.lineWidth = s * 0.005
      ctx.beginPath()
      ctx.ellipse(cx, cy, L.w / 2 + s * 0.034, L.h / 2 + s * 0.034, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = gold(ctx, 0, 0, W, H)
      const n = 56
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * (L.w / 2 + s * 0.05), cy + Math.sin(a) * (L.h / 2 + s * 0.05), s * 0.0065, 0, Math.PI * 2)
        ctx.fill()
      }
      // bail / hinge
      ctx.strokeStyle = gold(ctx, cx - s * 0.04, 0, cx + s * 0.04, 0)
      ctx.lineWidth = s * 0.012
      ctx.beginPath()
      ctx.arc(cx, L.y - s * 0.075, s * 0.03, 0, Math.PI * 2)
      ctx.stroke()
      // glass reflection
      const g = ctx.createLinearGradient(L.x, L.y, L.x + L.w * 0.6, L.y + L.h * 0.5)
      g.addColorStop(0, 'rgba(255,255,255,0.22)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(cx - L.w * 0.12, cy - L.h * 0.16, L.w * 0.28, L.h * 0.22, -0.5, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'passepartout': {
      ctx.strokeStyle = '#ece4d6'
      ctx.lineWidth = s * 0.008
      ctx.strokeRect(L.x - s * 0.004, L.y - s * 0.004, L.w + s * 0.008, L.h + s * 0.008)
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'
      ctx.lineWidth = Math.max(1, s * 0.002)
      ctx.strokeRect(L.x, L.y, L.w, L.h)
      const bottom = L.y + L.h
      const area = H - s * 0.028 - bottom
      if (cap) {
        const fs = Math.min(s * 0.042, area * 0.32)
        ctx.font = fontString('playfair', fs)
        ctx.fillStyle = '#2c2523'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(cap, W / 2, bottom + area * 0.42, W * 0.8)
      }
      const fs2 = Math.min(s * 0.018, area * 0.15)
      ctx.font = `600 ${fs2}px "Plus Jakarta Sans", sans-serif`
      ctx.fillStyle = 'rgba(44,37,35,0.5)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      drawLine(ctx, 'MIRELLE GALLERY', W / 2, bottom + area * 0.72, 0, fs2 * 0.35)
      break
    }
    case 'lace': {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.lineWidth = s * 0.008
      ctx.beginPath()
      roundRectPath(ctx, L.x - s * 0.008, L.y - s * 0.008, L.w + s * 0.016, L.h + s * 0.016, L.radius + s * 0.008)
      ctx.stroke()
      ctx.setLineDash([s * 0.006, s * 0.012])
      ctx.strokeStyle = 'rgba(220,150,160,0.8)'
      ctx.lineWidth = s * 0.003
      ctx.beginPath()
      roundRectPath(ctx, L.x - s * 0.022, L.y - s * 0.022, L.w + s * 0.044, L.h + s * 0.044, L.radius + s * 0.02)
      ctx.stroke()
      ctx.setLineDash([])
      const bow = STICKER_MAP.bow
      const img = getSvgImage('st:bow', bow.svg)
      if (img) {
        const bw = s * 0.26
        const bh = (bw * bow.h) / bow.w
        ctx.shadowColor = 'rgba(120,60,70,0.25)'
        ctx.shadowBlur = s * 0.015
        ctx.shadowOffsetY = s * 0.006
        ctx.drawImage(img, W / 2 - bw / 2, L.y - bh * 0.42, bw, bh)
      }
      break
    }
    case 'y2k': {
      const m = s * 0.06
      const len = s * 0.075
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = s * 0.006
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = s * 0.008
      const corner = (x, y, dx, dy) => {
        ctx.beginPath()
        ctx.moveTo(x, y + dy * len)
        ctx.lineTo(x, y)
        ctx.lineTo(x + dx * len, y)
        ctx.stroke()
      }
      corner(m, m, 1, 1)
      corner(W - m, m, -1, 1)
      corner(m, H - m, 1, -1)
      corner(W - m, H - m, -1, -1)
      // thirds grid
      ctx.lineWidth = Math.max(1, s * 0.0018)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo((W * i) / 3, 0)
        ctx.lineTo((W * i) / 3, H)
        ctx.moveTo(0, (H * i) / 3)
        ctx.lineTo(W, (H * i) / 3)
        ctx.stroke()
      }
      // focus
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = s * 0.004
      const f = s * 0.05
      ctx.strokeRect(W / 2 - f, H / 2 - f * 0.75, f * 2, f * 1.5)
      const fs = s * 0.036
      ctx.font = `700 ${fs}px "Courier Prime", monospace`
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ff4d4d'
      ctx.beginPath()
      ctx.arc(m + len * 0.55, m + len * 0.95, fs * 0.28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText('REC', m + len * 0.55 + fs * 0.5, m + len * 0.95)
      ctx.font = `400 ${fs * 0.75}px "Courier Prime", monospace`
      ctx.fillText('00:00:14', m + len * 0.35, m + len * 0.95 + fs * 1.1)
      // battery
      const bx = W - m - len * 0.4 - fs * 1.6
      const by = m + len * 0.95 - fs * 0.35
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = s * 0.004
      ctx.strokeRect(bx, by, fs * 1.6, fs * 0.7)
      ctx.fillStyle = '#fff'
      ctx.fillRect(bx + fs * 1.6, by + fs * 0.2, fs * 0.12, fs * 0.3)
      for (let i = 0; i < 3; i++) ctx.fillRect(bx + fs * 0.14 + i * fs * 0.48, by + fs * 0.12, fs * 0.38, fs * 0.46)
      ctx.font = `400 ${fs * 0.75}px "Courier Prime", monospace`
      ctx.textAlign = 'left'
      ctx.fillText('ISO 400  F2.8  1/125', m + len * 0.35, H - m - len * 0.6)
      if (cap) {
        ctx.font = `700 ${fs}px "Courier Prime", monospace`
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffa24d'
        ctx.shadowColor = 'rgba(255,120,40,0.9)'
        ctx.shadowBlur = fs * 0.5
        ctx.fillText(cap, W - m - len * 0.35, H - m - len * 0.6)
      }
      break
    }
    default:
      break
  }
  ctx.restore()
}

/** Source-pixel window of a cover-fitted photo in a w×h slot (used for drag-to-pan maths). */
export function cropWindow(img, w, h, zoom = 1) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  const r = w / h
  let sw = iw / ih > r ? ih * r : iw
  let sh = iw / ih > r ? ih : iw / r
  const z = Math.max(1, zoom)
  sw /= z
  sh /= z
  return { sw, sh, mx: (iw - sw) / 2, my: (ih - sh) / 2 }
}

/* ---------------- whole scene ---------------- */
export function renderPhotoScene(ctx, W, H, s, { skipLayers = false, cache = true } = {}) {
  const L = getFrameLayout(s.frameId, W, H)
  const fr = FRAME_MAP[s.frameId]
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  if (fr?.kind === 'template') drawTemplateBack(ctx, fr, W, H, L)
  else drawFrameBack(ctx, s.frameId, W, H, L)
  ctx.save()
  shapePath(ctx, L)
  ctx.clip()
  if (s.image) {
    const fp = renderFilteredPhoto(s.image, s.adj, s.crop, L.w, L.h, { cache })
    ctx.drawImage(fp, L.x, L.y, L.w, L.h)
  } else {
    const g = ctx.createLinearGradient(L.x, L.y, L.x + L.w, L.y + L.h)
    g.addColorStop(0, '#efe6d8')
    g.addColorStop(1, '#e2d5c1')
    ctx.fillStyle = g
    ctx.fillRect(L.x, L.y, L.w, L.h)
  }
  ctx.restore()
  if (fr?.kind === 'template') drawTemplateFront(ctx, fr, W, H)
  else drawFrameFront(ctx, s.frameId, W, H, L, s.captions)
  if (!skipLayers) drawLayers(ctx, s.layers || [], W, H)
  ctx.restore()
  return L
}
