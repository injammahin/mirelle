import { useRef, useState } from 'react'
import { ImagePlus, Check } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import Section from '../ui/Section'

const MAX_SIDE = 4096

export async function fileToDataUrl(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    const ctx = c.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.95)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function PhotosPanel() {
  const photo = useStudio((s) => s.photo)
  const setPhoto = useStudio((s) => s.setPhoto)
  const showToast = useStudio((s) => s.showToast)
  const frameId = useStudio((s) => s.frameId)
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleFiles = async (files) => {
    const file = [...files].find((f) => /image\/(jpeg|png|webp)/.test(f.type))
    if (!file) return showToast('Please choose a JPG, PNG or WEBP photo')
    setBusy(true)
    try {
      const src = await fileToDataUrl(file)
      setPhoto({ src, name: file.name, sampleId: null })
      showToast('Photo added ✨ Keep a frame or choose Photo only')
    } catch {
      showToast('Could not read that image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {photo.src && (
        <div className="flex items-center gap-3 rounded-2xl border border-sand bg-white/70 p-2.5">
          <img src={photo.src} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-espresso">{photo.name || 'Your photo'}</p>
            <p className="text-[11px] text-taupe">In your design</p>
          </div>
          <button onClick={() => useStudio.getState().removeSlotPhoto(0)} className="shrink-0 rounded-full border border-sand px-3 py-1.5 text-[12px] font-semibold text-espresso transition hover:border-red-300 hover:text-red-600">
            Remove
          </button>
        </div>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`group cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition ${drag ? 'border-terracotta bg-terracotta/5' : 'border-sand bg-white/50 hover:border-terracotta/50 hover:bg-white'}`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta transition group-hover:scale-110">
          <ImagePlus size={22} />
        </div>
        <p className="font-serif text-[17px] text-espresso">{busy ? 'Preparing your photo…' : 'Drop your photo here'}</p>
        <p className="mt-1 text-xs text-taupe">or tap to browse · JPG, PNG, WEBP · up to 4K kept</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-taupe">How do you want to edit?</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              useStudio.getState().setFrame('none')
              showToast('Photo only — try Filters, Adjust and Stickers')
            }}
            className={`tile flex flex-col items-start gap-1 p-3 text-left ${frameId === 'none' ? 'tile-active' : ''}`}
          >
            <span className="text-[13px] font-semibold text-espresso">Photo only</span>
            <span className="text-[11px] leading-snug text-taupe">No frame. Filters, adjust & stickers on your photo.</span>
          </button>
          <button
            onClick={() => useStudio.getState().openTool?.('frames')}
            className={`tile flex flex-col items-start gap-1 p-3 text-left ${frameId !== 'none' ? 'tile-active' : ''}`}
          >
            <span className="text-[13px] font-semibold text-espresso">With a frame</span>
            <span className="text-[11px] leading-snug text-taupe">Pick an aesthetic frame. Your photo drops right in.</span>
          </button>
        </div>
      </div>

    </div>
  )
}
