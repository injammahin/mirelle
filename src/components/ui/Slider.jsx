export default function Slider({ label, value, min = 0, max = 100, step = 1, onChange, format, onPointerDown }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="block select-none">
      <div className="mb-0.5 flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-espresso">{label}</span>
        <span className="rounded-md bg-linen px-1.5 py-0.5 text-[11px] tabular-nums text-taupe">{format ? format(value) : Math.round(value)}</span>
      </div>
      <input
        type="range"
        className="aura-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` }}
        onPointerDown={onPointerDown}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={() => onChange(min < 0 ? 0 : min)}
      />
    </label>
  )
}
