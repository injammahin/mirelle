import { useRef } from 'react'
import { Move, RotateCw, Trash2, Maximize2, RotateCcw, Minus, Plus } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { STICKER_MAP } from '../../data/stickers'
import { clamp } from '../../lib/random'

/**
 * Interactive layer over the letter canvas. Everything works with mouse or fingers:
 *  - text box: drag to move, corner handle to resize, two fingers to scale
 *  - wax seal: drag to move, corner handle / two fingers to resize
 *  - stickers: drag, corner handle to rotate + resize, two fingers to pinch & twist, trash to delete
 * Tapping empty paper deselects.
 */
export default function LetterStickers({ dispW, dispH, layout }) {
  const layers = useStudio((s) => s.letter.layers || [])
  const seal = useStudio((s) => s.letter.seal || {})
  const sel = useStudio((s) => s.letterSel)
  const { updateLetterLayer, removeLetterLayer, setLetter, setSeal } = useStudio.getState()
  const drag = useRef(null)
  const pointers = useRef(new Map())
  const boxRef = useRef(null)

  const text = useStudio.getState().letter.textBox || layout?.text
  const sealBox = layout?.seal

  const two = () => {
    const [a, b] = [...pointers.current.values()]
    return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, a: Math.atan2(b.y - a.y, b.x - a.x) }
  }

  const begin = (e, kind, mode, item) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const id = kind === 'sticker' ? item.id : '__' + kind
    if (useStudio.getState().letterSel !== id) useStudio.setState({ letterSel: id })
    const r = boxRef.current.getBoundingClientRect()
    if (pointers.current.size === 2) {
      const t = two()
      drag.current = { kind, mode: 'pinch', item, d0: t.d, a0: t.a, w0: item?.w, rot0: item?.rotation || 0, tb0: text && { ...text }, size0: seal.size || 1 }
      return
    }
    if (mode === 'transform' && kind === 'sticker') {
      const cx = r.left + item.x * r.width, cy = r.top + item.y * r.height
      drag.current = { kind, mode, item, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, a0: Math.atan2(e.clientY - cy, e.clientX - cx), w0: item.w, rot0: item.rotation || 0 }
    } else if (mode === 'transform' && kind === 'seal') {
      const cx = r.left + (sealBox.x + sealBox.w / 2) * r.width, cy = r.top + (sealBox.y + sealBox.h / 2) * r.height
      drag.current = { kind, mode, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, size0: seal.size || 1 }
    } else {
      drag.current = { kind, mode, item, sx: e.clientX, sy: e.clientY, x0: item?.x, y0: item?.y, tb0: text && { ...text }, sb0: sealBox && { ...sealBox } }
    }
  }

  const move = (e) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.sx) / dispW, dy = (e.clientY - d.sy) / dispH
    if (d.mode === 'pinch') {
      if (pointers.current.size < 2) return
      const t = two(), k = t.d / d.d0
      if (d.kind === 'sticker') {
        let rot = d.rot0 + ((t.a - d.a0) * 180) / Math.PI
        rot = ((rot + 540) % 360) - 180
        updateLetterLayer(d.item.id, { w: clamp(d.w0 * k, 0.05, 1.2), rotation: Math.round(rot * 10) / 10 })
      } else if (d.kind === 'seal') setSeal({ size: clamp(d.size0 * k, 0.4, 3) })
      else if (d.kind === 'text' && d.tb0) {
        const w = clamp(d.tb0.w * k, 0.2, 1), h = clamp(d.tb0.h * k, 0.12, 1)
        setLetter({ textBox: { x: d.tb0.x + (d.tb0.w - w) / 2, y: d.tb0.y + (d.tb0.h - h) / 2, w, h } })
      }
      return
    }
    if (d.kind === 'sticker') {
      if (d.mode === 'move') updateLetterLayer(d.item.id, { x: clamp(d.x0 + dx, -0.1, 1.1), y: clamp(d.y0 + dy, -0.1, 1.1) })
      else {
        const k = Math.hypot(e.clientX - d.cx, e.clientY - d.cy) / d.d0
        let rot = d.rot0 + ((Math.atan2(e.clientY - d.cy, e.clientX - d.cx) - d.a0) * 180) / Math.PI
        rot = ((rot + 540) % 360) - 180
        for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(rot - s) < 3) rot = s
        updateLetterLayer(d.item.id, { w: clamp(d.w0 * k, 0.05, 1.2), rotation: Math.round(rot * 10) / 10 })
      }
    } else if (d.kind === 'text' && d.tb0) {
      if (d.mode === 'move') setLetter({ textBox: { ...d.tb0, x: clamp(d.tb0.x + dx, -0.05, 1 - d.tb0.w + 0.05), y: clamp(d.tb0.y + dy, -0.05, 1 - d.tb0.h + 0.05) } })
      else setLetter({ textBox: { ...d.tb0, w: clamp(d.tb0.w + dx, 0.2, 1.05 - d.tb0.x), h: clamp(d.tb0.h + dy, 0.12, 1.05 - d.tb0.y) } })
    } else if (d.kind === 'seal' && d.sb0) {
      if (d.mode === 'move') setSeal({ pos: { x: clamp(d.sb0.x + d.sb0.w / 2 + dx, 0, 1), y: clamp(d.sb0.y + d.sb0.h / 2 + dy, 0, 1) } })
      else setSeal({ size: clamp((d.size0 * Math.hypot(e.clientX - d.cx, e.clientY - d.cy)) / d.d0, 0.4, 3) })
    }
  }
  const end = (e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) drag.current = null
  }
  const h = { onPointerMove: move, onPointerUp: end, onPointerCancel: end }
  const fontSize = useStudio((s) => s.letter.size || 0.046)
  const stop = (e) => e.stopPropagation()
  // small pill with − value + ; used for text size and seal size
  const Stepper = ({ label, value, onMinus, onPlus, style }) => (
    <div onPointerDown={stop} className="absolute z-20 flex items-center gap-0.5 rounded-full bg-white p-0.5 text-espresso shadow-soft" style={style}>
      <button onClick={onMinus} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-linen" aria-label={`Smaller ${label}`}>
        <Minus size={13} />
      </button>
      <span className="min-w-[44px] select-none text-center text-[10.5px] font-semibold tabular-nums">{label} {value}</span>
      <button onClick={onPlus} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-linen" aria-label={`Bigger ${label}`}>
        <Plus size={13} />
      </button>
    </div>
  )
  const handle = 'absolute flex h-8 w-8 touch-none items-center justify-center rounded-full shadow-glow'

  return (
    <div ref={boxRef} className="absolute inset-0" onPointerDown={() => useStudio.setState({ letterSel: null })}>
      {/* text box */}
      {text && (
        <div
          onPointerDown={(e) => begin(e, 'text', 'move')}
          {...h}
          className={`group absolute cursor-move touch-none rounded-md transition ${sel === '__text' ? 'border-[1.5px] border-dashed border-terracotta/80 bg-white/5' : 'border border-transparent hover:border-dashed hover:border-terracotta/50'}`}
          style={{ left: text.x * dispW, top: text.y * dispH, width: text.w * dispW, height: text.h * dispH }}
          title="Drag to move your text"
        >
          {sel === '__text' && (
            <>
              <span className="pointer-events-none absolute -top-7 left-0 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-espresso shadow-soft">
                <Move size={11} /> Text
              </span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setLetter({ textBox: null })}
                className="absolute -top-7 right-0 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-espresso shadow-soft hover:text-terracotta"
                title="Reset text position"
              >
                <RotateCcw size={11} /> Reset
              </button>
              <Stepper
                label="Aa"
                value={Math.round(fontSize * 1000)}
                onMinus={() => setLetter({ size: clamp(+(fontSize - 0.003).toFixed(3), 0.02, 0.09) })}
                onPlus={() => setLetter({ size: clamp(+(fontSize + 0.003).toFixed(3), 0.02, 0.09) })}
                style={{ left: 0, bottom: -40 }}
              />
              <div onPointerDown={(e) => begin(e, 'text', 'resize')} {...h} className={`${handle} -bottom-4 -right-4 cursor-nwse-resize bg-terracotta text-white`} title="Drag to resize">
                <Maximize2 size={13} />
              </div>
            </>
          )}
        </div>
      )}

      {/* wax seal */}
      {sealBox && (
        <div
          onPointerDown={(e) => begin(e, 'seal', 'move')}
          {...h}
          className={`absolute cursor-move touch-none rounded-full ${sel === '__seal' ? 'outline-dashed outline-[1.5px] outline-offset-2 outline-white' : ''}`}
          style={{ left: sealBox.x * dispW, top: sealBox.y * dispH, width: sealBox.w * dispW, height: sealBox.h * dispH }}
          title="Drag the seal"
        >
          {sel === '__seal' && (
            <>
            <Stepper
              label="Seal"
              value={`${Math.round((seal.size || 1) * 100)}%`}
              onMinus={() => setSeal({ size: clamp(+((seal.size || 1) - 0.1).toFixed(2), 0.4, 3) })}
              onPlus={() => setSeal({ size: clamp(+((seal.size || 1) + 0.1).toFixed(2), 0.4, 3) })}
              style={{ left: '50%', top: -44, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
            />
            <button
              onPointerDown={stop}
              onClick={() => {
                setSeal({ enabled: false })
                useStudio.setState({ letterSel: null })
              }}
              className="absolute -bottom-4 -left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-espresso shadow-soft hover:text-red-600"
              title="Remove seal"
              aria-label="Remove seal"
            >
              <Trash2 size={14} />
            </button>
            <div onPointerDown={(e) => begin(e, 'seal', 'transform')} {...h} className={`${handle} -bottom-4 -right-4 cursor-nwse-resize bg-terracotta text-white`} title="Drag to resize">
              <Maximize2 size={13} />
            </div>
            </>
          )}
        </div>
      )}

      {/* stickers */}
      {layers.map((l) => {
        const def = STICKER_MAP[l.stickerId]
        const w = l.w * dispW
        const ht = def && def.w ? (w * def.h) / def.w : w
        const on = sel === l.id
        return (
          <div
            key={l.id}
            onPointerDown={(e) => begin(e, 'sticker', 'move', l)}
            {...h}
            className="absolute cursor-move touch-none"
            style={{ left: l.x * dispW, top: l.y * dispH, width: w, height: ht, transform: `translate(-50%,-50%) rotate(${l.rotation || 0}deg)` }}
          >
            {on && (
              <>
                <div className="pointer-events-none absolute -inset-1 rounded-md border-[1.5px] border-dashed border-white shadow-[0_0_0_1px_rgba(44,37,35,.35)]" />
                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removeLetterLayer(l.id)} className="absolute -left-4 -top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white text-espresso shadow-soft hover:text-red-600" title="Delete">
                  <Trash2 size={13} />
                </button>
                <div onPointerDown={(e) => begin(e, 'sticker', 'transform', l)} {...h} className={`${handle} -bottom-4 -right-4 cursor-nwse-resize bg-terracotta text-white`} title="Drag to rotate & resize">
                  <RotateCw size={14} />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
