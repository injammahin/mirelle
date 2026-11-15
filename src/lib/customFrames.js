// User-uploaded frame templates and stickers, kept in IndexedDB so they survive reloads.
import { registerFrame, unregisterFrame } from '../data/frames'
import { makeTemplateFrame } from './templateFrames'
import { uid } from './random'
import { makeImageSticker, registerSticker, unregisterSticker, prepareSticker } from './imageStickers'

const DB = 'auracraft'
const STORE = 'frames'

function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function tx(mode, fn) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode)
    const r = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(r?.result)
    t.onerror = () => reject(t.error)
  })
}

const toFrame = (rec) => makeTemplateFrame({ id: rec.id, name: rec.name, src: URL.createObjectURL(rec.blob), category: 'mine', custom: true })

export async function loadCustomFrames() {
  try {
    const recs = (await tx('readonly', (s) => s.getAll())) || []
    recs.sort((a, b) => a.added - b.added)
    recs.filter((r) => r.type !== 'sticker').forEach((r) => registerFrame(toFrame(r)))
    recs.filter((r) => r.type === 'sticker').forEach((r) => registerSticker(toSticker(r)))
    return recs.length
  } catch {
    return 0
  }
}

export async function addCustomFrame(file) {
  const rec = { id: 'tpl-mine-' + uid(), name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My frame', blob: file, added: Date.now() }
  try {
    await tx('readwrite', (s) => s.put(rec))
  } catch {
    /* private mode: keep it for this session only */
  }
  const f = toFrame(rec)
  registerFrame(f)
  return f
}

export async function removeCustomFrame(id) {
  unregisterFrame(id)
  try {
    await tx('readwrite', (s) => s.delete(id))
  } catch {
    /* ignore */
  }
}

/* ---------------- stickers ---------------- */
const toSticker = (rec) => makeImageSticker({ id: rec.id, name: rec.name, src: URL.createObjectURL(rec.blob), category: 'mine', custom: true })

export async function addCustomSticker(file) {
  const rec = { id: 'img-mine-' + uid(), type: 'sticker', name: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'My sticker', blob: file, added: Date.now() }
  try {
    await tx('readwrite', (s) => s.put(rec))
  } catch {
    /* private mode: session only */
  }
  const def = registerSticker(toSticker(rec))
  await prepareSticker(def)
  return def
}

export async function removeCustomSticker(id) {
  unregisterSticker(id)
  try {
    await tx('readwrite', (s) => s.delete(id))
  } catch {
    /* ignore */
  }
}
