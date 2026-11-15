// Aesthetic Letter Studio renderer — paper, ink, wax seals, pressed botanicals, polaroid pins.
import { getSvgImage } from './assets'
import { mulberry32 } from './random'
import { fontString } from '../data/fonts'
import { INK_MAP, WASHI_COLORS } from '../data/letter'
import { STICKER_MAP } from '../data/stickers'
import { sealSvg, PAPERCLIP_SVG, CLOTHESPIN_SVG } from '../data/seals'
import { roundRectPath, tornRectPath, drawSpacedLine } from './photoRenderer'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function stampDate(d = new Date()) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function deckleShape(ctx, P, seed, amp) {
  ctx.beginPath()
  tornRectPath(ctx, P, seed, amp)
}

function stickerImg(id) {
  const d = STICKER_MAP[id]
  return d ? { def: d, img: getSvgImage('st:' + d.id, d.svg) } : null
}

/* ---------- paper ---------- */
function drawPaper(ctx, id, P, seed) {
  const rng = mulberry32(seed)
  const s = Math.min(P.w, P.h)
  const deckle = id === 'deckle' || id === 'floral'
  ctx.save()
  // drop shadow
  ctx.shadowColor = 'rgba(70,50,30,0.28)'
  ctx.shadowBlur = s * 0.04
  ctx.shadowOffsetY = s * 0.015
  const base = { parchment: '#efdfbf', floral: '#f7f1e5', linen: '#fbf9f4', grid: '#fdfcf7', deckle: '#f5ecdc', botanical: '#faf5ea' }[id] || '#f7f1e5'
  ctx.fillStyle = base
  if (deckle) deckleShape(ctx, P, seed + 3, s * 0.008)
  else {
    ctx.beginPath()
    ctx.rect(P.x, P.y, P.w, P.h)
  }
  ctx.fill()
  ctx.restore()

  ctx.save()
  if (deckle) deckleShape(ctx, P, seed + 3, s * 0.008)
  else {
    ctx.beginPath()
    ctx.rect(P.x, P.y, P.w, P.h)
  }
  ctx.clip()

  switch (id) {
    case 'parchment': {
      const g = ctx.createRadialGradient(P.x + P.w / 2, P.y + P.h * 0.45, s * 0.1, P.x + P.w / 2, P.y + P.h / 2, Math.hypot(P.w, P.h) * 0.62)
      g.addColorStop(0, 'rgba(255,248,230,0.65)')
      g.addColorStop(0.7, 'rgba(220,190,140,0.1)')
      g.addColorStop(1, 'rgba(120,75,35,0.45)')
      ctx.fillStyle = g
      ctx.fillRect(P.x, P.y, P.w, P.h)
      for (let i = 0; i < 7; i++) {
        const x = P.x + rng() * P.w
        const y = P.y + rng() * P.h
        const r = s * (0.04 + rng() * 0.12)
        const sg = ctx.createRadialGradient(x, y, 0, x, y, r)
        sg.addColorStop(0, 'rgba(150,100,50,0.10)')
        sg.addColorStop(0.8, 'rgba(150,100,50,0.05)')
        sg.addColorStop(1, 'rgba(150,100,50,0)')
        ctx.fillStyle = sg
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(120,85,45,0.08)'
      ctx.lineWidth = Math.max(1, s * 0.0015)
      for (let i = 0; i < 160; i++) {
        const x = P.x + rng() * P.w
        const y = P.y + rng() * P.h
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rng() - 0.5) * s * 0.03, y + (rng() - 0.5) * s * 0.01)
        ctx.stroke()
      }
      break
    }
    case 'floral': {
      ctx.strokeStyle = 'rgba(160,135,100,0.16)'
      ctx.lineWidth = Math.max(1, s * 0.0016)
      for (let i = 0; i < 260; i++) {
        const x = P.x + rng() * P.w
        const y = P.y + rng() * P.h
        const l = s * (0.008 + rng() * 0.025)
        const a = rng() * Math.PI
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + l * 0.2, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
        ctx.stroke()
      }
      const cols = ['rgba(233,160,175,0.55)', 'rgba(242,200,110,0.55)', 'rgba(175,155,215,0.5)', 'rgba(140,165,125,0.55)', 'rgba(240,180,150,0.5)']
      for (let i = 0; i < 46; i++) {
        const x = P.x + rng() * P.w
        const y = P.y + rng() * P.h
        ctx.fillStyle = cols[Math.floor(rng() * cols.length)]
        ctx.beginPath()
        ctx.ellipse(x, y, s * (0.004 + rng() * 0.008), s * (0.002 + rng() * 0.004), rng() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'linen': {
      ctx.lineWidth = Math.max(1, s * 0.0012)
      const step = Math.max(2, s * 0.005)
      ctx.strokeStyle = 'rgba(120,110,95,0.045)'
      for (let y = P.y; y < P.y + P.h; y += step) {
        ctx.beginPath()
        ctx.moveTo(P.x, y + rng())
        ctx.lineTo(P.x + P.w, y + rng())
        ctx.stroke()
      }
      for (let x = P.x; x < P.x + P.w; x += step) {
        ctx.beginPath()
        ctx.moveTo(x + rng(), P.y)
        ctx.lineTo(x + rng(), P.y + P.h)
        ctx.stroke()
      }
      break
    }
    case 'grid': {
      const g = s * 0.04
      ctx.strokeStyle = 'rgba(110,145,180,0.22)'
      ctx.lineWidth = Math.max(1, s * 0.0016)
      for (let x = P.x + g; x < P.x + P.w; x += g) {
        ctx.beginPath()
        ctx.moveTo(x, P.y)
        ctx.lineTo(x, P.y + P.h)
        ctx.stroke()
      }
      for (let y = P.y + g; y < P.y + P.h; y += g) {
        ctx.beginPath()
        ctx.moveTo(P.x, y)
        ctx.lineTo(P.x + P.w, y)
        ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(210,95,95,0.45)'
      ctx.lineWidth = Math.max(1, s * 0.003)
      ctx.beginPath()
      ctx.moveTo(P.x + P.w * 0.1, P.y)
      ctx.lineTo(P.x + P.w * 0.1, P.y + P.h)
      ctx.stroke()
      ctx.fillStyle = '#e9e0d2'
      for (let y = P.y + s * 0.08; y < P.y + P.h - s * 0.04; y += s * 0.12) {
        ctx.beginPath()
        ctx.arc(P.x + P.w * 0.045, y, s * 0.014, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'deckle': {
      const g = ctx.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h)
      g.addColorStop(0, 'rgba(255,255,255,0.3)')
      g.addColorStop(1, 'rgba(190,160,120,0.15)')
      ctx.fillStyle = g
      ctx.fillRect(P.x, P.y, P.w, P.h)
      // divider + address lines
      const dx = P.x + P.w * 0.6
      ctx.strokeStyle = 'rgba(110,85,60,0.35)'
      ctx.lineWidth = Math.max(1, s * 0.002)
      ctx.beginPath()
      ctx.moveTo(dx, P.y + P.h * 0.2)
      ctx.lineTo(dx, P.y + P.h * 0.9)
      ctx.stroke()
      for (let i = 0; i < 4; i++) {
        const y = P.y + P.h * (0.5 + i * 0.09)
        ctx.beginPath()
        ctx.moveTo(dx + P.w * 0.05, y)
        ctx.lineTo(P.x + P.w * 0.93, y)
        ctx.stroke()
      }
      // stamp box
      ctx.setLineDash([s * 0.01, s * 0.008])
      const sw = P.w * 0.17
      ctx.strokeRect(P.x + P.w * 0.93 - sw, P.y + P.h * 0.06, sw, sw * 1.2)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(110,85,60,0.55)'
      ctx.font = `600 ${s * 0.024}px "Plus Jakarta Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      drawSpacedLine(ctx, 'POST CARD', P.x + P.w * 0.6, P.y + P.h * 0.08, 0, s * 0.012)
      break
    }
    case 'botanical': {
      const mw = P.w * 0.17
      ctx.fillStyle = '#f1e7d4'
      ctx.fillRect(P.x, P.y, mw, P.h)
      ctx.strokeStyle = 'rgba(120,140,110,0.4)'
      ctx.lineWidth = Math.max(1, s * 0.002)
      ctx.beginPath()
      ctx.moveTo(P.x + mw, P.y)
      ctx.lineTo(P.x + mw, P.y + P.h)
      ctx.stroke()
      const items = ['fern', 'eucalyptus', 'lavender', 'fern', 'eucalyptus']
      const n = items.length
      items.forEach((id2, i) => {
        const st = stickerImg(id2)
        if (!st || !st.img) return
        const h = (P.h / n) * 1.25
        const w = (h * st.def.w) / st.def.h
        ctx.save()
        ctx.translate(P.x + mw / 2, P.y + (P.h / n) * (i + 0.5))
        ctx.rotate((i % 2 ? 1 : -1) * (0.35 + rng() * 0.2))
        ctx.globalAlpha = 0.85
        ctx.drawImage(st.img, -w / 2, -h / 2, w, h)
        ctx.restore()
      })
      break
    }
    default:
      break
  }
  ctx.restore()
}

/* ---------- text layout with exclusion zones ---------- */
function wrapFlow(ctx, text, startY, lineH, getRange, maxY) {
  const lines = []
  let y = startY
  const paragraphs = text.split('\n')
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(/\s+/).filter(Boolean)
    if (!words.length) {
      y += lineH * 0.7
      continue
    }
    let i = 0
    while (i < words.length) {
      const [x0, x1] = getRange(y - lineH * 0.8, y + lineH * 0.3)
      const maxW = Math.max(20, x1 - x0)
      let line = words[i]
      let j = i + 1
      while (j < words.length && ctx.measureText(line + ' ' + words[j]).width <= maxW) {
        line += ' ' + words[j]
        j++
      }
      lines.push({ text: line, words: words.slice(i, j), x0, x1, y, last: j >= words.length })
      i = j
      y += lineH
      if (y > maxY + lineH * 4) return { lines, endY: y, overflow: true }
    }
    if (p < paragraphs.length - 1) y += lineH * 0.35
  }
  return { lines, endY: y, overflow: y - lineH > maxY }
}

function makeRangeFn(cx0, cx1, exclusions, gap) {
  return (top, bottom) => {
    let x0 = cx0
    let x1 = cx1
    const mid = (cx0 + cx1) / 2
    for (const e of exclusions) {
      if (bottom < e.y || top > e.y + e.h) continue
      const straddles = e.x < mid && e.x + e.w > mid
      const rightSide = straddles ? e.x - x0 > x1 - (e.x + e.w) : e.x + e.w / 2 > mid
      if (rightSide) x1 = Math.min(x1, e.x - gap)
      else x0 = Math.max(x0, e.x + e.w + gap)
    }
    return [x0, x1]
  }
}

/* ---------- decorations ---------- */
function drawWashi(ctx, colorKey, len, thick) {
  const wc = WASHI_COLORS[colorKey] || WASHI_COLORS.sage
  const st = stickerImg(wc.id)
  if (!st || !st.img) return
  ctx.drawImage(st.img, -len / 2, -thick / 2, len, thick)
}

function drawPolaroidPin(ctx, photoCanvas, cx, cy, pw, rot, clip) {
  const ph = pw * 1.2
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.shadowColor = 'rgba(50,35,25,0.3)'
  ctx.shadowBlur = pw * 0.08
  ctx.shadowOffsetY = pw * 0.03
  ctx.fillStyle = '#fdfbf6'
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph)
  ctx.shadowColor = 'transparent'
  const m = pw * 0.065
  const iw = pw - m * 2
  const ih = ph - m - ph * 0.2
  if (photoCanvas) {
    const r = iw / ih
    const sr = photoCanvas.width / photoCanvas.height
    let sw = photoCanvas.width
    let sh = photoCanvas.height
    if (sr > r) sw = sh * r
    else sh = sw / r
    ctx.drawImage(photoCanvas, (photoCanvas.width - sw) / 2, (photoCanvas.height - sh) / 2, sw, sh, -pw / 2 + m, -ph / 2 + m, iw, ih)
  } else {
    ctx.fillStyle = '#e8dfd0'
    ctx.fillRect(-pw / 2 + m, -ph / 2 + m, iw, ih)
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = Math.max(1, pw * 0.004)
  ctx.strokeRect(-pw / 2 + m, -ph / 2 + m, iw, ih)
  // clip
  const svg = clip === 'clothespin' ? CLOTHESPIN_SVG : PAPERCLIP_SVG
  const img = getSvgImage('clip:' + clip, svg)
  if (img) {
    ctx.shadowColor = 'rgba(40,30,20,0.3)'
    ctx.shadowBlur = pw * 0.03
    ctx.shadowOffsetY = pw * 0.01
    if (clip === 'clothespin') {
      const h = pw * 0.55
      const w = (h * 64) / 190
      ctx.drawImage(img, -w / 2, -ph / 2 - h * 0.45, w, h)
    } else {
      const h = pw * 0.5
      const w = (h * 60) / 170
      ctx.drawImage(img, pw * 0.18, -ph / 2 - h * 0.3, w, h)
    }
  }
  ctx.restore()
  return { w: pw, h: ph }
}

function drawPostmark(ctx, cx, cy, r, ink, phraseDate) {
  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = r * 0.06
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = r * 0.03
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${r * 0.22}px "Courier Prime", monospace`
  ctx.fillText('AURA POST', cx, cy - r * 0.38)
  ctx.font = `700 ${r * 0.3}px "Courier Prime", monospace`
  ctx.fillText(phraseDate.toUpperCase(), cx, cy + r * 0.04, r * 1.45)
  ctx.font = `400 ${r * 0.18}px "Courier Prime", monospace`
  ctx.fillText('★ ★ ★', cx, cy + r * 0.42)
  // wavy cancellation lines
  ctx.lineWidth = r * 0.045
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    const y = cy - r * 0.35 + i * r * 0.35
    for (let k = 0; k <= 24; k++) {
      const x = cx - r * 1.1 - r * 1.5 * (k / 24)
      const yy = y + Math.sin(k * 0.9) * r * 0.08
      if (k === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  ctx.restore()
}

/* ---------- main ---------- */
export function renderLetter(ctx, W, H, letter, { photoCanvas = null } = {}) {
  const s = Math.min(W, H)
  const ink = (INK_MAP[letter.ink] || INK_MAP.sepia).color
  const rng = mulberry32(letter.seed || 7)
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  // desk
  const dg = ctx.createLinearGradient(0, 0, W, H)
  dg.addColorStop(0, '#ece3d5')
  dg.addColorStop(1, '#ddd1bd')
  ctx.fillStyle = dg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.beginPath()
  ctx.moveTo(-W * 0.2, 0)
  ctx.lineTo(W * 0.35, 0)
  ctx.lineTo(W * 0.05, H)
  ctx.lineTo(-W * 0.5, H)
  ctx.fill()

  const P = { x: W * 0.075, y: H * 0.055, w: W * 0.85, h: H * 0.89 }
  drawPaper(ctx, letter.paper, P, letter.seed || 7)

  const ps = Math.min(P.w, P.h)
  const pad = P.w * 0.09
  let cx0 = P.x + pad
  let cx1 = P.x + P.w - pad
  if (letter.paper === 'botanical') cx0 = P.x + P.w * 0.22
  if (letter.paper === 'grid') cx0 = P.x + P.w * 0.14
  if (letter.paper === 'deckle') cx1 = P.x + P.w * 0.56
  const top = P.y + P.h * 0.075
  const exclusions = []

  // photo pin
  let pinRect = null
  const pin = letter.photoPin || {}
  if (pin.enabled) {
    const pw = ps * 0.36
    const ph = pw * 1.2
    const corner = pin.corner || 'top-right'
    const right = corner.includes('right')
    const isTop = corner.includes('top')
    const pcx = right ? P.x + P.w - pw * 0.42 : P.x + pw * 0.42
    const pcy = isTop ? P.y + ph * 0.42 : P.y + P.h - ph * 0.5
    pinRect = { cx: pcx, cy: pcy, pw, rot: (right ? 1 : -1) * 0.1 }
    const bw = pw * 1.1
    const bh = ph * 1.1
    exclusions.push({ x: pcx - bw / 2, y: pcy - bh / 2, w: bw, h: bh })
  }

  // postmark
  const pmR = ps * 0.075
  if (letter.postmark && letter.paper !== 'deckle') {
    const onLeft = pin.enabled && (pin.corner || 'top-right') === 'top-right'
    const pmx = onLeft ? cx0 + pmR : cx1 - pmR
    const pmy = top + pmR
    const ex = onLeft ? pmx - pmR : pmx - pmR * 2.8
    exclusions.push({ x: ex, y: pmy - pmR, w: pmR * 3.8, h: pmR * 2.1, _pm: { x: pmx, y: pmy } })
  }

  // seal geometry (reserved before text)
  const seal = letter.seal || {}
  let sealRect = null
  if (seal.enabled) {
    const size = ps * 0.18
    let sx
    let sy
    if (seal.position === 'bottom-left') {
      sx = P.x + pad * 0.6 + size / 2
      sy = P.y + P.h - pad * 0.55 - size / 2
    } else if (seal.position === 'flap') {
      sx = P.x + P.w / 2
      sy = P.y + P.h - size * 0.25
    } else {
      sx = P.x + P.w - pad * 0.6 - size / 2
      sy = P.y + P.h - pad * 0.55 - size / 2
    }
    sealRect = { x: sx - size / 2, y: sy - size / 2, w: size, h: size }
    exclusions.push({ ...sealRect })
  }

  // botanical placement (planned before text so words flow around them)
  const corners = ['bottom-left', 'top-left', 'bottom-right', 'top-right'].filter((c) => {
    if (pin.enabled && c === (pin.corner || 'top-right')) return false
    if (seal.enabled && seal.position === c) return false
    if (seal.enabled && seal.position === 'flap' && c === 'bottom-right') return false
    const postmarkLeft = letter.postmark && letter.paper !== 'deckle' && pin.enabled && (pin.corner || 'top-right') === 'top-right'
    if (postmarkLeft && c === 'top-left') return false
    if (letter.postmark && letter.paper !== 'deckle' && !postmarkLeft && c === 'top-right') return false
    return true
  })
  const botanicalPlan = []
  ;(letter.botanicals || []).slice(0, corners.length).forEach((id, i) => {
    const st = stickerImg(id)
    if (!st || !st.img) return
    const corner = corners[i]
    const tall = st.def.h / st.def.w > 1.6
    const h = tall ? P.h * 0.3 : P.h * 0.2
    const w = (h * st.def.w) / st.def.h
    const isLeft = corner.includes('left')
    const isTop = corner.includes('top')
    const x = isLeft ? P.x + w * 0.35 : P.x + P.w - w * 0.35
    const yy = isTop ? P.y + h * 0.36 : P.y + P.h - h * 0.36
    let rot = (isLeft ? 1 : -1) * (0.3 + rng() * 0.25)
    if (isTop) rot = Math.PI + (isLeft ? -1 : 1) * (0.3 + rng() * 0.25)
    botanicalPlan.push({ st, x, yy, w, h, rot })
    // footprint of the (rotated) flower inside the page
    const fw = Math.abs(w * Math.cos(rot)) + Math.abs(h * Math.sin(rot))
    const fh = Math.abs(w * Math.sin(rot)) + Math.abs(h * Math.cos(rot))
    const head = isTop ? { y: yy, h: fh * 0.45 } : { y: yy - fh * 0.5, h: fh * 0.2 }
    exclusions.push({ x: isLeft ? P.x : x - fw * 0.3, y: head.y, w: isLeft ? x - P.x + fw * 0.3 : P.x + P.w - (x - fw * 0.3), h: head.h })
  })

  const gap = ps * 0.025
  const range = makeRangeFn(cx0, cx1, exclusions, gap)
  const align = letter.align || 'left'

  const placeText = (lineText, y, x0, x1, alignMode) => {
    if (alignMode === 'center') {
      ctx.textAlign = 'center'
      ctx.fillText(lineText, (x0 + x1) / 2, y)
    } else if (alignMode === 'right') {
      ctx.textAlign = 'right'
      ctx.fillText(lineText, x1, y)
    } else {
      ctx.textAlign = 'left'
      ctx.fillText(lineText, x0, y)
    }
  }

  // --- title ---
  ctx.fillStyle = ink
  ctx.textBaseline = 'alphabetic'
  const titleSize = ps * 0.07
  ctx.font = fontString('cormorant', titleSize, { italic: true, weight: 600 })
  let y = top + titleSize * 0.9
  if (letter.title) {
    const t = wrapFlow(ctx, letter.title, y, titleSize * 1.1, range, P.y + P.h)
    t.lines.forEach((l) => placeText(l.text, l.y, l.x0, l.x1, align === 'justify' ? 'left' : align))
    y = t.endY
  }
  // --- poetic stamp line ---
  if (letter.postmark) {
    const fs = ps * 0.026
    ctx.font = `400 ${fs}px "Courier Prime", monospace`
    ctx.globalAlpha = 0.72
    const [x0, x1] = range(y - fs, y)
    const line = `${letter.stampPhrase || 'Sent from a quiet morning'} — ${stampDate()}`
    placeText(line, y + fs * 0.2, x0, x1, align === 'justify' ? 'left' : align)
    ctx.globalAlpha = 1
    y += fs * 2.2
  } else y += ps * 0.02

  // --- body (auto-fit) ---
  const sigSize = ps * 0.06
  const bottomLimit = P.y + P.h - pad * 0.7 - sigSize * 2.6
  let size = (letter.size || 0.046) * ps
  const lh = letter.lineHeight || 1.45
  let flow
  for (let k = 0; k < 14; k++) {
    ctx.font = fontString(letter.font, size)
    flow = wrapFlow(ctx, letter.body || '', y + size, size * lh, range, bottomLimit)
    if (!flow.overflow || size < ps * 0.02) break
    size *= 0.92
  }
  ctx.font = fontString(letter.font, size)
  ctx.fillStyle = ink
  flow.lines.forEach((l) => {
    if (align === 'justify' && !l.last && l.words.length > 1) {
      const wordsW = l.words.reduce((a, w) => a + ctx.measureText(w).width, 0)
      const space = (l.x1 - l.x0 - wordsW) / (l.words.length - 1)
      if (space < size * 1.2) {
        let x = l.x0
        ctx.textAlign = 'left'
        l.words.forEach((w) => {
          ctx.fillText(w, x, l.y)
          x += ctx.measureText(w).width + space
        })
        return
      }
    }
    placeText(l.text, l.y, l.x0, l.x1, align === 'justify' ? 'left' : align)
  })

  // --- closing + signature ---
  let sy = flow.endY + size * 0.35
  if (letter.closing) {
    ctx.font = fontString(letter.font, size * 0.95)
    const [x0, x1] = range(sy - size, sy + size * 0.3)
    placeText(letter.closing, sy, x0, x1, align === 'left' || align === 'justify' ? 'right' : align)
    sy += sigSize * 1.15
  }
  if (letter.signature) {
    ctx.font = fontString('nothing', sigSize)
    const [x0, x1] = range(sy - sigSize, sy + sigSize * 0.3)
    placeText(letter.signature, sy, x0, x1, align === 'left' || align === 'justify' ? 'right' : align)
  }

  // --- postmark drawing ---
  const pm = exclusions.find((e) => e._pm)
  if (pm) drawPostmark(ctx, pm._pm.x, pm._pm.y, pmR, ink, stampDate())

  // --- botanicals with washi tape ---
  botanicalPlan.forEach(({ st, x, yy, w, h, rot }) => {
    ctx.save()
    ctx.translate(x, yy)
    ctx.rotate(rot)
    ctx.shadowColor = 'rgba(60,40,25,0.22)'
    ctx.shadowBlur = ps * 0.012
    ctx.shadowOffsetY = ps * 0.005
    ctx.drawImage(st.img, -w / 2, -h / 2, w, h)
    ctx.shadowColor = 'transparent'
    ctx.translate(0, h * 0.24)
    ctx.rotate((rng() - 0.5) * 0.3)
    drawWashi(ctx, letter.washi, Math.max(w * 1.5, ps * 0.16), ps * 0.042)
    ctx.restore()
  })

  // --- polaroid pin ---
  if (pinRect) drawPolaroidPin(ctx, photoCanvas, pinRect.cx, pinRect.cy, pinRect.pw, pinRect.rot, pin.clip)

  // --- wax seal ---
  if (sealRect) {
    const svg = sealSvg(seal.style, seal.color, seal.monogram)
    const img = getSvgImage(`seal:${seal.style}:${seal.color}:${seal.monogram}`, svg)
    if (seal.position === 'flap') {
      // envelope flap peeking under the seal
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.beginPath()
      ctx.moveTo(P.x + P.w * 0.25, P.y + P.h)
      ctx.lineTo(P.x + P.w / 2, P.y + P.h - sealRect.h * 0.55)
      ctx.lineTo(P.x + P.w * 0.75, P.y + P.h)
      ctx.fill()
      ctx.restore()
    }
    if (img) {
      ctx.save()
      ctx.shadowColor = 'rgba(40,10,10,0.35)'
      ctx.shadowBlur = sealRect.w * 0.1
      ctx.shadowOffsetY = sealRect.w * 0.04
      ctx.translate(sealRect.x + sealRect.w / 2, sealRect.y + sealRect.h / 2)
      ctx.rotate(-0.12)
      ctx.drawImage(img, -sealRect.w / 2, -sealRect.h / 2, sealRect.w, sealRect.h)
      ctx.restore()
    }
  }
  ctx.restore()
}

export function letterAssetList(letter) {
  const list = []
  ;(letter.botanicals || []).forEach((id) => STICKER_MAP[id] && list.push(['st:' + id, STICKER_MAP[id].svg]))
  if (letter.paper === 'botanical') ['fern', 'eucalyptus', 'lavender'].forEach((id) => list.push(['st:' + id, STICKER_MAP[id].svg]))
  const wc = WASHI_COLORS[letter.washi] || WASHI_COLORS.sage
  list.push(['st:' + wc.id, STICKER_MAP[wc.id].svg])
  if (letter.seal?.enabled) {
    const s = letter.seal
    list.push([`seal:${s.style}:${s.color}:${s.monogram}`, sealSvg(s.style, s.color, s.monogram)])
  }
  if (letter.photoPin?.enabled) list.push(['clip:' + letter.photoPin.clip, letter.photoPin.clip === 'clothespin' ? CLOTHESPIN_SVG : PAPERCLIP_SVG])
  return list
}

export { roundRectPath }
