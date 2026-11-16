// Photobooth strips: real-feeling paper strips with 3–4 shots, caption and date.
import { renderFilteredPhoto, tornRectPath, roundRectPath } from './photoRenderer'
import { fontString } from '../data/fonts'
import { mulberry32 } from './random'

export const STRIP_LAYOUTS = [
  { id: 'four', name: 'Classic 4', shots: 4, ratio: 1 / 3 },
  { id: 'three', name: 'Trio', shots: 3, ratio: 1 / 2.5 },
  { id: 'grid', name: 'Grid', shots: 4, ratio: 2 / 3 },
]
export const STRIP_STYLES = [
  { id: 'gallery', name: 'Gallery white', swatch: '#fbf8f2' },
  { id: 'noir', name: 'Noir film', swatch: '#151312' },
  { id: 'blush', name: 'Blush', swatch: '#f4d9dc' },
  { id: 'kraft', name: 'Kraft', swatch: '#c49d72' },
  { id: 'lace', name: 'Heirloom lace', swatch: '#f6efe2' },
  { id: 'gilded', name: 'Gilded night', swatch: '#1f2741' },
]
export const stripLayout = (id) => STRIP_LAYOUTS.find((l) => l.id === id) || STRIP_LAYOUTS[0]

export function stripDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)} · ${p(d.getDate())} · ${String(d.getFullYear()).slice(2)}`
}

const GOLD = (ctx, x0, y0, x1, y1) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  ;[['#a87a2e', 0], ['#f6e2a6', 0.35], ['#fff6d8', 0.5], ['#d4ab55', 0.65], ['#8a5e1e', 1]].forEach(([c, o]) => g.addColorStop(o, c))
  return g
}

let paperTile = null
function paperGrain(ctx, W, H, alpha) {
  if (!paperTile) {
    paperTile = document.createElement('canvas')
    paperTile.width = paperTile.height = 220
    const c = paperTile.getContext('2d')
    const id = c.createImageData(220, 220)
    const rng = mulberry32(7)
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 128 + (rng() + rng() - 1) * 90
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v
      id.data[i + 3] = 255
    }
    c.putImageData(id, 0, 0)
  }
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(paperTile, 'repeat')
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}

/** Where the photos go, in canvas pixels. */
export function stripSlots(layoutId, styleId, W, H) {
  const L = stripLayout(layoutId)
  const s = W
  const side = styleId === 'noir' ? s * 0.13 : s * (L.id === 'grid' ? 0.045 : 0.07)
  const top = L.id === 'grid' ? s * 0.045 : s * 0.07
  const gap = s * (L.id === 'grid' ? 0.025 : 0.04)
  const cap = L.id === 'grid' ? H * 0.17 : H * 0.12
  const x0 = side
  const w0 = W - side * 2
  const h0 = H - top - cap
  if (L.id === 'grid') {
    const w = (w0 - gap) / 2
    const h = (h0 - gap) / 2
    return [0, 1, 2, 3].map((i) => ({ x: x0 + (i % 2) * (w + gap), y: top + Math.floor(i / 2) * (h + gap), w, h }))
  }
  const h = (h0 - gap * (L.shots - 1)) / L.shots
  return [...Array(L.shots)].map((_, i) => ({ x: x0, y: top + i * (h + gap), w: w0, h }))
}

function background(ctx, style, W, H) {
  const s = W
  ctx.save()
  if (style === 'kraft') {
    ctx.beginPath()
    tornRectPath(ctx, { x: s * 0.01, y: s * 0.01, w: W - s * 0.02, h: H - s * 0.02 }, 5, s * 0.006)
    ctx.clip()
  }
  if (style === 'lace') {
    // scalloped edge
    const r = s * 0.028
    ctx.beginPath()
    ctx.rect(r, r, W - 2 * r, H - 2 * r)
    for (let x = r; x <= W - r; x += r * 1.6) {
      ctx.moveTo(x + r, r)
      ctx.arc(x, r, r, 0, Math.PI * 2)
      ctx.moveTo(x + r, H - r)
      ctx.arc(x, H - r, r, 0, Math.PI * 2)
    }
    for (let y = r; y <= H - r; y += r * 1.6) {
      ctx.moveTo(r + r, y)
      ctx.arc(r, y, r, 0, Math.PI * 2)
      ctx.moveTo(W - r + r, y)
      ctx.arc(W - r, y, r, 0, Math.PI * 2)
    }
    ctx.clip('nonzero')
  }
  const fills = {
    gallery: ['#fdfbf6', '#f1ebe0'],
    noir: ['#1c1917', '#0f0d0c'],
    blush: ['#f8e3e5', '#efcdd1'],
    kraft: ['#cfa97d', '#b78d62'],
    lace: ['#faf5ea', '#efe5d2'],
    gilded: ['#283255', '#161c33'],
  }[style] || ['#fff', '#eee']
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
  g.addColorStop(0, fills[0])
  g.addColorStop(1, fills[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  paperGrain(ctx, W, H, style === 'noir' || style === 'gilded' ? 0.08 : 0.12)
  if (style === 'blush') {
    const rng = mulberry32(3)
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = `${s * 0.035}px serif`
    for (let i = 0; i < 70; i++) ctx.fillText('♥', rng() * W, rng() * H)
  }
  if (style === 'lace') {
    ctx.strokeStyle = 'rgba(180,150,110,0.35)'
    ctx.lineWidth = s * 0.004
    ctx.setLineDash([s * 0.01, s * 0.008])
    ctx.strokeRect(s * 0.06, s * 0.06, W - s * 0.12, H - s * 0.12)
    ctx.setLineDash([])
  }
  if (style === 'gilded') {
    ctx.strokeStyle = GOLD(ctx, 0, 0, W, H)
    ctx.lineWidth = s * 0.006
    ctx.strokeRect(s * 0.025, s * 0.025, W - s * 0.05, H - s * 0.05)
    ctx.lineWidth = s * 0.002
    ctx.strokeRect(s * 0.038, s * 0.038, W - s * 0.076, H - s * 0.076)
    const rng = mulberry32(9)
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,236,190,${0.25 + rng() * 0.5})`
      ctx.beginPath()
      ctx.arc(rng() * W, rng() * H, s * (0.002 + rng() * 0.003), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  if (style === 'noir') {
    // film sprocket holes
    ctx.fillStyle = '#efe8dc'
    const hw = s * 0.055
    const hh = s * 0.075
    for (let y = s * 0.05; y < H - hh; y += s * 0.13) {
      for (const x of [s * 0.038, W - s * 0.038 - hw]) {
        ctx.beginPath()
        roundRectPath(ctx, x, y, hw, hh, hw * 0.28)
        ctx.fill()
      }
    }
  }
  ctx.restore()
}

