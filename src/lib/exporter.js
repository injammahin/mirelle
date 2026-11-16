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
import { IMAGE_PAPER_MAP } from '../data/letterPapers'
import { sealById } from '../data/sealImages'
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
  if (!state.photo?.src) throw new Error('Add a photo first ✨')
  const img = await loadImage(state.photo.src, state.photo.src)
  const ids = new Set(state.layers.filter((l) => l.type === 'sticker').map((l) => l.stickerId))
  if (state.frameId === 'lace') ids.add('bow')
  await Promise.all([...ids].filter((id) => STICKER_MAP[id]).map((id) => (STICKER_MAP[id].kind === 'image' ? prepareSticker(STICKER_MAP[id]) : loadSvgImage('st:' + id, STICKER_MAP[id].svg)).catch(() => {})))
  const fr = FRAME_MAP[state.frameId]
  if (fr?.kind === 'template') await loadTemplate(fr).catch(() => {})
  state.__slotImages = {}
  for (const [i, p] of Object.entries(state.slotPhotos || {})) if (p?.src) state.__slotImages[i] = await loadImage(p.src, p.src).catch(() => null)
  return img
}

export async function renderPhotoCanvas(state, width, { cache = false } = {}) {
  state = { ...state }
  const image = await preparePhoto(state)
  const [W, H] = dims(state.aspect, width)
  const c = makeCanvas(W, H)
  renderPhotoScene(c.getContext('2d'), W, H, { ...state, image, slotImages: state.__slotImages }, { cache })
  return c
}

export async function renderLetterCanvas(state, width) {
  await loadAllFonts()
  await Promise.all(letterAssetList(state.letter).map(([k, svg]) => loadSvgImage(k, svg).catch(() => {})))
  if (state.letter.seal?.enabled) {
    const sd = sealById(state.letter.seal.style)
    await loadImage(sd.src, sd.src).catch(() => {})
  }
  const ip = IMAGE_PAPER_MAP[state.letter.paper]
  if (ip) await loadImage(ip.src, ip.src).catch(() => {})
  await Promise.all((state.letter.layers || []).map((l) => STICKER_MAP[l.stickerId]).filter(Boolean).map((d) => (d.kind === 'image' ? prepareSticker(d) : loadSvgImage('st:' + d.id, d.svg)).catch(() => {})))
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

/** Phones/tablets that can hand a file to the system share sheet ("Save Image" -> Photos). */
export function canSaveToPhotos() {
  try {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
    return mobile && !!navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}

export async function renderArtworkBlob(state, { kind, format = 'png', width = 2160 }) {
  const c = kind === 'letter' ? await renderLetterCanvas(state, width) : await renderPhotoCanvas(state, width)
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise((res) => c.toBlob(res, mime, 0.95))
  if (!blob) throw new Error('Export failed — try a smaller size')
  const stamp = new Date().toISOString().slice(0, 10)
  return { blob, name: `mirelle-${kind}-${state.aspect.replace(':', 'x')}-${c.width}px-${stamp}.${format}`, w: c.width, h: c.height }
}

/** Renders and delivers the image: share-sheet hand-off on phones (Save to Photos), download elsewhere. */
export async function exportArtwork(state, opts) {
  const out = await renderArtworkBlob(state, opts)
  if (canSaveToPhotos()) {
    // the share sheet needs a fresh tap, so park the file and let SaveSheet ask for it
    state.setReadyExport?.(out)
    return { w: out.w, h: out.h, pending: true }
  }
  download(out.blob, out.name)
  return { w: out.w, h: out.h }
}

/** Called from a tap in SaveSheet. Falls back to a normal download if sharing is refused. */
export async function saveToPhotos({ blob, name }) {
  const file = new File([blob], name, { type: blob.type })
  try {
    await navigator.share({ files: [file], title: 'Mirelle' })
    return true
  } catch (e) {
    if (e?.name === 'AbortError') return false
    download(blob, name)
    return true
  }
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

/** Deliver any finished canvas: Save to Photos sheet on phones, download elsewhere. */
export async function deliverCanvas(canvas, name, setReadyExport, format = 'png') {
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.95))
  if (!blob) throw new Error('Export failed')
  const out = { blob, name, w: canvas.width, h: canvas.height }
  if (canSaveToPhotos() && setReadyExport) {
    setReadyExport(out)
    return { ...out, pending: true }
  }
  download(blob, name)
  return out
}

/** Story (1080×1920) version of the current photo or letter. */
export async function exportStory(state, kind) {
  const { makeStory } = await import('./story')
  const c = kind === 'letter' ? await renderLetterCanvas(state, 1600) : await renderPhotoCanvas(state, 1600)
  const story = makeStory(c, { radius: kind === 'letter' ? 0.006 : 0.014 })
  return deliverCanvas(story, `mirelle-story-${new Date().toISOString().slice(0, 10)}.jpg`, state.setReadyExport, 'jpg')
}
