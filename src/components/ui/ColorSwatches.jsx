export default function ColorSwatches({ colors, value, onChange, allowCustom = true }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} title={c} className={`h-7 w-7 rounded-full border-2 shadow-sm transition active:scale-90 ${value?.toLowerCase() === c.toLowerCase() ? 'border-espresso scale-110' : 'border-white'}`} style={{ background: c }} />
      ))}
      {allowCustom && (
        <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-sm" title="Custom colour" style={{ background: 'conic-gradient(#e9a8b2,#f2c25e,#8fa38a,#7d9cc0,#b39ddb,#e9a8b2)' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      )}
    </div>
  )
}
