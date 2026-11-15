// ✨ Auto-Aesthetic engine — builds a cohesive "recipe" for a vibe:
// filter + complementary frame + 2–3 tastefully placed stickers + caption + grain.
import { VIBE_MAP } from '../data/vibes'
import { FILTER_MAP } from '../data/filters'
import { FRAME_MAP } from '../data/frames'
import { STICKER_MAP } from '../data/stickers'
import { ASPECTS } from '../data/filters'
import { PAPERS, STAMP_PHRASES } from '../data/letter'
import { getFrameLayout } from './photoRenderer'
import { pick, rand, shuffle, uid, clamp } from './random'

const SLOTS = {
  'tl-tape': { u: 0.03, v: 0.02, rot: [-48, -36], occupies: 'tl' },
  'tr-tape': { u: 0.97, v: 0.02, rot: [36, 48], occupies: 'tr' },
  'top-tape': { u: 0.5, v: -0.01, rot: [-5, 5], occupies: 'top' },
  tl: { u: 0.12, v: 0.12, rot: [160, 200], occupies: 'tl' },
  tr: { u: 0.88, v: 0.12, rot: [-18, 18], occupies: 'tr' },
  bl: { u: 0.12, v: 0.86, rot: [8, 30], occupies: 'bl' },
  br: { u: 0.88, v: 0.86, rot: [-30, -8], occupies: 'br' },
}
const PREFS = {
  tape: ['tl-tape', 'tr-tape', 'top-tape'],
  botanical: ['bl', 'br', 'tl'],
  charm: ['tr', 'tl', 'br', 'bl'],
  sparkle: ['tr', 'tl', 'bl'],
  stain: ['br', 'bl'],
}

// ---- Auto with the real Pinterest frames + stickers, matched to the vibe ----
const AUTO = {
  coquette: {
    frames: ['romantic-cherry-blossom-bow', 'romantic-pink-hibiscus-paper', 'romantic-hibiscus-duo', 'floral-bougainvillea-wall', 'floral-instagram-bougainvillea', 'desi-bougainvillea-duo'],
    stickers: ['charms-pink-bow', 'charms-fingerprint-heart', 'flowers-pink-lily-sticker', 'flowers-sheer-blossom', 'flowers-pink-hibiscus', 'charms-heart-hands', 'bouquets-sunflowers-pink-bow', 'flowers-pink-lily'],
  },
  darkAcademia: {
    frames: ['vintage-vintage-1979', 'vintage-make-today-beautiful', 'romantic-burgundy-gallery', 'floral-midnight-ocean', 'floral-hibiscus-wine'],
    stickers: ['vintage-collecting-moments', 'vintage-forget-me-not-page', 'vintage-botanical-scrap', 'vintage-books-and-sunflowers', 'charms-halftone-camera', 'flowers-pressed-cosmos', 'flowers-burgundy-cosmos', 'bouquets-red-tulips'],
  },
  softBotanical: {
    frames: ['sunflower-daisy-field', 'floral-lotus-duo', 'floral-ocean-pearl-bloom', 'floral-sunflower-scrapbook', 'sunflower-sunflower-post', 'sunflower-golden-polaroid-duo'],
    stickers: ['flowers-daisy', 'flowers-white-cosmos', 'bouquets-lavender-bunch', 'bouquets-daisy-bouquet', 'flowers-sunflower-sticker', 'flowers-yellow-gerbera', 'charms-monarch-butterfly', 'flowers-watercolor-lotus'],
  },
  vintage90s: {
    frames: ['sunflower-sunflower-polaroid', 'sunflower-golden-polaroid-duo', 'vintage-vintage-1979', 'desi-desi-torn-paper', 'vintage-make-today-beautiful'],
    stickers: ['charms-cream-camera', 'charms-blue-instax', 'charms-sunflower-instax', 'charms-halftone-camera', 'vintage-sunflower-tape', 'vintage-daisy-love-note', 'bouquets-wildflower-newspaper'],
  },
  minimalEditorial: {
    frames: ['sunflower-sunflower-glass', 'sunflower-sunflower-night', 'desi-desi-core', 'floral-hibiscus-wine', 'floral-ocean-pearl-bloom'],
    stickers: ['charms-evil-eye', 'flowers-plumeria', 'flowers-yellow-lily', 'charms-gingham-bow', 'flowers-watercolor-lotus', 'flowers-sunflower-night'],
  },
}

