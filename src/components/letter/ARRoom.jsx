import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Box, RotateCcw } from 'lucide-react'
import '@google/model-viewer'
import { buildLetterModel } from '../../lib/letterModel'
import { crack, rustle, chime, buzz } from '../../lib/sfx'

/**
 * Full-screen 3D view of the letter + "View in your room".
 * The scene starts sealed; tapping the wax seal plays the opening (seal pops off, flap lifts, letter rises).
 * iPhone Quick Look can't animate, so its room scene shows the letter already opened.
 */
export default function ARRoom({ letterCanvas, deco, sealSrc, onClose }) {
  const [src, setSrc] = useState(null)
  const [arOk, setArOk] = useState(false)
  const [phase, setPhase] = useState('loading') // loading · sealed · opening · open
  const mv = useRef(null)
  const timers = useRef([])

  useEffect(() => {
    let url
    ;(async () => {
      const seal = sealSrc ? await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = sealSrc }) : null
      url = await buildLetterModel({ letterCanvas, deco, sealImg: seal })
      setSrc(url)
    })()
    return () => {
      url && URL.revokeObjectURL(url)
      timers.current.forEach(clearTimeout)
    }
  }, [letterCanvas, deco, sealSrc])

  // hold the sealed pose (frame 0) until the seal is tapped
  useEffect(() => {
    const el = mv.current
    if (!el) return
    const onLoad = () => {
      setArOk(!!el.canActivateAR)
      el.pause()
      el.currentTime = 0
      setPhase('sealed')
    }
    // in the room, hotspots are hidden, so the opening plays by itself once the envelope is placed
    const onAr = (e) => {
      if (e.detail?.status === 'object-placed') {
        el.currentTime = 0
        el.play({ repetitions: 1 })
        crack()
        buzz(25)
        timers.current.push(setTimeout(() => rustle(0.9), 750), setTimeout(() => rustle(1.2), 1900), setTimeout(chime, 3300))
      }
      if (e.detail?.status === 'not-presenting') replayRef.current?.()
    }
    el.addEventListener('load', onLoad)
    el.addEventListener('ar-status', onAr)
    return () => {
      el.removeEventListener('load', onLoad)
      el.removeEventListener('ar-status', onAr)
    }
  }, [src])

  const open = () => {
    const el = mv.current
    if (!el || phase !== 'sealed') return
    setPhase('opening')
    el.currentTime = 0
    el.play({ repetitions: 1 })
    crack()
    buzz(25)
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms))
    at(750, () => rustle(0.9))
    at(1900, () => rustle(1.2))
    at(3300, () => {
      chime()
      buzz(12)
    })
    at(4300, () => setPhase('open'))
  }
  const replay = () => {
    const el = mv.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setPhase('sealed')
  }
  const replayRef = useRef(replay)
  replayRef.current = replay

  return (
    <motion.div className="fixed inset-0 z-[95] flex flex-col bg-gradient-to-b from-[#f8f1e6] to-[#e8d9c4]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-espresso shadow-soft" aria-label="Close">
        <X size={18} />
      </button>
      <p className="absolute left-5 top-5 z-10 font-serif text-[15px] italic text-espresso/80">your letter, in 3D</p>

      {!src && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <span className="develop-spark text-[26px] text-terracotta/80">✦</span>
          <span className="font-serif text-[15px] italic text-espresso/70">folding your letter into 3D…</span>
        </div>
      )}

      {src && (
        <model-viewer
          ref={mv}
          src={src}
          alt="Your letter in 3D"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement="floor"
          camera-controls=""
          touch-action="pan-y"
          shadow-intensity="1.1"
          shadow-softness="0.8"
          exposure="1.05"
          environment-image="neutral"
          camera-orbit="0deg 62deg 0.55m"
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          {/* tap target that sits on the wax seal while the letter is sealed */}
          {phase === 'sealed' && (
            <button slot="hotspot-seal" data-position="0 0.012 -0.0115" data-normal="0 1 0" onClick={open} className="flex h-16 w-16 items-center justify-center rounded-full" aria-label="Crack the seal">
              <span className="seal-pulse block h-10 w-10 rounded-full border-2 border-white/90" />
            </button>
          )}
          <button slot="ar-button" className="absolute bottom-8 left-1/2 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-espresso px-7 text-[15px] font-semibold text-oat shadow-lift">
            <Box size={18} /> View in your room
          </button>
        </model-viewer>
      )}

      {src && phase === 'sealed' && (
        <p className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 whitespace-nowrap font-serif text-[14px] italic text-espresso/75">tap the wax seal ✦</p>
      )}
      {src && phase === 'open' && (
        <button onClick={replay} className="absolute bottom-28 left-1/2 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/80 px-4 text-[12.5px] font-medium text-espresso shadow-soft backdrop-blur">
          <RotateCcw size={14} /> Replay
        </button>
      )}
      {src && !arOk && phase !== 'loading' && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/70 px-3 py-1 text-[11px] text-taupe">drag to turn · open on a phone to place it in your room</p>
      )}
    </motion.div>
  )
}