/**
 * opts: { layout, style, images: [img|null], adj, crops: [{zoom,x,y}], caption, showDate }
 */
export function renderStrip(ctx, W, H, opts) {
  const { layout = 'four', style = 'gallery', images = [], adj = {}, caption = '', showDate = true } = opts
  const s = W
  ctx.clearRect(0, 0, W, H)
  background(ctx, style, W, H)
  const slots = stripSlots(layout, style, W, H)
  const dark = style === 'noir' || style === 'gilded'
  slots.forEach((S, i) => {
    const img = images[i]
    ctx.save()
    // slot inset shadow
    ctx.shadowColor = dark ? 'rgba(0,0,0,0.6)' : 'rgba(60,40,25,0.22)'
    ctx.shadowBlur = s * 0.012
    ctx.shadowOffsetY = s * 0.004
    ctx.fillStyle = dark ? '#0b0a09' : '#e9e0d2'
    ctx.fillRect(S.x, S.y, S.w, S.h)
    ctx.restore()
    if (img) {
      const fp = renderFilteredPhoto(img, adj, opts.crops?.[i] || { zoom: 1, x: 0, y: -0.2 }, S.w, S.h, { cache: false })
      ctx.drawImage(fp, S.x, S.y, S.w, S.h)
    } else {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(110,85,65,0.3)'
      ctx.font = `300 ${Math.min(S.w, S.h) * 0.22}px "Plus Jakarta Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', S.x + S.w / 2, S.y + S.h / 2)
    }
    // subtle glossy print edge
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = Math.max(1, s * 0.002)
    ctx.strokeRect(S.x, S.y, S.w, S.h)
    if (style === 'noir' && img) {
      // orange date code burned into the last frame
      if (i === slots.length - 1 && showDate) {
        const fs = s * 0.045
        ctx.save()
        ctx.font = `700 ${fs}px "Courier Prime", monospace`
        ctx.fillStyle = '#ffa24d'
        ctx.shadowColor = 'rgba(255,120,40,0.9)'
        ctx.shadowBlur = fs * 0.5
        ctx.textAlign = 'right'
        ctx.fillText(`'${String(new Date().getFullYear()).slice(2)} ${new Date().getMonth() + 1} ${new Date().getDate()}`, S.x + S.w - fs * 0.6, S.y + S.h - fs * 0.6)
        ctx.restore()
      }
    }
  })

  // caption area
  const last = slots[slots.length - 1]
  const capTop = last.y + last.h
  const capH = H - capTop
  const cx = W / 2
  const ink = { gallery: '#3b2f2a', noir: '#efe8dc', blush: '#8b4a5e', kraft: '#3f2b1b', lace: '#6b5a3e', gilded: '#f3dfa8' }[style]
  const font = { gallery: 'caveat', noir: 'courier', blush: 'playfair', kraft: 'nothing', lace: 'caveat', gilded: 'cormorant' }[style]
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const hasCap = !!caption.trim()
  if (hasCap) {
    const fs = Math.min(capH * (showDate ? 0.36 : 0.44), s * (layout === 'grid' ? 0.075 : 0.13))
    ctx.font = fontString(font, fs, font === 'cormorant' || font === 'playfair' ? { italic: true } : {})
    ctx.fillStyle = style === 'gilded' ? GOLD(ctx, cx - W * 0.3, 0, cx + W * 0.3, 0) : ink
    ctx.fillText(caption, cx, capTop + capH * (showDate ? 0.4 : 0.5), W * 0.86)
  }
  if (showDate) {
    const fs = Math.min(capH * 0.15, s * (layout === 'grid' ? 0.028 : 0.05))
    ctx.font = `500 ${fs}px "Plus Jakarta Sans", sans-serif`
    ctx.fillStyle = style === 'gilded' ? '#d9c08a' : ink
    ctx.globalAlpha = 0.7
    const t = stripDate()
    const sp = fs * 0.35
    // letter-spaced date
    const chars = [...t]
    const widths = chars.map((c) => ctx.measureText(c).width + sp)
    let x = cx - (widths.reduce((a, b) => a + b, 0) - sp) / 2
    const y = capTop + capH * (hasCap ? 0.74 : 0.5)
    ctx.textAlign = 'left'
    chars.forEach((c, i) => {
      ctx.fillText(c, x, y)
      x += widths[i]
    })
    ctx.globalAlpha = 1
  }
}
