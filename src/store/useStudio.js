import { create } from 'zustand'
import { FILTER_MAP } from '../data/filters'
import { DEFAULT_CAPTIONS, FRAME_MAP } from '../data/frames'
import { STICKER_MAP } from '../data/stickers'
import { SAMPLE_MAP } from '../data/samples'
import { exampleFor } from '../data/examples'
import { DEFAULT_LETTER } from '../data/letter'
import { uid, clamp } from '../lib/random'
import { templateAspect } from '../lib/templateFrames'
import { loadCustomFrames } from '../lib/customFrames'
import { discoverStickers } from '../lib/imageStickers'

discoverStickers()

const snapshot = (s) => ({ filterId: s.filterId, adj: s.adj, crop: s.crop, frameId: s.frameId, captions: s.captions, layers: s.layers })

// Canvas starts clean: stickers only appear when the user adds them.
const initialLayers = []

export const useStudio = create((set, get) => ({
  // ----- navigation -----
  mode: 'explore', // 'explore' | 'photo' | 'letter'
  setMode: (mode) => set({ mode, selectedId: null }),
  aspect: '4:5',
  setAspect: (aspect) => set({ aspect }),
  zoom: 1,
  setZoom: (zoom) => set({ zoom: clamp(zoom, 0.5, 2.5) }),

  // ----- photo -----
  photo: exampleFor(0) ? { src: exampleFor(0).src, name: exampleFor(0).name, sampleId: 'example' } : { src: SAMPLE_MAP.coffee.src, name: SAMPLE_MAP.coffee.name, sampleId: 'coffee' },
  setPhoto: (photo) => set({ photo, crop: { zoom: 1, x: 0, y: 0 } }),
  filterId: 'golden-hour',
  adj: { ...FILTER_MAP['golden-hour'].params },
  crop: { zoom: 1, x: 0, y: 0 },
  frameId: 'polaroid',
  captions: { ...DEFAULT_CAPTIONS },
  layers: initialLayers,
  selectedId: null,
  vibe: 'coquette',

  applyFilter: (id) => {
    get().pushHistory()
    set({ filterId: id, adj: { ...FILTER_MAP[id].params } })
  },
  setAdj: (key, value) => set((s) => ({ adj: { ...s.adj, [key]: value } })),
  resetAdj: () => set((s) => ({ adj: { ...FILTER_MAP[s.filterId].params } })),
  setCrop: (key, value) => set((s) => ({ crop: { ...s.crop, [key]: value } })),
  setFrame: (frameId) => {
    get().pushHistory()
    const f = FRAME_MAP[frameId]
    // a new frame starts clean: no stickers carried over (undo brings them back)
    const patch = { frameId, crop: { zoom: 1, x: 0, y: 0 }, layers: get().layers.filter((l) => l.type !== 'sticker'), selectedId: null }
    if (f?.kind === 'template') patch.aspect = templateAspect(f)
    set(patch)
  },
  framesVersion: 0,
  bumpFrames: () => set((s) => ({ framesVersion: s.framesVersion + 1 })),
  setCaption: (frameId, text) => set((s) => ({ captions: { ...s.captions, [frameId]: text } })),
  setVibe: (vibe) => set({ vibe }),

  addSticker: (stickerId) => {
    const def = STICKER_MAP[stickerId]
    get().pushHistory()
    const n = get().layers.length
    const layer = { id: uid(), type: 'sticker', stickerId, x: 0.5 + ((n % 3) - 1) * 0.12, y: 0.45 + ((n % 4) - 1.5) * 0.06, w: def.defaultW, rotation: Math.round(Math.random() * 20 - 10), opacity: 1, flip: false }
    set((s) => ({ layers: [...s.layers, layer], selectedId: layer.id }))
  },
  addText: (text = 'romanticize your life', opts = {}) => {
    get().pushHistory()
    const layer = { id: uid(), type: 'text', text, font: 'caveat', color: '#fffaf3', size: 0.07, shadow: true, arc: 0, x: 0.5, y: 0.78, rotation: 0, opacity: 1, letterSpacing: 0, ...opts }
    set((s) => ({ layers: [...s.layers, layer], selectedId: layer.id }))
  },
  updateLayer: (id, patch) => set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  removeLayer: (id) => {
    get().pushHistory()
    set((s) => ({ layers: s.layers.filter((l) => l.id !== id), selectedId: s.selectedId === id ? null : s.selectedId }))
  },
  duplicateLayer: (id) => {
    const l = get().layers.find((x) => x.id === id)
    if (!l) return
    get().pushHistory()
    const copy = { ...l, id: uid(), x: Math.min(0.95, l.x + 0.05), y: Math.min(0.95, l.y + 0.05) }
    set((s) => ({ layers: [...s.layers, copy], selectedId: copy.id }))
  },
  moveLayer: (id, dir) =>
    set((s) => {
      const i = s.layers.findIndex((l) => l.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= s.layers.length) return {}
      const layers = [...s.layers]
      ;[layers[i], layers[j]] = [layers[j], layers[i]]
      return { layers }
    }),
  select: (selectedId) => set({ selectedId }),
  clearLayers: () => {
    get().pushHistory()
    set({ layers: [], selectedId: null })
  },

  applyRecipe: (r) => {
    get().pushHistory()
    set((s) => ({ filterId: r.filterId, adj: r.adj, frameId: r.frameId, captions: { ...s.captions, ...r.captions }, layers: r.layers, selectedId: null, magicTick: s.magicTick + 1 }))
  },
  loadShowcase: (pin) => {
    if (pin.kind === 'letter') {
      set((s) => ({ mode: 'letter', aspect: pin.aspect, letter: { ...pin.letter } , magicTick: s.magicTick + 1}))
      return
    }
    const sample = SAMPLE_MAP[pin.sampleId]
    get().pushHistory()
    set((s) => ({
      mode: 'photo',
      aspect: pin.aspect,
      vibe: pin.vibe,
      photo: { src: sample.src, name: sample.name, sampleId: sample.id },
      crop: { zoom: 1, x: 0, y: 0 },
      filterId: pin.recipe.filterId,
      adj: { ...pin.recipe.adj },
      frameId: pin.recipe.frameId,
      captions: { ...s.captions, ...pin.recipe.captions },
      layers: pin.recipe.layers.map((l) => ({ ...l })),
      selectedId: null,
      magicTick: s.magicTick + 1,
    }))
  },
  magicTick: 0,

  // ----- history -----
  history: [],
  future: [],
  pushHistory: () => set((s) => ({ history: [...s.history.slice(-39), snapshot(s)], future: [] })),
  undo: () => {
    const { history } = get()
    if (!history.length) return
    const prev = history[history.length - 1]
    set((s) => ({ ...prev, history: s.history.slice(0, -1), future: [snapshot(s), ...s.future].slice(0, 40), selectedId: null }))
  },
  redo: () => {
    const { future } = get()
    if (!future.length) return
    const next = future[0]
    set((s) => ({ ...next, future: s.future.slice(1), history: [...s.history, snapshot(s)], selectedId: null }))
  },

  // ----- letter -----
  letter: { ...DEFAULT_LETTER },
  setLetter: (patch) => set((s) => ({ letter: { ...s.letter, ...patch } })),
  setSeal: (patch) => set((s) => ({ letter: { ...s.letter, seal: { ...s.letter.seal, ...patch } } })),
  setPin: (patch) => set((s) => ({ letter: { ...s.letter, photoPin: { ...s.letter.photoPin, ...patch } } })),
  toggleBotanical: (id) =>
    set((s) => {
      const has = s.letter.botanicals.includes(id)
      const botanicals = has ? s.letter.botanicals.filter((b) => b !== id) : [...s.letter.botanicals, id].slice(-3)
      return { letter: { ...s.letter, botanicals } }
    }),

  // ----- ui -----
  toast: null,
  showToast: (text, tone = 'default') => {
    const id = uid()
    set({ toast: { id, text, tone } })
    setTimeout(() => get().toast?.id === id && set({ toast: null }), 2600)
  },
}))

