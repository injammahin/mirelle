import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { ASPECTS } from '../../data/filters'
import { EXPORT_SIZES, dims, exportArtwork } from '../../lib/exporter'
import Segmented from '../ui/Segmented'
import Section from '../ui/Section'
import ShareLetter from '../letter/ShareLetter'

export default function ExportPanel({ kind }) {
  const aspect = useStudio((s) => s.aspect)
  const setAspect = useStudio((s) => s.setAspect)
  const showToast = useStudio((s) => s.showToast)
  const [format, setFormat] = useState('png')
  const [size, setSize] = useState(2160)
  const [busy, setBusy] = useState(false)
  const [w, h] = dims(aspect, size)

  const run = async () => {
    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 30))
      const out = await exportArtwork(useStudio.getState(), { kind, format, width: size })
      if (!out.pending) showToast(`Saved ${out.w}×${out.h} ${format.toUpperCase()} ✨`)
    } catch (e) {
      showToast(e.message || 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {kind === 'letter' && <ShareLetter />}
      <Section title="Aspect ratio">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ASPECTS).map(([k, a]) => (
            <button key={k} onClick={() => setAspect(k)} className={`tile flex flex-col items-center gap-1.5 py-2.5 ${aspect === k ? 'tile-active' : ''}`}>
              <span className="rounded-[3px] border-2 border-espresso/70" style={{ width: a.w > a.h ? 26 : (26 * a.w) / a.h, height: a.h >= a.w ? 26 : (26 * a.h) / a.w }} />
              <span className="text-[12px] font-bold">{a.label}</span>
              <span className="text-[10px] text-taupe">{a.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Resolution">
        <Segmented value={size} onChange={setSize} options={EXPORT_SIZES.map((s) => ({ value: s.px, label: s.label }))} />
        <p className="text-center text-[11.5px] text-taupe">
          {w} × {h}px · {((w * h) / 1e6).toFixed(1)} MP
        </p>
      </Section>
      <Section title="Format">
        <Segmented value={format} onChange={setFormat} options={[{ value: 'png', label: 'PNG · lossless' }, { value: 'jpg', label: 'JPG · smaller' }]} />
      </Section>
      <button className="btn-primary h-12 w-full text-[15px]" onClick={run} disabled={busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {busy ? 'Rendering high-res…' : `Download ${kind === 'letter' ? 'letter' : 'artwork'}`}
      </button>
    </div>
  )
}