/** Picks a real frame for the vibe (different from the current one). Load it before createAutoRecipe. */
export function pickAutoFrame(vibeId, currentId, rng = Math.random) {
  const ids = (AUTO[vibeId] || AUTO.coquette).frames.map((f) => 'tpl-' + f).filter((id) => FRAME_MAP[id])
  const pool = ids.filter((id) => id !== currentId)
  return pool.length ? pick(pool, rng) : ids[0] || null
}

export function autoStickerIds(vibeId, rng = Math.random) {
  const ids = (AUTO[vibeId] || AUTO.coquette).stickers.map((s) => 'img-' + s).filter((id) => STICKER_MAP[id])
  return shuffle(ids, rng).slice(0, rng() > 0.35 ? 2 : 1)
}

/** Full design: real frame + soft vibe filter + 1-2 themed stickers tucked on the photo corners (never on the face). */
export function createAutoRecipe(vibeId, frameId, aspectKey, stickerIds, rng = Math.random) {
  const vibe = VIBE_MAP[vibeId] || VIBE_MAP.coquette
  const filterId = pick(vibe.filters, rng)
  const base = FILTER_MAP[filterId].params
  // the frame already colour-grades the photo, so keep the filter gentle
  const soft = (v) => Math.round((v || 0) * 0.55)
  const adj = { ...base, brightness: soft(base.brightness), contrast: soft(base.contrast), saturation: soft(base.saturation), warmth: soft(base.warmth), fade: soft(base.fade), vignette: soft(base.vignette), grain: Math.min(14, base.grain || 0), leak: 0, dateStamp: false, blur: 0 }
  const asp = ASPECTS[aspectKey] || ASPECTS['9:16']
  const W = 1000
  const H = (1000 * asp.h) / asp.w
  const L0 = getFrameLayout(frameId, W, H)
  const slots = L0.slots || [L0]
  const last = slots[slots.length - 1]
  // corners of the photo card, overlapping its edge a little (bottom corners first: faces sit up top)
  const bottom = shuffle([{ s: last, u: 0.94, v: 0.94, rot: [-14, 4] }, { s: last, u: 0.06, v: 0.93, rot: [-6, 12] }], rng)
  const top = shuffle([{ s: slots[0], u: 0.95, v: 0.05, rot: [6, 18] }, { s: slots[0], u: 0.05, v: 0.06, rot: [-18, -6] }], rng)
  const spots = [bottom[0], top[0], bottom[1]]
  const layers = stickerIds.map((id, i) => {
    const sp = spots[i]
    const def = STICKER_MAP[id]
    const tall = def.h && def.w ? def.h / def.w : 1
    return {
      id: uid(),
      type: 'sticker',
      stickerId: id,
      x: (sp.s.x + sp.u * sp.s.w) / W,
      y: (sp.s.y + sp.v * sp.s.h) / H,
      w: clamp(rand(0.2, 0.26, rng) / Math.max(1, tall * 0.8), 0.13, 0.28),
      rotation: Math.round(rand(sp.rot[0], sp.rot[1], rng)),
      opacity: 1,
      flip: false,
    }
  })
  return { filterId, adj, frameId, captions: {}, layers, aspect: aspectKey, summary: `${vibe.name} · ${FRAME_MAP[frameId].name}` }
}

