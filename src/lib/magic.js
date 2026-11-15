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
  const pool = shuffle(vibe.stickers, rng)
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
    const slotId = (PREFS[def.kind] || PREFS.charm).find((sid) => !used.has(SLOTS[sid].occupies))
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
      w: def.defaultW * rand(0.9, 1.15, rng),
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
