import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Frame } from 'lucide-react'
import { FRAMES } from '../../data/frames'
import { useStudio } from '../../store/useStudio'
import { loadImage } from '../../lib/assets'
import { exampleFor } from '../../data/examples'
import { loadTemplate } from '../../lib/templateFrames'
import { makeCanvas, renderPhotoScene } from '../../lib/photoRenderer'

const CENTRED = { zoom: 1, x: 0, y: 0 }


/** Renders each real-image frame with the user's current photo already placed in it. */
export function useFramedExamples(limit = Infinity) {
  const adj = useStudio((s) => s.adj)
  const framesVersion = useStudio((s) => s.framesVersion)
  const frames = useMemo(() => FRAMES.filter((f) => f.kind === 'template').slice(0, limit), [framesVersion, limit])
  const [out, setOut] = useState({})
  useEffect(() => {
    let alive = true
    ;(async () => {
      // let the page paint first, then render examples in the background
      await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 600 }) : setTimeout(r, 120)))
      for (const [i, f] of frames.entries()) {
        const ex = exampleFor(i)
        if (!ex) return
        const img = await loadImage('ex:' + ex.src, ex.src).catch(() => null)
        const t = await loadTemplate(f).catch(() => null)
        if (!alive) return
        if (!t || !img) continue
        const W = Math.round(300 * Math.min(2, window.devicePixelRatio || 1))
        const H = Math.round(W / t.aspect)
        const c = makeCanvas(W, H)
        renderPhotoScene(c.getContext('2d'), W, H, { image: img, adj, crop: CENTRED, frameId: f.id, captions: {}, layers: [] }, { cache: false })
        const url = c.toDataURL('image/jpeg', 0.88)
        if (alive) setOut((m) => ({ ...m, [f.id]: url }))
        await new Promise((r) => setTimeout(r, 16))
      }
    })()
    return () => {
      alive = false
    }
  }, [adj, frames])
  return [frames, out]
}

export function useOpenFrame() {
  return (id) => {
    const st = useStudio.getState()
    // until the user uploads their own photo, open the studio with the same example portrait
    const i = FRAMES.filter((f) => f.kind === 'template').findIndex((f) => f.id === id)
    const ex = exampleFor(Math.max(0, i))
    if (ex && st.photo.sampleId) st.setPhoto({ src: ex.src, name: ex.name, sampleId: 'example' })
    st.setFrame(id)
    st.setMode('photo')
    st.showToast('Frame selected — upload your photo, it drops right into the card ✨')
  }
}

export default function FrameShowcase() {
  const [frames, imgs] = useFramedExamples()
  const open = useOpenFrame()
  if (!frames.length) return null
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <span className="eyebrow inline-flex items-center gap-1.5 text-terracotta">
            <Frame size={12} /> Pinterest photo frames
          </span>
          <h2 className="mt-1 font-serif text-[24px] leading-tight text-espresso md:text-[30px]">
            Tap a frame, <em className="text-terracotta">your photo fits right in.</em>
          </h2>
        </div>
        <span className="hidden shrink-0 text-[12.5px] text-taupe sm:block">{frames.length} frames</span>
      </div>
      <div className="no-scrollbar -mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 sm:-mx-5 sm:px-5 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 xl:grid-cols-5">
        {frames.map((f, i) => (
          <motion.button
            key={f.id}
            onClick={() => open(f.id)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative w-[46vw] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl bg-linen text-left shadow-soft md:w-auto md:max-w-none"
          >
            <div className="aspect-[9/16] w-full">{imgs[f.id] ? <img src={imgs[f.id]} alt={f.name} className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-linen" />}</div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8">
              <span className="truncate text-[12.5px] font-semibold text-white">{f.name}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-espresso opacity-0 transition group-hover:opacity-100">
                <ArrowUpRight size={14} />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
