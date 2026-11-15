import { FILTERS } from '../../data/filters'
import { useStudio } from '../../store/useStudio'
import { useFilterThumbs } from './useThumbs'

export default function FiltersPanel() {
  const filterId = useStudio((s) => s.filterId)
  const applyFilter = useStudio((s) => s.applyFilter)
  const thumbs = useFilterThumbs()
  return (
    <div className="grid grid-cols-2 gap-3">
      {FILTERS.map((f) => (
        <button key={f.id} onClick={() => applyFilter(f.id)} className={`tile p-1.5 text-left ${filterId === f.id ? 'tile-active' : ''}`}>
          <div className="aspect-[4/5] overflow-hidden rounded-lg bg-linen">{thumbs[f.id] && <img src={thumbs[f.id]} alt={f.name} className="h-full w-full object-cover" />}</div>
          <div className="px-1 pt-1.5 text-[12px] font-semibold text-espresso">{f.name}</div>
          <div className="px-1 pb-0.5 text-[10.5px] text-taupe">{f.mood}</div>
        </button>
      ))}
    </div>
  )
}
