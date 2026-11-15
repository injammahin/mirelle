import { useMemo, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { FRAMES, FRAME_MAP, frameFamilies } from '../../data/frames'
import { useStudio } from '../../store/useStudio'
import { addCustomFrame, removeCustomFrame } from '../../lib/customFrames'
import { loadTemplate } from '../../lib/templateFrames'
import Section from '../ui/Section'
import { useFrameThumbs } from './useThumbs'

export default function FramesPanel() {
  const frameId = useStudio((s) => s.frameId)
  const setFrame = useStudio((s) => s.setFrame)
  const captions = useStudio((s) => s.captions)
  const setCaption = useStudio((s) => s.setCaption)
  const framesVersion = useStudio((s) => s.framesVersion)
  const { bumpFrames, showToast } = useStudio.getState()
  const fileRef = useRef(null)
  const frame = FRAME_MAP[frameId] || FRAMES[0]
  const [family, setFamily] = useState('all')
  const families = useMemo(() => frameFamilies(), [framesVersion])
  const list = useMemo(() => (family === 'all' ? [...FRAMES] : FRAMES.filter((f) => f.family === family)), [family, framesVersion])
  const thumbs = useFrameThumbs(list)

  const onUpload = async (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith('image/'))
    e.target.value = ''
    if (!files.length) return
    let last
    for (const file of files) last = await addCustomFrame(file)
    await loadTemplate(last).catch(() => {})
    bumpFrames()
    setFamily('tpl:mine')
    setFrame(last.id)
    showToast(files.length > 1 ? `${files.length} frames added` : 'Frame added — photo placed in the empty card')
  }
  const onRemove = async (e, id) => {
    e.stopPropagation()
    await removeCustomFrame(id)
    if (frameId === id) setFrame('polaroid')
    bumpFrames()
  }

  return (
    <div className="space-y-5">
      {frame.hasCaption && (
        <Section title={frame.captionLabel}>
          <input className="input font-script text-lg" value={captions[frameId] || ''} maxLength={40} onChange={(e) => setCaption(frameId, e.target.value)} placeholder="Write something sweet…" />
        </Section>
      )}

      <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-terracotta/50 bg-white/70 p-3 text-left transition hover:bg-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
          <ImagePlus size={18} />
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-espresso">Upload a frame template</span>
          <span className="block text-[11.5px] leading-snug text-taupe">Any image with an empty card — we find the spot and fit your photo in.</span>
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />

      <Section title={`Frames · ${list.length}`}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {families.map((fam) => (
            <button
              key={fam.id}
              onClick={() => setFamily(fam.id)}
              className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition ${family === fam.id ? 'border-espresso bg-espresso text-white' : 'border-black/10 bg-white/70 text-espresso hover:bg-white'}`}
            >
              {fam.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {list.map((f) => (
            <div key={f.id} role="button" tabIndex={0} onClick={() => setFrame(f.id)} onKeyDown={(e) => e.key === 'Enter' && setFrame(f.id)} className={`tile relative cursor-pointer p-1.5 text-left ${frameId === f.id ? 'tile-active' : ''}`}>
              <div className="checker overflow-hidden rounded-lg">
                {thumbs[f.id] ? <img src={thumbs[f.id]} alt={f.name} className="w-full" loading="lazy" /> : <div className={`${f.kind === 'template' ? 'aspect-[9/16]' : 'aspect-[4/5]'} animate-pulse bg-linen`} />}
              </div>
              <div className="px-1 pb-0.5 pt-1.5 text-[12px] font-semibold leading-tight text-espresso">{f.name}</div>
              {f.custom && (
                <button onClick={(e) => onRemove(e, f.id)} title="Remove frame" className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-espresso shadow-soft hover:text-red-600">
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
