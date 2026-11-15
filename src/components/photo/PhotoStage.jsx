import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCw, Trash2, Copy, Move, ImagePlus } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { ASPECTS } from '../../data/filters'
import { STICKER_MAP } from '../../data/stickers'
import { useAssetsVersion, useElementSize, useFontsVersion, useImage } from '../../lib/hooks'
import { cropWindow, getFrameLayout, measureTextLayer, renderPhotoScene } from '../../lib/photoRenderer'
import { clamp } from '../../lib/random'
import { loadImage } from '../../lib/assets'
import { fileToDataUrl } from './PhotosPanel'

function layerSize(l, dispW) {
  if (l.type === 'text') return measureTextLayer(l, dispW)
  const def = STICKER_MAP[l.stickerId]
  const w = l.w * dispW
  return { w, h: def ? (w * def.h) / def.w : w }
}

export default function PhotoStage() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const box = useElementSize(wrapRef)

  const aspect = useStudio((s) => s.aspect)
  const zoom = useStudio((s) => s.zoom)
  const photo = useStudio((s) => s.photo)
  const adj = useStudio((s) => s.adj)
  const crop = useStudio((s) => s.crop)
  const frameId = useStudio((s) => s.frameId)
  const captions = useStudio((s) => s.captions)
  const layers = useStudio((s) => s.layers)
  const selectedId = useStudio((s) => s.selectedId)
  const magicTick = useStudio((s) => s.magicTick)
  const { select, updateLayer, removeLayer, duplicateLayer, pushHistory } = useStudio.getState()

  const img = useImage(photo.src)
  const slotPhotos = useStudio((s) => s.slotPhotos)
  const slotCrops = useStudio((s) => s.slotCrops)
  // load each extra slot's own photo
  const [slotImages, setSlotImages] = useState({})
  useEffect(() => {
    let alive = true
    Promise.all(Object.entries(slotPhotos).map(([i, p]) => (p?.src ? loadImage(p.src, p.src).then((im) => [i, im]).catch(() => [i, null]) : [i, null]))).then(
      (pairs) => alive && setSlotImages(Object.fromEntries(pairs)),
    )
    return () => {
      alive = false
    }
  }, [slotPhotos])
  const av = useAssetsVersion()
  const fv = useFontsVersion()

  const asp = ASPECTS[aspect]
  const pad = box.w < 500 ? 14 : 36
  const fitW = Math.max(120, Math.min(box.w - pad * 2, ((box.h - pad * 2) * asp.w) / asp.h))
  const dispW = Math.round(fitW * zoom)
  const dispH = Math.round((dispW * asp.h) / asp.w)

  // ---- render ----
  useEffect(() => {
    const c = canvasRef.current
    if (!c || !dispW) return
    const raf = requestAnimationFrame(() => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const scale = Math.min(dpr, 3000 / dispW)
      const W = Math.round(dispW * scale)
      const H = Math.round(dispH * scale)
      if (c.width !== W) c.width = W
      if (c.height !== H) c.height = H
      renderPhotoScene(c.getContext('2d'), W, H, { image: img, adj, crop, frameId, captions, layers, slotImages, slotCrops })
    })
    return () => cancelAnimationFrame(raf)
  }, [img, adj, crop, frameId, captions, layers, slotImages, slotCrops, dispW, dispH, av, fv])

  // ---- keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const st = useStudio.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? st.redo() : st.undo()
        return
      }
      if (!st.selectedId) return
      const l = st.layers.find((x) => x.id === st.selectedId)
      if (!l) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        st.removeLayer(l.id)
      } else if (e.key === 'Escape') st.select(null)
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const d = e.shiftKey ? 0.02 : 0.004
        const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0
        const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0
        st.updateLayer(l.id, { x: l.x + dx, y: l.y + dy })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const boxes = useMemo(() => layers.map((l) => ({ l, ...layerSize(l, dispW) })), [layers, dispW, fv])

  // ---- pointer interactions ----
  const startMove = (e, l) => {
    e.stopPropagation()
    select(l.id)
    pushHistory()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { mode: 'move', id: l.id, sx: e.clientX, sy: e.clientY, lx: l.x, ly: l.y }
  }
  const startTransform = (e, l, size) => {
    e.stopPropagation()
    pushHistory()
    const rect = canvasRef.current.getBoundingClientRect()
    const cx = rect.left + l.x * rect.width
    const cy = rect.top + l.y * rect.height
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      mode: 'transform',
      id: l.id,
      cx,
      cy,
      a0: Math.atan2(e.clientY - cy, e.clientX - cx),
      d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1,
      rot0: l.rotation || 0,
      w0: l.w,
      size0: l.size,
      type: l.type,
    }
  }
  const onMove = (e) => {
    const d = dragRef.current
    if (!d || (d.mode !== 'move' && d.mode !== 'transform')) return
    if (d.mode === 'move') {
      updateLayer(d.id, { x: clamp(d.lx + (e.clientX - d.sx) / dispW, -0.15, 1.15), y: clamp(d.ly + (e.clientY - d.sy) / dispH, -0.15, 1.15) })
    } else {
      const a = Math.atan2(e.clientY - d.cy, e.clientX - d.cx)
      const k = Math.hypot(e.clientX - d.cx, e.clientY - d.cy) / d.d0
      let rot = d.rot0 + ((a - d.a0) * 180) / Math.PI
      rot = ((rot + 540) % 360) - 180
      if (!e.shiftKey) for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(rot - snap) < 4) rot = snap
      const patch = { rotation: Math.round(rot * 10) / 10 }
      if (d.type === 'text') patch.size = clamp(d.size0 * k, 0.015, 0.3)
      else patch.w = clamp(d.w0 * k, 0.04, 1.2)
      updateLayer(d.id, patch)
    }
  }
  const endDrag = () => (dragRef.current = null)

  // ---- Canva-style photo placement: drag to pan inside the frame slot, wheel / pinch to zoom ----
  const overlayRef = useRef(null)
  const pointers = useRef(new Map())
  const [panning, setPanning] = useState(false)
  const slotAt = (e) => {
    const r = overlayRef.current.getBoundingClientRect()
    const L = getFrameLayout(frameId, dispW, dispH)
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const all = L.slots || [L]
    const i = all.findIndex((S) => x >= S.x && x <= S.x + S.w && y >= S.y && y <= S.y + S.h)
    return i < 0 ? null : { ...all[i], index: i }
  }
  const activeSlot = useRef(0)
  const ownPhoto = (i) => i > 0 && !!useStudio.getState().slotPhotos[i]
  const cropOf = (i) => (ownPhoto(i) ? useStudio.getState().slotCrops[i] || { zoom: 1, x: 0, y: 0 } : useStudio.getState().crop)
  const imgOf = (i) => (ownPhoto(i) && slotImages[i]) || img
  const setCropXY = (patch, i = activeSlot.current) =>
    ownPhoto(i)
      ? useStudio.setState((st) => ({ slotCrops: { ...st.slotCrops, [i]: { ...(st.slotCrops[i] || { zoom: 1, x: 0, y: 0 }), ...patch } } }))
      : useStudio.setState((st) => ({ crop: { ...st.crop, ...patch } }))
  const onStagePointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    // second finger: pinch + twist the selected sticker/text (like other mobile editors)
    if (pointers.current.size === 2) {
      const st = useStudio.getState()
      const sel = st.layers.find((l) => l.id === st.selectedId)
      if (sel) {
        st.pushHistory()
        const [a, b] = [...pointers.current.values()]
        dragRef.current = { mode: 'pinchLayer', id: sel.id, type: sel.type, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), w0: sel.w, size0: sel.size, rot0: sel.rotation || 0 }
        return
      }
    }
    if (e.target !== e.currentTarget || !img) return
    const L = slotAt(e)
    if (!L) return
    e.currentTarget.setPointerCapture(e.pointerId)
    if (pointers.current.size === 1) activeSlot.current = L.index
    const c = cropOf(activeSlot.current)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      dragRef.current = { mode: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: c.zoom }
      return
    }
    pushHistory()
    setPanning(true)
    dragRef.current = { mode: 'pan', sx: e.clientX, sy: e.clientY, x0: c.x, y0: c.y, win: cropWindow(imgOf(L.index), L.w, L.h, c.zoom), Lw: L.w, Lh: L.h }
  }
  const onStagePointerMove = (e) => {
    const d = dragRef.current
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!d) {
      if (e.target === e.currentTarget && img) e.currentTarget.style.cursor = slotAt(e) ? 'grab' : ''
      return
    }
    if (d.mode === 'pinchLayer') {
      if (pointers.current.size < 2) return
      const [a, b] = [...pointers.current.values()]
      const k = Math.hypot(a.x - b.x, a.y - b.y) / d.d0
      let rot = d.rot0 + ((Math.atan2(b.y - a.y, b.x - a.x) - d.a0) * 180) / Math.PI
      rot = ((rot + 540) % 360) - 180
      for (const snap of [-180, -90, 0, 90, 180]) if (Math.abs(rot - snap) < 3) rot = snap
      const patch = { rotation: Math.round(rot * 10) / 10 }
      if (d.type === 'text') patch.size = clamp(d.size0 * k, 0.015, 0.3)
      else patch.w = clamp(d.w0 * k, 0.04, 1.4)
      updateLayer(d.id, patch)
    } else if (d.mode === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      setCropXY({ zoom: clamp((d.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / d.d0, 1, 4) })
    } else if (d.mode === 'pan') {
      e.currentTarget.style.cursor = 'grabbing'
      const { win } = d
      const patch = {}
      if (win.mx > 0.5) patch.x = clamp(d.x0 - ((e.clientX - d.sx) * win.sw) / d.Lw / win.mx, -1, 1)
      if (win.my > 0.5) patch.y = clamp(d.y0 - ((e.clientY - d.sy) * win.sh) / d.Lh / win.my, -1, 1)
      setCropXY(patch)
    } else onMove(e)
  }
  const onStagePointerUp = (e) => {
    pointers.current.delete(e.pointerId)
    if (dragRef.current?.mode === 'pinchLayer') dragRef.current = null
    if (dragRef.current?.mode === 'pan' || dragRef.current?.mode === 'pinch') {
      dragRef.current = null
      setPanning(false)
      e.currentTarget.style.cursor = ''
    }
  }
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const onWheel = (e) => {
      const S = e.target === el && slotAt(e)
      if (!S) return
      e.preventDefault()
      const z = cropOf(S.index).zoom
      setCropXY({ zoom: clamp(z * Math.exp(-e.deltaY * 0.0015), 1, 4) }, S.index)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })
  const layoutNow = getFrameLayout(frameId, dispW, dispH)
  const slotBox = panning ? (layoutNow.slots || [layoutNow])[activeSlot.current] || layoutNow : null
  const multiSlots = layoutNow.slots?.length > 1 ? layoutNow.slots : []
  const slotFileRef = useRef(null)
  const pickSlot = useRef(0)

  return (
    <div ref={wrapRef} className="desk-texture soft-scroll relative h-full w-full overflow-auto" onPointerDown={() => select(null)}>
      <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding: pad, width: dispW + pad * 2 > box.w ? dispW + pad * 2 : undefined, height: dispH + pad * 2 > box.h ? dispH + pad * 2 : undefined }}>
        <motion.div layout className="relative shrink-0 rounded-[6px] shadow-lift" style={{ width: dispW, height: dispH }}>
          <canvas ref={canvasRef} className="block h-full w-full rounded-[6px]" style={{ width: dispW, height: dispH }} />
          <motion.div key={frameId} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 4.5, times: [0, 0.1, 0.8, 1] }} className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-espresso shadow-soft">
            <Move size={11} /> Drag to reposition · scroll or pinch to zoom
          </motion.div>

          {/* magic shimmer */}
          <AnimatePresence>
            {magicTick > 0 && (
              <motion.div key={magicTick} className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.4, delay: 0.5 }}>
                <motion.div className="absolute inset-y-0 w-1/2" style={{ background: 'linear-gradient(100deg, transparent, rgba(255,240,210,.75), transparent)' }} initial={{ x: '-120%' }} animate={{ x: '260%' }} transition={{ duration: 1, ease: 'easeInOut' }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* multi-photo frames: a different photo for each slot */}
          {multiSlots.map((S, i) => (
            <button
              key={i}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                pickSlot.current = i
                slotFileRef.current?.click()
              }}
              className="absolute z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold text-espresso shadow-soft backdrop-blur transition hover:bg-white"
              style={{ left: S.x + S.w / 2, top: S.y + S.h - 30 }}
              title={`Change photo ${i + 1}`}
            >
              <ImagePlus size={12} /> Photo {i + 1}
            </button>
          ))}
          <input
            ref={slotFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              const src = await fileToDataUrl(file)
              useStudio.getState().setSlotPhoto(pickSlot.current, { src, name: file.name, sampleId: null })
            }}
          />

          {/* placement outline while dragging the photo */}
          {slotBox && <div className="pointer-events-none absolute z-10 border-2 border-white/90 shadow-[0_0_0_1px_rgba(44,37,35,.35)]" style={{ left: slotBox.x, top: slotBox.y, width: slotBox.w, height: slotBox.h }} />}

          {/* interaction overlay */}
          <div ref={overlayRef} className="absolute inset-0 touch-none" onPointerDown={onStagePointerDown} onPointerMove={onStagePointerMove} onPointerUp={onStagePointerUp} onPointerCancel={onStagePointerUp} onDoubleClick={(e) => {
            const S = e.target === e.currentTarget && slotAt(e)
            if (S) setCropXY({ zoom: 1, x: 0, y: 0 }, S.index)
          }}>
            {boxes.map(({ l, w, h }) => {
              const sel = l.id === selectedId
              return (
                <div
                  key={l.id}
                  onPointerDown={(e) => startMove(e, l)}
                  onPointerMove={onMove}
                  onPointerUp={endDrag}
                  onDoubleClick={() => l.type === 'text' && select(l.id)}
                  className={`absolute touch-none ${sel ? 'cursor-move' : 'cursor-pointer'}`}
                  style={{ left: l.x * dispW, top: l.y * dispH, width: w, height: h, transform: `translate(-50%,-50%) rotate(${l.rotation || 0}deg)` }}
                >
                  {sel && (
                    <>
                      <div className="pointer-events-none absolute -inset-1 rounded-md border-[1.5px] border-dashed border-white shadow-[0_0_0_1px_rgba(44,37,35,.35)]" />
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removeLayer(l.id)} className="absolute -left-4 -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white text-espresso shadow-soft hover:text-red-600" title="Delete">
                        <Trash2 size={13} />
                      </button>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={() => duplicateLayer(l.id)} className="absolute -right-4 -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white text-espresso shadow-soft" title="Duplicate">
                        <Copy size={13} />
                      </button>
                      <div onPointerDown={(e) => startTransform(e, l)} onPointerMove={onMove} onPointerUp={endDrag} className="absolute -bottom-4 -right-4 flex h-8 w-8 cursor-nwse-resize touch-none items-center justify-center rounded-full bg-terracotta text-white shadow-glow" title="Drag to rotate & resize">
                        <RotateCw size={14} />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
