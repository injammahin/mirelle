import { useRef } from 'react'
import { RotateCw, X } from 'lucide-react'
import { STICKER_MAP } from '../../data/stickers'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/**
 * Finger-first sticker editing on top of a preview.
 *   one finger  → drag            two fingers → pinch to resize + twist to rotate
 *   ×           → delete           corner handle → rotate/resize with a mouse
 * list items: { id, x, y, w (fractions of the layer), r (deg) }
 * visible=false: the canvas underneath already draws the stickers, this is only the touch layer.
 */
export default function GestureStickers({ list, setList, sel, setSel, visible = false, max = 0.9 }) {
  const box = useRef(null)
  const pts = useRef(new Map())
  const g = useRef(null)
  const upd = (i, p) => setList((l) => l.map((s, k) => (k === i ? { ...s, ...p } : s)))

  const begin = (i) => {
    const st = list[i]
    if (!st) return
    const p = [...pts.current.values()]
    if (p.length >= 2) {
      const [a, b] = p
      g.current = { mode: 'pinch', i, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), w0: st.w, r0: st.r || 0 }
    } else if (p.length === 1) {
      const r = box.current.getBoundingClientRect()
      g.current = { mode: 'move', i, sx: p[0].x, sy: p[0].y, x0: st.x, y0: st.y, W: r.width, H: r.height }
    }
  }

  const down = (e) => {
    const hit = e.target.closest('[data-st]')
    const idx = hit ? +hit.dataset.st : null
    if (idx == null && sel == null) return // let the page scroll / tap through
    if (idx == null && pts.current.size === 0) {
      setSel(null) // tap on empty space deselects
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const i = idx ?? sel
    if (idx != null && idx !== sel) setSel(idx)
    begin(i)
  }
  const move = (e) => {
    if (!pts.current.has(e.pointerId)) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const d = g.current
    if (!d) return
    if (d.mode === 'move') {
      upd(d.i, { x: clamp(d.x0 + (e.clientX - d.sx) / d.W, -0.05, 1.05), y: clamp(d.y0 + (e.clientY - d.sy) / d.H, -0.05, 1.05) })
    } else if (d.mode === 'pinch' && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()]
      let r = d.r0 + ((Math.atan2(b.y - a.y, b.x - a.x) - d.a0) * 180) / Math.PI
      r = ((r + 540) % 360) - 180
      for (const s of [-90, 0, 90]) if (Math.abs(r - s) < 3) r = s
      upd(d.i, { w: clamp(d.w0 * (Math.hypot(a.x - b.x, a.y - b.y) / d.d0), 0.05, max), r: Math.round(r * 10) / 10 })
    } else if (d.mode === 'handle') {
      const k = Math.hypot(e.clientX - d.cx, e.clientY - d.cy) / d.d0
      let r = d.r0 + ((Math.atan2(e.clientY - d.cy, e.clientX - d.cx) - d.a0) * 180) / Math.PI
      r = ((r + 540) % 360) - 180
      upd(d.i, { w: clamp(d.w0 * k, 0.05, max), r: Math.round(r * 10) / 10 })
    }
  }
  const up = (e) => {
    pts.current.delete(e.pointerId)
    const d = g.current
    if (!d) return
    if (pts.current.size === 0) g.current = null
    else begin(d.i) // one finger lifted: keep dragging with the other
  }
  const handleDown = (e, i) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const st = list[i]
    const r = box.current.getBoundingClientRect()
    const cx = r.left + st.x * r.width
    const cy = r.top + st.y * r.height
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    g.current = { mode: 'handle', i, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, a0: Math.atan2(e.clientY - cy, e.clientX - cx), w0: st.w, r0: st.r || 0 }
  }

  return (
    <div
      ref={box}
      className="absolute inset-0 z-10"
      style={{ touchAction: sel != null ? 'none' : 'pan-y' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {list.map((st, i) => {
        const d = STICKER_MAP[st.id]
        if (!d) return null
        const on = sel === i
        return (
          <div
            key={i}
            data-st={i}
            className="absolute cursor-move touch-none select-none"
            style={{ left: `${st.x * 100}%`, top: `${st.y * 100}%`, width: `${st.w * 100}%`, aspectRatio: `${d.w || 1} / ${d.h || 1}`, transform: `translate(-50%,-50%) rotate(${st.r || 0}deg)`, zIndex: on ? 3 : 1 }}
          >
            <img src={d.preview || d.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain" style={{ opacity: visible ? 1 : 0, filter: visible ? 'drop-shadow(0 2px 3px rgba(40,30,20,.22))' : undefined }} />
            {on && (
              <>
                <div className="pointer-events-none absolute -inset-1.5 rounded-md border-[1.5px] border-dashed border-white shadow-[0_0_0_1px_rgba(44,37,35,.35)]" />
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setList((l) => l.filter((_, k) => k !== i))
                    setSel(null)
                  }}
                  className="absolute -left-3.5 -top-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-espresso shadow-soft hover:text-red-600"
                  aria-label="Remove sticker"
                >
                  <X size={14} />
                </button>
                <div
                  onPointerDown={(e) => handleDown(e, i)}
                  className="absolute -bottom-3.5 -right-3.5 flex h-7 w-7 cursor-nwse-resize items-center justify-center rounded-full bg-terracotta text-white shadow-soft"
                  aria-label="Rotate and resize"
                >
                  <RotateCw size={13} />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