export const frameHasCaption = (id) => !!FRAME_MAP[id]?.hasCaption

// Restore frames the user uploaded in earlier sessions.
loadCustomFrames().then((n) => n && useStudio.getState().bumpFrames())

/* ---- keep the user's place across reloads (tab session only) ---- */
const SESSION_KEY = 'mirelle:session'
const PERSIST = ['mode', 'aspect', 'frameId', 'crop', 'filterId', 'adj', 'captions', 'layers', 'vibe', 'photo']
try {
  const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
  if (saved) {
    const patch = {}
    for (const k of PERSIST) if (saved[k] !== undefined) patch[k] = saved[k]
    // only restore the frame if it still exists (uploaded frames load asynchronously)
    if (patch.frameId && !FRAME_MAP[patch.frameId] && !patch.frameId.startsWith('tpl-mine-')) delete patch.frameId
    // stickers placed from the bundled set must still exist
    if (patch.layers) patch.layers = patch.layers.filter((l) => l.type !== 'sticker' || STICKER_MAP[l.stickerId] || l.stickerId.startsWith('img-mine-'))
    useStudio.setState(patch)
  }
} catch {
  /* storage unavailable: start fresh */
}
let saveTimer
useStudio.subscribe((s) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const out = Object.fromEntries(PERSIST.map((k) => [k, s[k]]))
      // blob: URLs die with the page; very large data URLs would overflow storage
      if (out.photo?.src?.startsWith('blob:') || (out.photo?.src?.length || 0) > 3_000_000) delete out.photo
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(out))
    } catch {
      /* quota or private mode: ignore */
    }
  }, 300)
})
