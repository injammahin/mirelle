import { ArrowDown, ArrowUp, Copy, FlipHorizontal2, Layers, Trash2, Type, Sticker as StickerIcon } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { STICKER_MAP } from '../../data/stickers'
import { FONTS } from '../../data/fonts'
import Slider from '../ui/Slider'
import Switch from '../ui/Switch'
import Section from '../ui/Section'
import ColorSwatches from '../ui/ColorSwatches'

const TEXT_COLORS = ['#fffaf3', '#2c2523', '#c87d65', '#8fa38a', '#b5646f', '#ffa24d', '#d4a85a']

export default function LayerPanel() {
  const layers = useStudio((s) => s.layers)
  const selectedId = useStudio((s) => s.selectedId)
  const select = useStudio((s) => s.select)
  const update = useStudio((s) => s.updateLayer)
  const remove = useStudio((s) => s.removeLayer)
  const duplicate = useStudio((s) => s.duplicateLayer)
  const move = useStudio((s) => s.moveLayer)
  const pushHistory = useStudio((s) => s.pushHistory)
  const layer = layers.find((l) => l.id === selectedId)

  return (
    <div className="space-y-6">
      {layer ? (
        <Section
          title={layer.type === 'text' ? 'Text layer' : STICKER_MAP[layer.stickerId]?.name}
          action={
            <div className="flex gap-1">
              <button className="icon-btn h-8 w-8" title="Bring forward" onClick={() => move(layer.id, 1)}>
                <ArrowUp size={14} />
              </button>
              <button className="icon-btn h-8 w-8" title="Send backward" onClick={() => move(layer.id, -1)}>
                <ArrowDown size={14} />
              </button>
              <button className="icon-btn h-8 w-8" title="Duplicate" onClick={() => duplicate(layer.id)}>
                <Copy size={14} />
              </button>
              <button className="icon-btn h-8 w-8 hover:!border-red-300 hover:text-red-600" title="Delete" onClick={() => remove(layer.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          }
        >
          {layer.type === 'text' ? (
            <div className="space-y-3.5">
              <textarea className="input min-h-[64px] resize-none" value={layer.text} onFocus={pushHistory} onChange={(e) => update(layer.id, { text: e.target.value })} />
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(FONTS).map((f) => (
                  <button key={f.id} onClick={() => update(layer.id, { font: f.id })} className={`chip h-10 justify-center ${layer.font === f.id ? 'chip-active' : ''}`} style={{ fontFamily: f.family, fontStyle: f.italic ? 'italic' : 'normal', fontSize: f.id === 'caveat' || f.id === 'nothing' ? 15 : 12 }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <ColorSwatches colors={TEXT_COLORS} value={layer.color} onChange={(c) => update(layer.id, { color: c })} />
              <Slider label="Size" min={0.02} max={0.2} step={0.002} value={layer.size} format={(v) => Math.round(v * 1000)} onChange={(v) => update(layer.id, { size: v })} />
              <Slider label="Curve / arch" min={-100} max={100} value={layer.arc || 0} onChange={(v) => update(layer.id, { arc: v })} />
              <Slider label="Letter spacing" min={-10} max={60} value={layer.letterSpacing || 0} onChange={(v) => update(layer.id, { letterSpacing: v })} />
              <Slider label="Rotation" min={-180} max={180} value={layer.rotation || 0} format={(v) => `${Math.round(v)}°`} onChange={(v) => update(layer.id, { rotation: v })} />
              <Slider label="Opacity" min={0.1} max={1} step={0.01} value={layer.opacity ?? 1} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => update(layer.id, { opacity: v })} />
              <Switch label="Soft shadow" checked={!!layer.shadow} onChange={(v) => update(layer.id, { shadow: v })} />
            </div>
          ) : (
            <div className="space-y-3.5">
              <Slider label="Size" min={0.05} max={0.8} step={0.005} value={layer.w} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => update(layer.id, { w: v })} />
              <Slider label="Rotation" min={-180} max={180} value={layer.rotation || 0} format={(v) => `${Math.round(v)}°`} onChange={(v) => update(layer.id, { rotation: v })} />
              <Slider label="Opacity" min={0.1} max={1} step={0.01} value={layer.opacity ?? 1} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => update(layer.id, { opacity: v })} />
              <button className="btn-ghost h-9 w-full" onClick={() => update(layer.id, { flip: !layer.flip })}>
                <FlipHorizontal2 size={15} /> Flip horizontally
              </button>
            </div>
          )}
        </Section>
      ) : (
        <div className="rounded-2xl border border-dashed border-sand bg-white/40 p-4 text-center text-[12.5px] text-taupe">Tap a sticker or text on the canvas to edit it here.</div>
      )}

      <Section title={`Layers · ${layers.length}`}>
        {layers.length === 0 ? (
          <p className="text-[12px] text-taupe">No stickers or text yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {[...layers].reverse().map((l) => (
              <li key={l.id}>
                <button onClick={() => select(l.id)} className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-[12.5px] transition ${l.id === selectedId ? 'border-terracotta bg-terracotta/5' : 'border-sand bg-white/60 hover:bg-white'}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-linen text-taupe">{l.type === 'text' ? <Type size={14} /> : <StickerIcon size={14} />}</span>
                  <span className="flex-1 truncate font-medium">{l.type === 'text' ? l.text || 'Text' : STICKER_MAP[l.stickerId]?.name}</span>
                  <Layers size={13} className="text-taupe/60" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  )
}
