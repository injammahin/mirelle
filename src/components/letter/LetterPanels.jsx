import { useEffect, useState } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Lightbulb, Shuffle, Check, Paperclip, Image as ImageIcon } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { PAPERS, LETTER_FONTS, INKS, SEAL_STYLES, SEAL_COLORS, SEAL_POSITIONS, LETTER_BOTANICALS, WASHI_COLORS, PROMPTS, STAMP_PHRASES, TEMPLATES, DEFAULT_LETTER } from '../../data/letter'
import { FONTS } from '../../data/fonts'
import { STICKER_MAP } from '../../data/stickers'
import { sealSvg } from '../../data/seals'
import { svgToDataUrl } from '../../lib/assets'
import { renderLetter, letterAssetList, stampDate } from '../../lib/letterRenderer'
import { makeCanvas } from '../../lib/photoRenderer'
import { loadSvgImage } from '../../lib/assets'
import { pick } from '../../lib/random'
import Section from '../ui/Section'
import Slider from '../ui/Slider'
import Switch from '../ui/Switch'
import Segmented from '../ui/Segmented'

/* ---------- Paper ---------- */
export function PaperPanel() {
  const letter = useStudio((s) => s.letter)
  const setLetter = useStudio((s) => s.setLetter)
  const [thumbs, setThumbs] = useState({})
  useEffect(() => {
    let alive = true
    ;(async () => {
      const base = { ...DEFAULT_LETTER, title: 'Dear you,', body: 'A little note on lovely paper, written slowly with warm tea nearby.', closing: '', signature: '', postmark: false, seal: { ...DEFAULT_LETTER.seal, enabled: false }, botanicals: [], photoPin: { enabled: false } }
      await Promise.all(PAPERS.flatMap((p) => letterAssetList({ ...base, paper: p.id }).map(([k, svg]) => loadSvgImage(k, svg).catch(() => {}))))
      await document.fonts?.ready
      const out = {}
      PAPERS.forEach((p) => {
        const c = makeCanvas(200, 250)
        renderLetter(c.getContext('2d'), 200, 250, { ...base, paper: p.id, font: letter.font, ink: letter.ink })
        out[p.id] = c.toDataURL('image/jpeg', 0.85)
      })
      alive && setThumbs(out)
    })()
    return () => {
      alive = false
    }
  }, [letter.font, letter.ink])
  return (
    <div className="grid grid-cols-2 gap-3">
      {PAPERS.map((p) => (
        <button key={p.id} onClick={() => setLetter({ paper: p.id })} className={`tile p-1.5 text-left ${letter.paper === p.id ? 'tile-active' : ''}`}>
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-linen">{thumbs[p.id] && <img src={thumbs[p.id]} alt={p.name} className="h-full w-full object-cover" />}</div>
          <div className="px-1 pt-1.5 text-[12px] font-semibold leading-tight text-espresso">{p.name}</div>
          <div className="px-1 pb-0.5 text-[10.5px] text-taupe">{p.note}</div>
        </button>
      ))}
    </div>
  )
}

