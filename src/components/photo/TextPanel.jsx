import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import Section from '../ui/Section'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const PRESETS = [
  { text: 'romanticize your life', font: 'caveat' },
  { text: '1998.08.14', font: 'courier', color: '#ffa24d', shadow: true, size: 0.055 },
  { text: 'TODAY', font: 'courier', color: '#ffa24d', size: 0.055 },
  { text: 'main character energy', font: 'playfair', size: 0.055 },
  { text: 'slow mornings', font: 'cormorant', size: 0.07, letterSpacing: 8 },
  { text: 'je t’aime', font: 'nothing', size: 0.07 },
  { text: 'soft life ♡', font: 'caveat', arc: 25 },
  { text: 'GOLDEN HOUR', font: 'jakarta', size: 0.045, letterSpacing: 30 },
  { text: 'little lovely things', font: 'caveat', arc: -20 },
  { text: 'N° 07', font: 'playfair', size: 0.08 },
]

const FONT_CLASS = { caveat: 'font-script text-lg', courier: 'font-type', playfair: 'font-serif italic', cormorant: 'font-display text-base', nothing: 'font-hand', jakarta: 'font-sans tracking-widest text-[11px]' }

export default function TextPanel() {
  const addText = useStudio((s) => s.addText)
  const [custom, setCustom] = useState('')
  return (
    <div className="space-y-6">
      <Section title="Write your own">
        <div className="flex gap-2">
          <input className="input" value={custom} placeholder="a quote, a date, a feeling…" onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && custom.trim() && (addText(custom.trim()), setCustom(''))} />
          <button className="btn-primary shrink-0 px-3" disabled={!custom.trim()} onClick={() => (addText(custom.trim()), setCustom(''))}>
            <Plus size={16} />
          </button>
        </div>
      </Section>
      <Section title="Aesthetic presets">
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const text = p.text === 'TODAY' ? today() : p.text
            return (
              <button key={p.text} onClick={() => addText(text, { ...p, text })} className="tile flex h-16 items-center justify-center px-2 text-center text-espresso">
                <span className={`${FONT_CLASS[p.font]} leading-tight`} style={p.color ? { color: '#d9822b' } : undefined}>
                  {text}
                </span>
              </button>
            )
          })}
        </div>
      </Section>
      <p className="text-center text-[11.5px] text-taupe">Select a text on the canvas to change font, colour, shadow & arch.</p>
    </div>
  )
}
