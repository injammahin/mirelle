import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Plus, X } from 'lucide-react'
import { STICKERS } from '../../data/stickers'
import { prepareSticker } from '../../lib/imageStickers'
import { addCustomSticker, removeCustomSticker } from '../../lib/customFrames'
import { useStudio } from '../../store/useStudio'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_]/g, ' ')

export default function StickersPanel() {
  const addSticker = useStudio((s) => s.addSticker)
  const showToast = useStudio((s) => s.showToast)
  const framesVersion = useStudio((s) => s.framesVersion) // bumped after uploads / restore
  const bump = useStudio((s) => s.bumpFrames)
  const fileRef = useRef(null)
  const [cat, setCat] = useState('all')
  const [, setTick] = useState(0)

  const real = useMemo(() => STICKERS.filter((s) => s.kind === 'image'), [framesVersion])
  // Only real image stickers are offered; the old drawn set is no longer shown.
  const pool = real
  const cats = useMemo(() => [...new Set(real.map((s) => s.category))], [real])
  const list = cat === 'all' ? pool : pool.filter((s) => s.category === cat)

  // uploaded stickers need a one-time cut-out to build their preview; bundled ones ship with thumbnails
  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const s of real) {
        if (s.ready || s.prepared) continue
        await prepareSticker(s).catch(() => {})
        if (alive) setTick((t) => t + 1)
      }
    })()
    return () => {
      alive = false
    }
  }, [real])

  const onUpload = async (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length) return
    showToast('Cutting out your sticker…')
    for (const f of files) await addCustomSticker(f)
    bump()
    setCat('mine')
    showToast(files.length > 1 ? `${files.length} stickers added` : 'Sticker added — tap it to place')
  }

  return (
    <div className="space-y-4">
      <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-terracotta/50 bg-white/70 p-3 text-left transition hover:bg-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
          <ImagePlus size={18} />
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-espresso">Add sticker images</span>
          <span className="block text-[11.5px] leading-snug text-taupe">PNG or JPG. The background is removed and the sticker trimmed automatically.</span>
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />

      {real.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {['all', ...cats].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? 'chip-active' : ''}`}>
              {c === 'all' ? 'All' : c === 'mine' ? 'My stickers' : cap(c)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {list.map((s) => {
          const src = s.preview
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={async () => {
                await prepareSticker(s).catch(() => {}) // know the real size before placing
                addSticker(s.id)
                showToast(`${s.name} added — drag it into place`)
              }}
              className="tile group relative flex aspect-square cursor-pointer flex-col items-center justify-center p-2"
              title={s.name}
            >
              {src ? <img src={src} alt={s.name} loading="lazy" decoding="async" className="max-h-[78%] max-w-[88%] object-contain drop-shadow-sm transition group-hover:scale-110" /> : <div className="h-3/4 w-3/4 animate-pulse rounded-xl bg-linen" />}
              <span className="mt-1 line-clamp-1 text-[10px] font-medium text-taupe">{s.name}</span>
              {s.custom ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    await removeCustomSticker(s.id)
                    bump()
                  }}
                  title="Remove sticker"
                  className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-espresso opacity-0 shadow-soft transition hover:text-red-600 group-hover:opacity-100"
                >
                  <X size={11} />
                </button>
              ) : (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-white opacity-0 transition group-hover:opacity-100">
                  <Plus size={12} />
                </span>
              )}
            </div>
          )
        })}
      </div>
      {!real.length && (
        <div className="rounded-2xl bg-linen/70 px-4 py-6 text-center">
          <p className="font-serif text-[17px] text-espresso">No stickers yet</p>
          <p className="mx-auto mt-1 max-w-[260px] text-[12px] leading-relaxed text-taupe">Add sticker images above. Single stickers work best: one flower, bow or camera per image.</p>
        </div>
      )}
    </div>
  )
}
