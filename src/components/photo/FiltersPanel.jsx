import { FILTERS, FILTER_MAP } from '../../data/filters'
import { useStudio } from '../../store/useStudio'
import Slider from '../ui/Slider'
import { DOODLES, DOODLE_COLORS } from '../../lib/doodle'
import { useFilterThumbs } from './useThumbs'

export default function FiltersPanel() {
  const filterId = useStudio((s) => s.filterId)
  const strength = useStudio((s) => s.adj.lookStrength)
  const applyFilter = useStudio((s) => s.applyFilter)
  const setAdj = useStudio((s) => s.setAdj)
  const thumbs = useFilterThumbs()
  const doodle = useStudio((s) => s.doodle)
  const setDoodle = useStudio((s) => s.setDoodle)
  const isLook = FILTER_MAP[filterId]?.look
  return (
    <div className="space-y-4">
      {/* phones: one swipeable row · larger screens: grid */}
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => applyFilter(f.id)} className={`tile w-[104px] shrink-0 snap-start p-1.5 text-left md:w-auto ${filterId === f.id ? 'tile-active' : ''}`}>
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-linen">{thumbs[f.id] && <img src={thumbs[f.id]} alt={f.name} className="h-full w-full object-cover" />}</div>
            <div className="truncate px-1 pt-1.5 text-[11.5px] font-semibold text-espresso md:text-[12px]">{f.name}</div>
            <div className="hidden truncate px-1 pb-0.5 text-[10.5px] text-taupe md:block">{f.mood}</div>
          </button>
        ))}
      </div>
      {isLook && (
        <Slider label="Intensity" min={0} max={100} step={1} value={strength ?? 85} format={(v) => `${v}%`} onChange={(v) => setAdj('lookStrength', v)} />
      )}
      <div>
        <p className="mb-2 text-[12px] font-semibold text-espresso">Magic outline</p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {DOODLES.map((d) => (
            <button key={d.id} onClick={() => setDoodle({ style: d.id })} className={`chip shrink-0 ${doodle.style === d.id ? 'chip-active' : ''}`}>
              {d.name}
            </button>
          ))}
        </div>
        {doodle.style !== 'none' && (
          <div className="mt-2.5 flex gap-2">
            {DOODLE_COLORS.map((c) => (
              <button key={c} onClick={() => setDoodle({ color: c })} aria-label={`Colour ${c}`} className={`h-7 w-7 rounded-full border-2 shadow-soft ${doodle.color === c ? 'border-espresso' : 'border-white'}`} style={{ background: c }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
