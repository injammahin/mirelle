import { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStudio } from '../../store/useStudio'
import { ASPECTS } from '../../data/filters'
import { useAssetsVersion, useElementSize, useFontsVersion, useImage } from '../../lib/hooks'
import { renderLetter } from '../../lib/letterRenderer'
import { makeCanvas, renderPhotoScene } from '../../lib/photoRenderer'

export default function LetterStage() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const box = useElementSize(wrapRef)
  const aspect = useStudio((s) => s.aspect)
  const zoom = useStudio((s) => s.zoom)
  const letter = useStudio((s) => s.letter)
  const magicTick = useStudio((s) => s.magicTick)
  const photo = useStudio((s) => s.photo)
  const adj = useStudio((s) => s.adj)
  const crop = useStudio((s) => s.crop)
  const frameId = useStudio((s) => s.frameId)
  const captions = useStudio((s) => s.captions)
  const layers = useStudio((s) => s.layers)
  const img = useImage(photo.src)
  const av = useAssetsVersion()
  const fv = useFontsVersion()

  // snapshot of the edited photo for the polaroid pin
  const pinEnabled = letter.photoPin?.enabled
  const photoCanvas = useMemo(() => {
    if (!pinEnabled || !img) return null
    const c = makeCanvas(600, 750)
    renderPhotoScene(c.getContext('2d'), 600, 750, { image: img, adj, crop, frameId, captions, layers }, { cache: false })
    return c
  }, [pinEnabled, img, adj, crop, frameId, captions, layers, av, fv])

  const asp = ASPECTS[aspect]
  const pad = box.w < 500 ? 14 : 36
  const fitW = Math.max(120, Math.min(box.w - pad * 2, ((box.h - pad * 2) * asp.w) / asp.h))
  const dispW = Math.round(fitW * zoom)
  const dispH = Math.round((dispW * asp.h) / asp.w)

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !dispW) return
    const raf = requestAnimationFrame(() => {
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      const scale = Math.min(dpr, 3000 / dispW)
      const W = Math.round(dispW * scale)
      const H = Math.round(dispH * scale)
      c.width = W
      c.height = H
      renderLetter(c.getContext('2d'), W, H, letter, { photoCanvas })
    })
    return () => cancelAnimationFrame(raf)
  }, [letter, dispW, dispH, photoCanvas, av, fv])

  return (
    <div ref={wrapRef} className="desk-texture soft-scroll relative h-full w-full overflow-auto">
      <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding: pad, width: dispW + pad * 2 > box.w ? dispW + pad * 2 : undefined, height: dispH + pad * 2 > box.h ? dispH + pad * 2 : undefined }}>
        <motion.div layout className="relative shrink-0 rounded-[6px] shadow-lift" style={{ width: dispW, height: dispH }}>
          <canvas ref={canvasRef} className="block rounded-[6px]" style={{ width: dispW, height: dispH }} />
          <AnimatePresence>
            {magicTick > 0 && (
              <motion.div key={magicTick} className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6px]" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.2, delay: 0.5 }}>
                <motion.div className="absolute inset-y-0 w-1/2" style={{ background: 'linear-gradient(100deg, transparent, rgba(255,240,210,.8), transparent)' }} initial={{ x: '-120%' }} animate={{ x: '260%' }} transition={{ duration: 1 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
