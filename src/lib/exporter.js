// High-resolution export pipeline (PNG / JPG up to 4K) shared by the studio and Explore board.
import { loadImage, loadSvgImage } from './assets'
import { loadAllFonts } from '../data/fonts'
import { STICKER_MAP } from '../data/stickers'
import { SAMPLE_MAP } from '../data/samples'
import { ASPECTS } from '../data/filters'
import { makeCanvas, renderPhotoScene } from './photoRenderer'
import { FRAME_MAP } from '../data/frames'
import { loadTemplate } from './templateFrames'
import { prepareSticker } from './imageStickers'
import { renderLetter, letterAssetList } from './letterRenderer'

export const EXPORT_SIZES = [
  { id: 1, label: 'HD', px: 1080 },
  { id: 2, label: '2K', px: 2160 },
  { id: 3, label: '4K', px: 3240 },
]

export const dims = (aspect, width) => {
  const a = ASPECTS[aspect] || ASPECTS['4:5']
  return [Math.round(width), Math.round((width * a.h) / a.w)]
}

export async function preparePhoto(state) {
  await loadAllFonts()
  const img = await loadImage(state.photo.src, state.photo.src)
  const ids = new Set(state.layers.filter((l) => l.type === 'sticker').map((l) => l.stickerId))
  if (state.frameId === 'lace') ids.add('bow')
  await Promise.all([...ids].filter((id) => STICKER_MAP[id]).map((id) => (STICKER_MAP[id].kind === 'image' ? prepareSticker(STICKER_MAP[id]) : loadSvgImage('st:' + id, STICKER_MAP[id].svg)).catch(() => {})))
  const fr = FRAME_MAP[state.frameId]
  if (fr?.kind === 'template') await loadTemplate(fr).catch(() => {})
  return img
}

export async function renderPhotoCanvas(state, width, { cache = false } = {}) {
  const image = await preparePhoto(state)
  const [W, H] = dims(state.aspect, width)
  const c = makeCanvas(W, H)
  renderPhotoScene(c.getContext('2d'), W, H, { ...state, image }, { cache })
  return c
}

export async function renderLetterCanvas(state, width) {
  await loadAllFonts()
  await Promise.all(letterAssetList(state.letter).map(([k, svg]) => loadSvgImage(k, svg).catch(() => {})))
  let photoCanvas = null
  if (state.letter.photoPin?.enabled) photoCanvas = await renderPhotoCanvas({ ...state, aspect: '4:5' }, 800)
  const [W, H] = dims(state.aspect, width)
  const c = makeCanvas(W, H)
  renderLetter(c.getContext('2d'), W, H, state.letter, { photoCanvas })
  return c
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function exportArtwork(state, { kind, format = 'png', width = 2160 }) {
  const c = kind === 'letter' ? await renderLetterCanvas(state, width) : await renderPhotoCanvas(state, width)
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise((res) => c.toBlob(res, mime, 0.95))
  if (!blob) throw new Error('Export failed — try a smaller size')
  const stamp = new Date().toISOString().slice(0, 10)
  download(blob, `mirelle-${kind}-${state.aspect.replace(':', 'x')}-${c.width}px-${stamp}.${format}`)
  return { w: c.width, h: c.height }
}

/** One-tap "best quality" PNG: as large as the device can safely render (4K+ on desktop). */
export async function downloadBestPng(state, kind) {
  const a = ASPECTS[state.aspect] || ASPECTS['4:5']
  const mobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const maxPixels = mobile ? 16e6 : 33e6 // iOS Safari caps canvases at ~16.7 MP
  const width = Math.floor(Math.min(mobile ? 3240 : 4320, Math.sqrt((maxPixels * a.w) / a.h)))
  return exportArtwork(state, { kind, format: 'png', width })
}

/** Renders an Explore-board pin to a data URL. */
export async function renderPinImage(pin, width, letterState) {
  if (pin.kind === 'letter') {
    const c = await renderLetterCanvas({ ...letterState, aspect: pin.aspect, letter: pin.letter }, width)
    return c.toDataURL('image/jpeg', 0.9)
  }
  const sample = SAMPLE_MAP[pin.sampleId]
  const state = {
    photo: { src: sample.src },
    aspect: pin.aspect,
    adj: pin.recipe.adj,
    crop: { zoom: 1, x: 0, y: 0 },
    frameId: pin.recipe.frameId,
    captions: pin.recipe.captions,
    layers: pin.recipe.layers,
  }
  const c = await renderPhotoCanvas(state, width)
  return c.toDataURL('image/jpeg', 0.9)
}

export { download }
