import { RotateCcw } from 'lucide-react'
import { ADJUSTMENTS, FILTER_MAP } from '../../data/filters'
import { useStudio } from '../../store/useStudio'
import Slider from '../ui/Slider'
import Section from '../ui/Section'

export default function AdjustPanel() {
  const adj = useStudio((s) => s.adj)
  const setAdj = useStudio((s) => s.setAdj)
  const resetAdj = useStudio((s) => s.resetAdj)
  const filterId = useStudio((s) => s.filterId)
  const crop = useStudio((s) => s.crop)
  const setCrop = useStudio((s) => s.setCrop)
  const pushHistory = useStudio((s) => s.pushHistory)
  return (
    <div className="space-y-6">
      <Section
        title={`Fine-tune · ${FILTER_MAP[filterId].name}`}
        action={
          <button onClick={resetAdj} className="flex items-center gap-1 text-[11.5px] font-semibold text-terracotta hover:underline">
            <RotateCcw size={12} /> Reset
          </button>
        }
      >
        <div className="space-y-2.5">
          {ADJUSTMENTS.map((a) => (
            <Slider key={a.key} label={a.label} min={a.min} max={a.max} value={adj[a.key] || 0} onPointerDown={pushHistory} onChange={(v) => setAdj(a.key, v)} />
          ))}
        </div>
      </Section>
      <Section title="Crop & position">
        <div className="space-y-2.5">
          <Slider label="Zoom" min={1} max={3} step={0.01} value={crop.zoom} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => setCrop('zoom', v)} />
          <Slider label="Horizontal" min={-1} max={1} step={0.01} value={crop.x} format={(v) => v.toFixed(2)} onChange={(v) => setCrop('x', v)} />
          <Slider label="Vertical" min={-1} max={1} step={0.01} value={crop.y} format={(v) => v.toFixed(2)} onChange={(v) => setCrop('y', v)} />
        </div>
      </Section>
    </div>
  )
}