/* ---------- Write ---------- */
export function WritePanel() {
  const letter = useStudio((s) => s.letter)
  const setLetter = useStudio((s) => s.setLetter)
  const [prompt, setPrompt] = useState(() => pick(PROMPTS))
  return (
    <div className="space-y-5">
      <Section title="Start from a template">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TEMPLATES.map((t) => (
            <button key={t.id} className="chip" onClick={() => setLetter({ title: t.title, body: t.body, closing: t.closing })}>
              {t.name}
            </button>
          ))}
        </div>
      </Section>
      <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-[#fbf3e3] to-[#f6ead8] p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-espresso">
            <Lightbulb size={14} className="text-gold" /> Poetic prompt
          </span>
          <button className="flex items-center gap-1 text-[11.5px] font-semibold text-terracotta" onClick={() => setPrompt(pick(PROMPTS.filter((p) => p !== prompt)))}>
            <Shuffle size={12} /> New
          </button>
        </div>
        <p className="font-display text-[16px] italic leading-snug text-espresso">“{prompt}”</p>
        <button className="mt-2 text-[11.5px] font-semibold text-sage-dark hover:underline" onClick={() => setLetter({ body: `${letter.body.trim()}\n\n${prompt} ` })}>
          + Add to my letter
        </button>
      </div>
      <Section title="Title">
        <input className="input font-display text-lg italic" value={letter.title} maxLength={60} onChange={(e) => setLetter({ title: e.target.value })} />
      </Section>
      <Section title="Your letter">
        <textarea className="input min-h-[180px] resize-y leading-relaxed" value={letter.body} onChange={(e) => setLetter({ body: e.target.value })} />
        <p className="text-right text-[11px] text-taupe">{letter.body.length} characters · text auto-fits the page</p>
      </Section>
      <div className="grid grid-cols-2 gap-3">
        <Section title="Closing">
          <input className="input" value={letter.closing} onChange={(e) => setLetter({ closing: e.target.value })} />
        </Section>
        <Section title="Signature">
          <input className="input font-hand" value={letter.signature} onChange={(e) => setLetter({ signature: e.target.value })} />
        </Section>
      </div>
      <Section title="Postmark & date stamp">
        <Switch label="Poetic postmark" hint={`“${letter.stampPhrase} — ${stampDate()}”`} checked={letter.postmark} onChange={(v) => setLetter({ postmark: v })} />
        {letter.postmark && (
          <div className="flex flex-wrap gap-1.5">
            {STAMP_PHRASES.map((p) => (
              <button key={p} onClick={() => setLetter({ stampPhrase: p })} className={`chip ${letter.stampPhrase === p ? 'chip-active' : ''}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ---------- Typography ---------- */
export function TypePanel() {
  const letter = useStudio((s) => s.letter)
  const setLetter = useStudio((s) => s.setLetter)
  return (
    <div className="space-y-5">
      <Section title="Typeface">
        <div className="grid grid-cols-2 gap-2">
          {LETTER_FONTS.map((f) => (
            <button key={f.id} onClick={() => setLetter({ font: f.id })} className={`tile flex h-16 flex-col items-center justify-center ${letter.font === f.id ? 'tile-active' : ''}`}>
              <span style={{ fontFamily: FONTS[f.id].family, fontSize: f.id === 'caveat' || f.id === 'nothing' ? 20 : 16 }}>Dear you</span>
              <span className="text-[10.5px] text-taupe">{f.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Ink colour">
        <div className="grid grid-cols-5 gap-2">
          {INKS.map((i) => (
            <button key={i.id} onClick={() => setLetter({ ink: i.id })} className="flex flex-col items-center gap-1" title={i.name}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm transition ${letter.ink === i.id ? 'scale-110 border-espresso' : 'border-white'}`} style={{ background: `radial-gradient(circle at 35% 30%, ${i.color}aa, ${i.color})` }}>
                {letter.ink === i.id && <Check size={14} className="text-white" />}
              </span>
              <span className="text-center text-[9.5px] leading-tight text-taupe">{i.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Layout">
        <Segmented
          value={letter.align}
          onChange={(v) => setLetter({ align: v })}
          options={[
            { value: 'left', label: '', icon: <AlignLeft size={15} />, title: 'Left' },
            { value: 'center', label: '', icon: <AlignCenter size={15} />, title: 'Center' },
            { value: 'right', label: '', icon: <AlignRight size={15} />, title: 'Right' },
            { value: 'justify', label: '', icon: <AlignJustify size={15} />, title: 'Justify' },
          ]}
        />
        <Slider label="Text size" min={0.025} max={0.07} step={0.001} value={letter.size} format={(v) => Math.round(v * 1000)} onChange={(v) => setLetter({ size: v })} />
        <Slider label="Line height" min={1.1} max={2.2} step={0.05} value={letter.lineHeight} format={(v) => v.toFixed(2)} onChange={(v) => setLetter({ lineHeight: v })} />
      </Section>
    </div>
  )
}

/* ---------- Seal ---------- */
export function SealPanel() {
  const seal = useStudio((s) => s.letter.seal)
  const setSeal = useStudio((s) => s.setSeal)
  return (
    <div className="space-y-5">
      <Switch label="Wax seal" hint="Pressed into the corner or envelope flap" checked={seal.enabled} onChange={(v) => setSeal({ enabled: v })} />
      <div className={seal.enabled ? 'space-y-5' : 'pointer-events-none space-y-5 opacity-40'}>
        <Section title="Stamp">
          <div className="grid grid-cols-4 gap-2">
            {SEAL_STYLES.map((st) => (
              <button key={st.id} onClick={() => setSeal({ style: st.id })} className={`tile flex flex-col items-center p-1.5 ${seal.style === st.id ? 'tile-active' : ''}`}>
                <img src={svgToDataUrl(sealSvg(st.id, seal.color, seal.monogram))} alt={st.name} className="aspect-square w-full" />
                <span className="mt-1 text-center text-[10px] font-medium leading-tight">{st.name}</span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Wax colour">
          <div className="flex gap-3">
            {Object.entries(SEAL_COLORS).map(([k, c]) => (
              <button key={k} onClick={() => setSeal({ color: k })} className="flex flex-col items-center gap-1">
                <span className={`h-10 w-10 rounded-full border-2 shadow-sm transition ${seal.color === k ? 'scale-110 border-espresso' : 'border-white'}`} style={{ background: `radial-gradient(circle at 35% 30%, ${c.light}, ${c.base} 55%, ${c.dark})` }} />
                <span className="text-[10.5px] text-taupe">{c.name}</span>
              </button>
            ))}
          </div>
        </Section>
        {seal.style === 'monogram' && (
          <Section title="Monogram">
            <input className="input w-24 text-center font-serif text-xl italic" maxLength={2} value={seal.monogram} onChange={(e) => setSeal({ monogram: e.target.value.toUpperCase() || 'A' })} />
          </Section>
        )}
        <Section title="Position">
          <Segmented value={seal.position} onChange={(v) => setSeal({ position: v })} size="sm" options={SEAL_POSITIONS.map((p) => ({ value: p.id, label: p.name }))} />
        </Section>
      </div>
    </div>
  )
}

/* ---------- Botanicals & photo ---------- */
export function BotanicalsPanel() {
  const letter = useStudio((s) => s.letter)
  const toggle = useStudio((s) => s.toggleBotanical)
  const setLetter = useStudio((s) => s.setLetter)
  const pin = letter.photoPin
  const setPin = useStudio((s) => s.setPin)
  const photo = useStudio((s) => s.photo)
  return (
    <div className="space-y-6">
      <Section title={`Pressed flowers · ${letter.botanicals.length}/3`}>
        <div className="grid grid-cols-3 gap-2">
          {LETTER_BOTANICALS.map((id) => {
            const on = letter.botanicals.includes(id)
            return (
              <button key={id} onClick={() => toggle(id)} className={`tile flex aspect-square flex-col items-center justify-center p-2 ${on ? 'tile-active' : ''}`}>
                <img src={svgToDataUrl(STICKER_MAP[id].svg)} alt="" className="max-h-[68%] object-contain" />
                <span className="mt-1 text-[10px] font-medium">{STICKER_MAP[id].name}</span>
                {on && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white">
                    <Check size={11} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="Washi tape">
        <div className="flex gap-2">
          {Object.entries(WASHI_COLORS).map(([k, w]) => (
            <button key={k} onClick={() => setLetter({ washi: k })} className={`tile flex-1 p-2 ${letter.washi === k ? 'tile-active' : ''}`}>
              <img src={svgToDataUrl(STICKER_MAP[w.id].svg)} alt="" className="w-full" />
              <span className="mt-1 block text-[10.5px] font-medium">{w.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Polaroid attachment">
        <div className="flex items-center gap-3 rounded-2xl border border-sand bg-white/60 p-3">
          <img src={photo.src} alt="" className="h-14 w-12 rounded-md object-cover shadow-sm" />
          <div className="flex-1">
            <Switch label="Pin my edited photo" hint="Uses your Photo Studio edit" checked={pin.enabled} onChange={(v) => setPin({ enabled: v })} />
          </div>
        </div>
        {pin.enabled && (
          <div className="space-y-3">
            <Segmented value={pin.clip} onChange={(v) => setPin({ clip: v })} options={[{ value: 'paperclip', label: 'Paperclip', icon: <Paperclip size={13} /> }, { value: 'clothespin', label: 'Clothespin', icon: <ImageIcon size={13} /> }]} />
            <Segmented value={pin.corner} onChange={(v) => setPin({ corner: v })} size="sm" options={[{ value: 'top-left', label: 'Top left' }, { value: 'top-right', label: 'Top right' }, { value: 'bottom-left', label: 'Bottom left' }]} />
          </div>
        )}
      </Section>
    </div>
  )
}
