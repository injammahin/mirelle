import { useMemo, useRef, useState } from 'react'
import { Link2, Eye, Send, Mail, ScrollText, Flower2, Check, Sparkles, RefreshCcw, Minus, Plus, Trash2, Play } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { STICKERS } from '../../data/stickers'
import { sealById } from '../../data/sealImages'
import { REVEALS, ENVELOPES, FLAPS, CLOSURES, RIBBONS, SPRIGS, LINERS, DEFAULT_SHARE, makeLetterLink } from '../../lib/share'
import { EnvelopeBack, EnvelopeFront } from './Envelope'
import LetterViewer from './LetterViewer'
import Section from '../ui/Section'

const ICON = { envelope: Mail, flip: RefreshCcw, stardust: Sparkles, petals: Flower2, unfold: ScrollText }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/** Live envelope you can decorate: stickers drag to move, − / + resize, bin removes. */
function DecorPreview({ deco, set, side }) {
  const W = 288
  const H = W * 0.64
  const sealSrc = sealById(useStudio((s) => s.letter.seal?.style) || 'rose').src
  const [sel, setSel] = useState(null)
  const drag = useRef(null)
  const list = deco.stickers || []
  const update = (i, p) => set({ stickers: list.map((s, k) => (k === i ? { ...s, ...p } : s)) })
  const down = (e, i) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSel(i)
    drag.current = { i, sx: e.clientX, sy: e.clientY, x0: list[i].x, y0: list[i].y }
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    update(d.i, { x: clamp(d.x0 + (e.clientX - d.sx) / W, -0.05, 1.05), y: clamp(d.y0 + (e.clientY - d.sy) / H, -0.05, 1.05) })
  }
  const up = () => (drag.current = null)
  const cur = sel != null ? list[sel] : null
  return (
    <div className="relative mx-auto select-none" style={{ width: W, height: H + 26 }} onPointerDown={() => setSel(null)}>
      <div className="pointer-events-none absolute left-0 top-2">{side === 'front' ? <EnvelopeFront W={W} deco={{ ...deco, stickers: [] }} sealSrc={sealSrc} /> : <EnvelopeBack W={W} deco={{ ...deco, stickers: [] }} sealSrc={sealSrc} />}</div>
      {/* draggable stickers on top */}
      <div className="absolute left-0 top-2" style={{ width: W, height: H }}>
        {list.map((st, i) => {
          const d = STICKERS.find((x) => x.id === st.id)
          if (!d) return null
          return (
            <img
              key={i}
              src={d.preview || d.src}
              alt=""
              draggable={false}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className={`absolute max-w-none cursor-move touch-none ${sel === i ? 'outline-dashed outline-[1.5px] outline-offset-2 outline-terracotta' : ''}`}
              style={{ left: `${st.x * 100}%`, top: `${st.y * 100}%`, width: st.w * W, transform: `translate(-50%,-50%) rotate(${st.r || 0}deg)`, zIndex: 8, filter: 'drop-shadow(0 2px 3px rgba(40,30,20,.22))' }}
            />
          )
        })}
      </div>
      {cur && (
        <div onPointerDown={(e) => e.stopPropagation()} className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white p-0.5 shadow-soft">
          <button onClick={() => update(sel, { w: clamp(cur.w - 0.03, 0.06, 0.6) })} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-linen" aria-label="Smaller">
            <Minus size={13} />
          </button>
          <button onClick={() => update(sel, { r: ((cur.r || 0) + 15) % 360 })} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-linen" aria-label="Rotate">
            <RefreshCcw size={13} />
          </button>
          <button onClick={() => update(sel, { w: clamp(cur.w + 0.03, 0.06, 0.6) })} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-linen" aria-label="Bigger">
            <Plus size={13} />
          </button>
          <button
            onClick={() => {
              set({ stickers: list.filter((_, k) => k !== sel) })
              setSel(null)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-espresso hover:text-red-600"
            aria-label="Remove sticker"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

const Label = ({ children }) => <p className="mb-1.5 mt-4 text-[12px] font-semibold text-espresso">{children}</p>
const Pill = ({ on, onClick, children }) => (
  <button onClick={onClick} className={`chip shrink-0 ${on ? 'chip-active' : ''}`}>
    {children}
  </button>
)

/** "Send as a link": design the envelope, pick the opening, preview it, send it. */
export default function ShareLetter() {
  const letter = useStudio((s) => s.letter)
  const aspect = useStudio((s) => s.aspect)
  const setLetter = useStudio((s) => s.setLetter)
  const showToast = useStudio((s) => s.showToast)
  const share = { ...DEFAULT_SHARE, ...(letter.share || {}) }
  const set = (p) => setLetter({ share: { ...share, ...p } })
  const [copied, setCopied] = useState(false)
  const [side, setSide] = useState('back')
  const [preview, setPreview] = useState(null)
  const stickers = useMemo(() => STICKERS.filter((s) => s.kind === 'image' && !s.custom), [])

  const play = (reveal) => {
    if (reveal) set({ reveal })
    const st = useStudio.getState()
    setPreview({ letter: st.letter, aspect: st.aspect, share: { ...share, ...(reveal ? { reveal } : {}) } })
  }
  const link = () => makeLetterLink({ letter, aspect, share })
  const copy = async () => {
    const url = await link()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      showToast('Link copied — paste it in any chat 💌')
    } catch {
      window.prompt('Copy your letter link', url)
    }
  }
  const send = async () => {
    const url = await link()
    if (navigator.share) {
      try {
        await navigator.share({ title: share.to ? `A letter for ${share.to}` : 'A letter for you', text: 'Tap to open 💌', url })
      } catch {
        /* cancelled */
      }
    } else copy()
  }
  const addSticker = (id) => {
    const list = share.stickers || []
    if (list.length >= 8) return showToast('Up to 8 stickers on the envelope')
    set({ stickers: [...list, { id, x: 0.2 + Math.random() * 0.6, y: 0.62 + Math.random() * 0.25, w: 0.2, r: Math.round(Math.random() * 30 - 15) }] })
  }

  return (
    <>
      <Section title="Send as a link">
        <p className="-mt-1 mb-3 text-[11.5px] leading-snug text-taupe">Design the envelope they'll receive, then send the link. Nothing to install.</p>

        {/* live envelope */}
        <div className="rounded-2xl border border-sand/70 bg-gradient-to-b from-[#faf5ee] to-[#efe4d5] px-2 pb-2 pt-3">
          <DecorPreview deco={share} set={set} side={side} />
          <div className="mt-2 flex justify-center gap-1.5">
            <Pill on={side === 'back'} onClick={() => setSide('back')}>
              Flap side
            </Pill>
            <Pill on={side === 'front'} onClick={() => setSide('front')}>
              Address side
            </Pill>
          </div>
        </div>

        <Label>Opening animation · tap to preview</Label>
        <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
          {REVEALS.map((r) => {
            const Icon = ICON[r.id]
            const on = share.reveal === r.id
            return (
              <button key={r.id} onClick={() => play(r.id)} className={`tile relative flex w-[104px] shrink-0 snap-start flex-col items-center gap-1 px-2 py-3 text-center ${on ? 'tile-active' : ''}`} title={r.note}>
                <Icon size={19} strokeWidth={1.6} className={on ? 'text-terracotta' : 'text-espresso'} />
                <span className="text-[11.5px] font-semibold leading-tight text-espresso">{r.name}</span>
                <span className="flex items-center gap-0.5 text-[9.5px] text-taupe">
                  <Play size={9} /> preview
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-center text-[10.5px] text-taupe">{REVEALS.find((r) => r.id === share.reveal)?.note}</p>

        <Label>Envelope paper</Label>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(ENVELOPES).map(([k, e]) => (
            <button key={k} onClick={() => set({ envelope: k })} title={e.name} className={`h-8 w-8 rounded-full border-2 shadow-soft transition ${share.envelope === k ? 'scale-110 border-espresso' : 'border-white'}`} style={{ background: `linear-gradient(135deg, ${e.body}, ${e.body} 50%, rgba(0,0,0,.08))`, backgroundColor: e.body }} />
          ))}
        </div>

        <Label>Flap</Label>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {FLAPS.map((f) => (
            <Pill key={f.id} on={share.flap === f.id} onClick={() => set({ flap: f.id })}>
              {f.name}
            </Pill>
          ))}
        </div>

        <Label>Closure</Label>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {CLOSURES.map((c) => (
            <Pill key={c.id} on={share.closure === c.id} onClick={() => set({ closure: c.id })}>
              {c.name}
            </Pill>
          ))}
        </div>
        {share.closure === 'seal' && <p className="mt-1.5 text-[11px] text-taupe">Uses the wax seal chosen in the Seal tab.</p>}
        {share.closure === 'ribbon' && (
          <div className="mt-2 flex flex-wrap gap-2.5">
            {Object.entries(RIBBONS).map(([k, r]) => (
              <button key={k} onClick={() => set({ ribbon: k })} title={r.name} className={`h-7 w-7 rounded-full border-2 shadow-soft transition ${share.ribbon === k ? 'scale-110 border-espresso' : 'border-white'}`} style={{ background: r.color }} />
            ))}
          </div>
        )}

        <Label>Tucked-in flowers</Label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {SPRIGS.map((s) => {
            const d = STICKERS.find((x) => x.id === s.id)
            return (
              <button key={s.id} onClick={() => set({ sprig: s.id })} className={`tile flex h-16 w-16 shrink-0 items-center justify-center p-1.5 ${share.sprig === s.id ? 'tile-active' : ''}`} title={s.name}>
                {d ? <img src={d.preview || d.src} alt={s.name} className="max-h-full max-w-full object-contain" /> : <span className="text-[10.5px] text-taupe">None</span>}
              </button>
            )
          })}
        </div>

        <Label>Inside liner</Label>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {LINERS.map((l) => (
            <Pill key={l.id} on={share.liner === l.id} onClick={() => set({ liner: l.id })}>
              {l.name}
            </Pill>
          ))}
        </div>

        <Label>Stickers on the envelope</Label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {stickers.map((s) => (
            <button key={s.id} onClick={() => addSticker(s.id)} className="tile flex h-14 w-14 shrink-0 items-center justify-center p-1" title={s.name}>
              {s.preview || s.src ? <img src={s.preview || s.src} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain" /> : null}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10.5px] text-taupe">Tap to add · drag on the envelope to place · tap one to resize, rotate or remove.</p>

        <label className="mt-4 block">
          <span className="mb-1 block text-[12px] font-semibold text-espresso">For</span>
          <input className="input font-serif italic" maxLength={24} value={share.to} onChange={(e) => set({ to: e.target.value })} placeholder="their name" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-[12px] font-semibold text-espresso">Note on the envelope</span>
          <input className="input font-serif italic" maxLength={40} value={share.note} onChange={(e) => set({ note: e.target.value })} placeholder="little by little, a lot becomes a beautiful life" />
        </label>
        {letter.photoPin?.enabled && <p className="mt-2 text-[11px] text-taupe">Pinned photos stay on your device and aren't included in links.</p>}

        <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
          <button onClick={send} className="btn-primary h-11 text-[13.5px]">
            <Send size={16} /> Send
          </button>
          <button onClick={copy} className="btn-ghost h-11 text-[13.5px]">
            {copied ? <Check size={16} /> : <Link2 size={16} />} {copied ? 'Copied' : 'Copy link'}
          </button>
          <button onClick={() => play()} className="btn-ghost h-11 w-11 !px-0" title="Preview as the receiver">
            <Eye size={16} />
          </button>
        </div>
      </Section>
      {preview && <LetterViewer preview={preview} onClose={() => setPreview(null)} />}
    </>
  )
}
