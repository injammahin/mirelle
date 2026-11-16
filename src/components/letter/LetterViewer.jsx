import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, RotateCcw, PenLine, X, Volume2, VolumeX } from 'lucide-react'
import { crack, rustle, chime, buzz, soundOn, setSound } from '../../lib/sfx'
import '../../store/useStudio' // registers the bundled sticker library
import { readLetterLink, cleanLetter } from '../../lib/share'
import { renderLetterCanvas, download } from '../../lib/exporter'
import { sealById } from '../../data/sealImages'
import { LogoMark } from '../ui/Logo'
import { EnvelopeBack, EnvelopeFront, Closure } from './Envelope'

/* ---------- helpers ---------- */
function useViewport() {
  const get = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [v, setV] = useState(get)
  useEffect(() => {
    const on = () => setV(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const rand = (a, b) => a + Math.random() * (b - a)

/* ---------- ambience ---------- */
function Ambience({ dark }) {
  const motes = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ i, x: rand(0, 100), y: rand(0, 100), s: rand(2, 5), d: rand(8, 16), dx: rand(-30, 30), dy: rand(-60, -20) })), [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: dark ? 'radial-gradient(120% 90% at 50% 30%, #2c3658 0%, #151b2e 65%, #0e1220 100%)' : 'radial-gradient(120% 90% at 50% 28%, #fdf8f0 0%, #f1e6d6 60%, #e6d6c1 100%)' }} />
      {/* window light */}
      {!dark && (
        <motion.div
          className="absolute -inset-[20%]"
          style={{ background: 'repeating-linear-gradient(115deg, rgba(255,250,238,0) 0 70px, rgba(255,250,238,0.55) 70px 130px, rgba(255,250,238,0) 130px 230px)', filter: 'blur(18px)', mixBlendMode: 'soft-light' }}
          animate={{ x: [0, 40, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {motes.map((m) => (
        <motion.span
          key={m.i}
          className="absolute rounded-full"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, background: dark ? '#fff6dc' : '#fffaf0', boxShadow: `0 0 ${m.s * 3}px ${dark ? '#ffe9b0' : '#fff3d6'}`, opacity: 0.6 }}
          animate={{ x: [0, m.dx, 0], y: [0, m.dy, 0], opacity: [0.15, 0.75, 0.15] }}
          transition={{ duration: m.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="grain-overlay" />
    </div>
  )
}

/* ---------- golden sparkles (stardust) ---------- */
function Stardust({ phase }) {
  const parts = useMemo(() => Array.from({ length: 46 }, (_, i) => ({ i, a: rand(0, Math.PI * 2), r0: rand(60, 140), r1: rand(160, 340), s: rand(4, 11), d: rand(0, 0.5), star: i % 3 === 0 })), [])
  if (!phase) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30">
      {parts.map((p) => {
        const orbit = phase === 1
        const r = orbit ? p.r0 : p.r1
        return (
          <motion.span
            key={p.i}
            className="absolute"
            style={{ width: p.s, height: p.s, marginLeft: -p.s / 2, marginTop: -p.s / 2, color: '#f6d58b', fontSize: p.s * 1.6, lineHeight: 1, textShadow: '0 0 8px #ffe2a0' }}
            initial={{ x: Math.cos(p.a) * 20, y: Math.sin(p.a) * 20, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(p.a + (orbit ? 1.2 : 2)) * r, y: Math.sin(p.a + (orbit ? 1.2 : 2)) * r * 0.75, opacity: orbit ? [0, 1, 0.9] : [0.9, 1, 0], scale: orbit ? 1 : 1.4, rotate: 180 }}
            transition={{ duration: orbit ? 1.1 : 1.2, delay: p.d * (orbit ? 1 : 0.4), ease: 'easeOut' }}
          >
            {p.star ? '✦' : <span className="block h-full w-full rounded-full" style={{ background: 'radial-gradient(circle, #fff6d8, #e9b949 60%, transparent 70%)' }} />}
          </motion.span>
        )
      })}
    </div>
  )
}

/* ---------- golden motes rising out of the open envelope ---------- */
function Rise({ go }) {
  const ps = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ i, x: rand(-110, 110), d: rand(1.4, 2.6), delay: rand(0, 0.8), s: rand(2, 5) })), [])
  if (!go) return null
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20">
      {ps.map((p) => (
        <motion.span key={p.i} className="absolute rounded-full" style={{ width: p.s, height: p.s, background: '#fff3c9', boxShadow: '0 0 8px 2px rgba(255,222,150,.9)' }} initial={{ x: p.x * 0.3, y: 40, opacity: 0 }} animate={{ x: p.x, y: -220 - rand(0, 120), opacity: [0, 1, 0] }} transition={{ duration: p.d, delay: p.delay, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

function SoundToggle({ dark }) {
  const [on, setOn] = useState(soundOn())
  return (
    <button onClick={() => (setSound(!on), setOn(!on))} className={`absolute right-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur ${dark ? 'bg-white/10 text-oat' : 'bg-white/70 text-espresso'} shadow-soft`} aria-label={on ? 'Mute' : 'Sound on'}>
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />}
    </button>
  )
}

/* ---------- petals ---------- */
function Petals({ go }) {
  const petals = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => ({
        i,
        x: rand(0, 100),
        d: rand(3, 5.5),
        delay: rand(0, 1.1),
        s: rand(12, 28),
        r: rand(0, 360),
        sway: rand(-90, 90),
        hue: ['#f6c1cf', '#f9d7df', '#efb0c0', '#fde7ea', '#f3c6a8', '#fff3f5'][i % 6],
      })),
    [],
  )
  if (!go) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {petals.map((p) => (
        <motion.span
          key={p.i}
          className="absolute block"
          style={{ left: `${p.x}%`, top: -40, width: p.s, height: p.s * 1.3, background: `radial-gradient(circle at 30% 30%, #fff9, ${p.hue})`, borderRadius: '70% 0 70% 0', boxShadow: '0 2px 5px rgba(120,60,70,0.18)' }}
          initial={{ y: 0, x: 0, rotate: p.r, opacity: 0 }}
          animate={{ y: '118vh', x: [0, p.sway, -p.sway * 0.5, p.sway * 0.3], rotate: p.r + 300, rotateX: [0, 180, 360], opacity: [0, 1, 1, 0.85] }}
          transition={{ duration: p.d, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

/* ---------- folded letter ---------- */
function Folded({ url, w, h, stage, sealSrc, deco }) {
  const third = h / 3
  const face = (pos) => ({ backgroundImage: `url(${url})`, backgroundSize: `${w}px ${h}px`, backgroundPosition: `0 ${-pos * third}px` })
  const back = 'linear-gradient(180deg, #f7f0e3, #ece2d0)'
  const panel = (pos, origin, folded, z) => (
    <motion.div className="absolute left-0 w-full" style={{ top: pos * third, height: third, transformOrigin: origin, transformStyle: 'preserve-3d', zIndex: z }} initial={false} animate={{ rotateX: folded }} transition={{ duration: 0.85, ease: [0.45, 0, 0.2, 1] }}>
      <div className="absolute inset-0" style={{ ...face(pos), backfaceVisibility: 'hidden' }} />
      <div className="absolute inset-0" style={{ background: back, transform: 'rotateX(180deg)', backfaceVisibility: 'hidden', boxShadow: 'inset 0 0 30px rgba(120,90,60,0.16)' }} />
    </motion.div>
  )
  return (
    <div className="relative" style={{ width: w, height: h, perspective: 1800 }}>
      <div className="absolute left-0 w-full" style={{ top: third, height: third, ...face(1), zIndex: 1, boxShadow: '0 24px 40px -20px rgba(40,25,15,0.5)' }} />
      {panel(0, '50% 100%', stage >= 3 ? 0 : -180, 2)}
      {panel(2, '50% 0%', stage >= 2 ? 0 : 180, 3)}
      {stage < 2 && (
        <div className="absolute left-0 w-full" style={{ top: third, height: third, zIndex: 10 }}>
          <Closure w={w} h={third} deco={{ ...deco, closure: deco.closure === 'none' ? 'seal' : deco.closure }} sealSrc={sealSrc} released={stage >= 1} ay={0.5} ax={0.5} vertical={false} />
        </div>
      )}
    </div>
  )
}

/**
 * The receiving experience. Reads the letter from the link, or takes `preview`
 * ({ letter, aspect, share }) when the sender previews it inside the studio.
 */
export default function LetterViewer({ preview = null, onClose }) {
  const vp = useViewport()
  const [data, setData] = useState(null)
  const [img, setImg] = useState(null)
  const [error, setError] = useState('')
  const [stage, setStage] = useState(0) // 0 closed · 1 release · 2 open · 3 rising · 4 reveal · 5 done
  const [flipped, setFlipped] = useState(false)
  const [spin, setSpin] = useState(false)
  const run = useRef(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const d = preview ? { ...preview, letter: cleanLetter(preview.letter) } : await readLetterLink()
        if (!d) throw new Error('bad link')
        if (!alive) return
        setData(d)
        const c = await renderLetterCanvas({ aspect: d.aspect, letter: { ...d.letter, photoPin: { enabled: false } } }, 1200)
        if (alive) setImg({ url: c.toDataURL('image/jpeg', 0.9), w: c.width, h: c.height, canvas: c })
      } catch {
        if (alive) setError('This letter link looks incomplete. Ask the sender to copy it again.')
      }
    })()
    return () => {
      alive = false
    }
  }, [preview])

  const deco = data?.share || {}
  const reveal = deco.reveal || 'envelope'
  const sealSrc = sealById(data?.letter?.seal?.style || 'rose').src
  const r = img ? img.w / img.h : 0.8
  const lw = Math.min(vp.w * 0.88, 540, vp.h * 0.7 * r)
  const lh = lw / r
  const envW = Math.min(vp.w * 0.86, 460)
  const boxW = Math.max(lw, envW)
  const dark = deco.envelope === 'midnight' || deco.envelope === 'burgundy'

  const open = async () => {
    if (stage > 0 || spin || !img) return
    const id = ++run.current
    const step = async (s, ms) => {
      if (run.current !== id) throw 0
      setStage(s)
      if (s === 1) {
        buzz(22)
        reveal === 'stardust' ? chime() : deco.closure === 'seal' || reveal === 'unfold' ? crack() : rustle(0.4)
      }
      if (s === 2) rustle(0.75)
      if (s === 3) rustle(0.9)
      if (s === 4) {
        buzz(12)
        chime()
      }
      await wait(ms)
    }
    try {
      if (reveal === 'flip' && !flipped) {
        rustle(0.6)
        setSpin(true)
        await wait(950)
        setFlipped(true)
        setSpin(false)
        await wait(250)
      }
      if (reveal === 'unfold') {
        await step(1, 650)
        await step(2, 800)
        await step(3, 900)
        await step(5, 0)
      } else if (reveal === 'stardust') {
        await step(1, 1100)
        await step(2, 900)
        await step(4, 1000)
        await step(5, 0)
      } else if (reveal === 'petals') {
        await step(1, 700)
        await step(2, 900)
        await step(4, 1000)
        await step(5, 0)
      } else {
        await step(1, 750)
        await step(2, 750)
        await step(3, 1050)
        await step(4, 800)
        await step(5, 0)
      }
    } catch {
      /* replayed mid-animation */
    }
  }
  const replay = () => {
    run.current++
    setFlipped(false)
    setSpin(false)
    setStage(0)
  }
  // previews start playing on their own
  useEffect(() => {
    if (preview && img && stage === 0 && !spin) {
      const t = setTimeout(open, 700)
      return () => clearTimeout(t)
    }
  }, [preview, img]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => img?.canvas.toBlob((b) => b && download(b, 'mirelle-letter.png'), 'image/png')
  const writeBack = () => {
    try {
      sessionStorage.setItem('mirelle:session', JSON.stringify({ mode: 'letter' }))
    } catch {
      /* ignore */
    }
    location.href = location.pathname
  }

  const showFront = reveal === 'flip' && !flipped
  const envGone = reveal === 'stardust' || reveal === 'petals' ? stage >= 2 : stage >= 4
  const txt = dark ? 'text-oat' : 'text-espresso'

  return (
    <div className={`${preview ? 'fixed inset-0 z-[80]' : 'relative h-[100dvh] w-full'} flex flex-col items-center justify-center overflow-hidden`}>
      <Ambience dark={dark} />

      {preview ? (
        <>
          <span className={`absolute left-4 top-4 z-40 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${dark ? 'bg-white/10 text-oat' : 'bg-white/70 text-taupe'}`}>Preview · what they'll see</span>
          <button onClick={onClose} className="absolute right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-espresso shadow-soft" aria-label="Close preview">
            <X size={18} />
          </button>
        </>
      ) : (
        <a href={location.pathname} className="absolute left-4 top-4 z-40 flex items-center gap-2 opacity-80 transition hover:opacity-100">
          <LogoMark size={30} />
          <span className={`font-serif text-[15px] italic ${txt}`}>Mirelle</span>
        </a>
      )}

      {error && <p className="relative z-10 max-w-xs text-center font-serif text-[16px] italic text-taupe">{error}</p>}
      {!error && !img && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <span className="develop-spark text-[26px] text-terracotta/80">✦</span>
          <span className={`font-serif text-[15px] italic ${dark ? 'text-oat/80' : 'text-espresso/70'}`}>your letter is arriving…</span>
        </div>
      )}

      {img && (
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative" style={{ width: boxW, height: lh }}>
            {/* envelope / folded letter */}
            <AnimatePresence>
              {stage < 5 && !(reveal !== 'unfold' && envGone && stage >= 4) && (
                <motion.button
                  key={'c' + (showFront ? 'f' : 'b')}
                  onClick={open}
                  className="absolute outline-none [perspective:1200px]"
                  style={reveal === 'unfold' ? { left: (boxW - lw) / 2, top: 0 } : { left: (boxW - envW) / 2, top: Math.max(lh * 0.5 - envW * 0.32, envW * 0.62) }}
                  initial={flipped ? false : { opacity: 0, y: -vp.h * 0.55, x: 40, rotate: -18, scale: 0.9 }}
                  animate={
                    reveal === 'stardust' && stage >= 2
                      ? { opacity: 0, scale: 0.92, filter: 'blur(10px) brightness(2.2)', y: 0, rotate: 0 }
                      : reveal === 'petals' && stage >= 2
                        ? { opacity: 0, scale: 1.1, filter: 'blur(8px)', y: 0, rotate: 0 }
                        : stage >= 4
                          ? { opacity: 0, y: lh * 0.5, rotate: 0 }
                          : { opacity: 1, x: 0, scale: stage ? 1.05 : 1, rotateX: stage ? 10 : 0, y: stage ? 0 : [0, -7, 0], rotate: stage ? 0 : [-1.4, 1, -1.4], filter: reveal === 'stardust' && stage === 1 ? 'brightness(1.12) drop-shadow(0 0 26px rgba(246,213,139,.85))' : 'none' }
                  }
                  exit={{ opacity: 0 }}
                  transition={stage ? { duration: 0.7, ease: 'easeInOut' } : { default: { type: 'spring', stiffness: 60, damping: 11, mass: 1.1 }, rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }, opacity: { duration: 0.5 } }}
                  aria-label="Open the letter"
                >
                  {reveal === 'unfold' ? (
                    <Folded url={img.url} w={lw} h={lh} stage={stage} sealSrc={sealSrc} deco={deco} />
                  ) : showFront ? (
                    <motion.div style={{ transformStyle: 'preserve-3d' }} initial={false} animate={spin ? { rotateY: 180, scale: [1, 1.06, 1] } : { rotateY: 0 }} transition={{ duration: 0.9, ease: [0.5, 0, 0.3, 1] }}>
                      <div style={{ backfaceVisibility: 'hidden' }}>
                        <EnvelopeFront W={envW} deco={deco} sealSrc={sealSrc} />
                      </div>
                      <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <EnvelopeBack W={envW} deco={deco} sealSrc={sealSrc} letterUrl={img.url} />
                      </div>
                    </motion.div>
                  ) : (
                    <EnvelopeBack W={envW} deco={deco} stage={reveal === 'stardust' || reveal === 'petals' ? Math.min(stage, 1) : stage} letterUrl={img.url} sealSrc={sealSrc} glow={stage >= 2 && reveal !== 'stardust' && reveal !== 'petals'} />
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* the letter */}
            {((reveal !== 'unfold' && stage >= 4) || (reveal === 'unfold' && stage >= 5)) && (
              <motion.div
                className="absolute top-0 overflow-hidden rounded-[3px]"
                style={{ width: lw, height: lh, left: (boxW - lw) / 2, boxShadow: '0 40px 80px -36px rgba(30,18,10,0.65), 0 8px 20px -10px rgba(30,18,10,0.3)' }}
                initial={reveal === 'unfold' ? false : reveal === 'stardust' || reveal === 'petals' ? { opacity: 0, scale: 0.9, filter: 'blur(12px) brightness(1.4)' } : { opacity: 0, y: -40, scale: 0.62, rotateX: 38, rotateZ: -4 }}
                animate={{ opacity: 1, y: [0, -5, 0], scale: 1, rotateX: 0, rotateZ: 0, filter: 'blur(0px) brightness(1)' }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.2 } }}
              >
                <img src={img.url} alt="Your letter" className="h-full w-full" draggable={false} />
                <div className="letter-sheen pointer-events-none absolute inset-0" />
              </motion.div>
            )}
            {reveal === 'stardust' && <Stardust phase={stage === 1 ? 1 : stage === 2 ? 2 : 0} />}
          </div>

          {stage === 0 && !spin && (
            <motion.div className="mt-7 flex flex-col items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              {deco.to && !showFront && <p className={`font-script text-[26px] leading-none ${txt}`}>for {deco.to}</p>}
              <p className={`mt-1 flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.3em] ${dark ? 'text-oat/70' : 'text-taupe'}`}>
                <span className="develop-spark">✦</span> tap to open
              </p>
            </motion.div>
          )}

          {stage >= 5 && (
            <motion.div className="mt-6 flex flex-wrap items-center justify-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {!preview && (
                <button onClick={save} className="inline-flex h-10 items-center gap-2 rounded-full bg-espresso px-4 text-[13px] font-medium text-oat shadow-soft">
                  <Download size={15} /> Save letter
                </button>
              )}
              <button onClick={replay} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium backdrop-blur ${dark ? 'border-oat/30 text-oat' : 'border-sand bg-white/70 text-espresso'}`}>
                <RotateCcw size={15} /> Replay
              </button>
              {preview ? (
                <button onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-full bg-espresso px-4 text-[13px] font-medium text-oat shadow-soft">
                  Looks lovely
                </button>
              ) : (
                <button onClick={writeBack} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium backdrop-blur ${dark ? 'border-oat/30 text-oat' : 'border-sand bg-white/70 text-espresso'}`}>
                  <PenLine size={15} /> Write one back
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}
      <motion.div className="pointer-events-none absolute inset-0 z-[5]" initial={false} animate={{ opacity: stage >= 4 ? 1 : 0 }} transition={{ duration: 1.2 }} style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, transparent 40%, rgba(30,18,10,0.28) 100%)' }} />
      <Rise go={reveal !== 'unfold' && stage >= 2 && stage < 5} />
      <Petals go={reveal === 'petals' && stage >= 2} />
      {!preview && <SoundToggle dark={dark} />}
    </div>
  )
}
