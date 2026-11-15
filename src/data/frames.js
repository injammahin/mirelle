import { discoverTemplates } from '../lib/templateFrames'

const CLASSIC = [
  { id: 'none', name: 'No Frame', hasCaption: false },
  { id: 'polaroid', name: 'Classic Polaroid', hasCaption: true, captionLabel: 'Polaroid caption', defaultCaption: 'romanticize your life' },
  { id: 'torn', name: 'Torn Journal', hasCaption: true, captionLabel: 'Journal note', defaultCaption: 'little moments, kept' },
  { id: 'film', name: '35mm Film Strip', hasCaption: true, captionLabel: 'Film label', defaultCaption: 'AURA 400 · 24' },
  { id: 'oval', name: 'Vintage Locket', hasCaption: false },
  { id: 'passepartout', name: 'Gallery Mat', hasCaption: true, captionLabel: 'Artwork title', defaultCaption: 'Untitled, 2026' },
  { id: 'lace', name: 'Coquette Lace', hasCaption: false },
  { id: 'y2k', name: 'Y2K Digicam', hasCaption: true, captionLabel: 'Timestamp', defaultCaption: '1998.08.14' },
].map((f) => ({ ...f, family: 'classic' }))

const TEMPLATES = discoverTemplates()

// Mutable on purpose: frames the user uploads are registered at runtime (see lib/customFrames.js).
export const FRAMES = [...TEMPLATES, ...CLASSIC]
export const FRAME_MAP = Object.fromEntries(FRAMES.map((f) => [f.id, f]))
export const DEFAULT_CAPTIONS = Object.fromEntries(CLASSIC.filter((f) => f.hasCaption).map((f) => [f.id, f.defaultCaption]))

export function registerFrame(f) {
  if (FRAME_MAP[f.id]) return
  FRAMES.unshift(f)
  FRAME_MAP[f.id] = f
}
export function unregisterFrame(id) {
  const i = FRAMES.findIndex((f) => f.id === id)
  if (i >= 0) FRAMES.splice(i, 1)
  delete FRAME_MAP[id]
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
export function frameFamilies() {
  const cats = [...new Set(FRAMES.filter((f) => f.kind === 'template' && !f.custom).map((f) => f.category))]
  return [
    { id: 'all', name: 'All' },
    ...(FRAMES.some((f) => f.custom) ? [{ id: 'tpl:mine', name: 'My Frames' }] : []),
    ...cats.map((c) => ({ id: 'tpl:' + c, name: cap(c.replace(/[-_]/g, ' ')) })),
    { id: 'classic', name: 'Classic' },
  ]
}