export function createRecipe(vibeId, aspectKey = '4:5', rng = Math.random) {
  const vibe = VIBE_MAP[vibeId] || VIBE_MAP.coquette
  const asp = ASPECTS[aspectKey] || ASPECTS['4:5']
  const W = 1000
  const H = (1000 * asp.h) / asp.w
  const filterId = pick(vibe.filters, rng)
  const base = FILTER_MAP[filterId].params
  const j = (v, n) => clamp(Math.round(v + rand(-n, n, rng)), -100, 100)
  const adj = { ...base, brightness: j(base.brightness, 4), contrast: j(base.contrast, 4), warmth: j(base.warmth, 5), grain: Math.max(base.grain, 8) }

  const frameId = pick(vibe.frames, rng)
  const frame = FRAME_MAP[frameId]
  const L = getFrameLayout(frameId, W, H)
  const caption = pick(vibe.captions, rng)
  const captions = {}
  if (frame.hasCaption) {
    if (frameId === 'y2k') captions.y2k = /\d{4}\.\d{2}\.\d{2}/.test(caption) ? caption : '1998.08.14'
    else if (frameId === 'film') captions.film = 'AURA 400 · 24'
    else captions[frameId] = caption
  }

  // stickers
  const count = Math.min(vibe.maxStickers || 3, rng() > 0.45 ? 3 : 2)
  // use the real image stickers (any category); fall back to the vibe's list if none are bundled
  const real = Object.values(STICKER_MAP).filter((d) => d.kind === 'image' && !d.custom).map((d) => d.id)
  const pool = shuffle(real.length ? real : vibe.stickers, rng)
  const chosen = []
  const kinds = new Set()
  for (const id of pool) {
    const k = STICKER_MAP[id].kind
    if ((k === 'tape' || k === 'stain') && kinds.has(k)) continue
    if (frameId === 'lace' && id === 'bow') continue
    chosen.push(id)
    kinds.add(k)
    if (chosen.length >= count) break
  }
  const used = new Set()
  if (frameId === 'lace') used.add('top')
  const layers = []
  for (const id of chosen) {
    const def = STICKER_MAP[id]
    const slotId = (PREFS[def.kind === 'image' ? 'charm' : def.kind] || PREFS.charm).find((sid) => !used.has(SLOTS[sid].occupies))
    if (!slotId) continue
    const slot = SLOTS[slotId]
    used.add(slot.occupies)
    const x = (L.x + (slot.u + rand(-0.025, 0.025, rng)) * L.w) / W
    const y = (L.y + (slot.v + rand(-0.02, 0.02, rng)) * L.h) / H
    layers.push({
      id: uid(),
      type: 'sticker',
      stickerId: id,
      x,
      y,
      w: (def.kind === 'image' ? 0.24 : def.defaultW) * rand(0.9, 1.15, rng),
      rotation: Math.round(rand(slot.rot[0], slot.rot[1], rng)),
      opacity: def.kind === 'stain' ? 0.6 : 1,
      flip: rng() > 0.6,
    })
  }

  if (!frame.hasCaption && rng() > 0.25) {
    layers.push({
      id: uid(),
      type: 'text',
      text: caption,
      font: pick(vibe.fonts, rng),
      color: pick(vibe.textColors, rng),
      size: 0.062,
      shadow: true,
      arc: vibe.arc || 0,
      x: 0.5,
      y: (L.y + L.h * 0.85) / H,
      rotation: 0,
      opacity: 1,
      letterSpacing: vibe.id === 'minimalEditorial' ? 12 : 0,
    })
  }

  return { filterId, adj, frameId, captions, layers, summary: `${vibe.name} · ${FILTER_MAP[filterId].name} + ${frame.name}` }
}

export function createLetterRecipe(vibeId, rng = Math.random) {
  const v = (VIBE_MAP[vibeId] || VIBE_MAP.coquette).letter
  const botanicals = shuffle(v.botanicals, rng).slice(0, Math.max(1, Math.min(v.botanicals.length, rng() > 0.5 ? 2 : 1 + Math.round(rng()))))
  return {
    paper: pick(v.papers, rng) || pick(PAPERS, rng).id,
    font: pick(v.fonts, rng),
    ink: pick(v.inks, rng),
    washi: pick(v.washi, rng),
    botanicals,
    stampPhrase: pick(STAMP_PHRASES, rng),
    seed: Math.floor(rng() * 1000),
    seal: { enabled: true, style: pick(v.seals, rng), color: pick(v.sealColors, rng), position: rng() > 0.7 ? 'flap' : 'bottom-right' },
  }
}
