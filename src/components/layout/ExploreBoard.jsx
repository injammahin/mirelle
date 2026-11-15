import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Wand2, Mail, ArrowUpRight, Camera, Download } from 'lucide-react'
import { BOARD } from '../../data/showcase'
import { VIBES, VIBE_MAP } from '../../data/vibes'
import { useStudio } from '../../store/useStudio'
import { renderPinImage } from '../../lib/exporter'
import VibeIcon from '../ui/VibeIcon'
import FrameShowcase, { useFramedExamples, useOpenFrame } from './FrameShowcase'

const cache = new Map()

function usePinImages(pins) {
  const [imgs, setImgs] = useState(() => Object.fromEntries([...cache]))
  useEffect(() => {
    let alive = true
    ;(async () => {
      const letterState = useStudio.getState()
      for (const pin of pins) {
        if (!alive) return
        if (cache.has(pin.id)) continue
        try {
          const width = Math.round(560 * Math.min(2, window.devicePixelRatio || 1))
          const url = await renderPinImage(pin, width, letterState)
          cache.set(pin.id, url)
          if (alive) setImgs((m) => ({ ...m, [pin.id]: url }))
          await new Promise((r) => setTimeout(r, 16))
        } catch (e) {
          console.warn('pin render failed', pin.id, e)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [pins])
  return imgs
}

const ratio = { '1:1': 'aspect-square', '4:5': 'aspect-[4/5]', '9:16': 'aspect-[9/16]' }

function Pin({ pin, src, index }) {
  const loadShowcase = useStudio((s) => s.loadShowcase)
  const showToast = useStudio((s) => s.showToast)
  const vibe = VIBE_MAP[pin.vibe]
  const remix = () => {
    loadShowcase(pin)
    showToast(`Remixing “${pin.title}” — make it yours ✨`)
  }
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.4 }} className="mb-4 break-inside-avoid md:mb-5">
      <div className="group relative cursor-zoom-in overflow-hidden rounded-[22px] bg-linen" onClick={remix}>
        <div className={ratio[pin.aspect]}>
          {src ? <img src={src} alt={pin.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="h-full w-full animate-pulse bg-gradient-to-br from-linen to-sand/70" />}
        </div>
        <div className="absolute inset-0 bg-espresso/0 transition duration-300 group-hover:bg-espresso/25" />
        <div className="absolute left-2.5 top-2.5 max-w-[85%] truncate rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold text-espresso backdrop-blur"><span className="inline-flex items-center gap-1"><VibeIcon id={pin.kind === 'letter' ? 'letters' : vibe.id} size={11} />{pin.kind === 'letter' ? 'Letter' : vibe.name}</span></div>
        <button onClick={(e) => (e.stopPropagation(), remix())} className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-terracotta text-[12px] font-bold text-white shadow-soft transition md:bottom-auto md:right-3 md:top-3 md:h-auto md:w-auto md:translate-y-1 md:px-3.5 md:py-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100" title="Remix this look">
          <Wand2 size={14} /> <span className="hidden md:inline">Remix</span>
        </button>
        <div className="absolute inset-x-3 bottom-3 hidden items-center justify-between md:flex">
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-espresso opacity-0 backdrop-blur transition group-hover:opacity-100">
            <ArrowUpRight size={12} /> Try this look
          </span>
          {src && (
            <a href={src} download={`mirelle-${pin.id}.jpg`} onClick={(e) => e.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-espresso opacity-0 backdrop-blur transition group-hover:opacity-100" title="Save preview">
              <Download size={14} />
            </a>
          )}
        </div>
      </div>
      <div className="px-1.5 pt-2">
        <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-espresso">{pin.title}</h3>
        <p className="mt-0.5 text-[11.5px] text-taupe">{pin.kind === 'letter' ? 'Letter Studio' : pin.recipe.summary.split('·')[1]?.trim()}</p>
      </div>
    </motion.article>
  )
}

export default function ExploreBoard() {
  const setMode = useStudio((s) => s.setMode)
  const [q, setQ] = useState('')
  const [vibe, setVibe] = useState('all')
  const pins = useMemo(
    () =>
      BOARD.filter((p) => (vibe === 'all' ? true : vibe === 'letters' ? p.kind === 'letter' : p.vibe === vibe)).filter((p) => {
        if (!q.trim()) return true
        const hay = `${p.title} ${VIBE_MAP[p.vibe].name} ${p.kind}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      }),
    [q, vibe],
  )
  const imgs = usePinImages(BOARD)
  const [heroFrames, framed] = useFramedExamples(3)
  const openFrame = useOpenFrame()

  return (
    <div className="soft-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1500px] px-3 pb-28 pt-4 sm:px-5 md:px-8 md:pb-12 md:pt-6">
        {/* hero */}
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-sand bg-gradient-to-br from-[#f6ede1] via-[#f3e7da] to-[#eadfce] p-5 sm:p-8 md:mb-8 md:p-10">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-terracotta/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-sage/20 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-terracotta">
                <Sparkles size={12} /> Aesthetic studio & letter maker
              </span>
              <h1 className="mt-3 font-serif text-[34px] leading-[1.05] text-espresso sm:text-5xl md:text-[56px]">
                Make your camera roll <em className="text-terracotta">Pinterest-worthy.</em>
              </h1>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-taupe">Real Pinterest-style photo frames: pick one and your photo drops perfectly into place. Film grain, filters, stickers when you want them, and HD PNG downloads.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button className="btn-primary h-11 px-5" onClick={() => setMode('photo')}>
                  <Camera size={16} /> Open Photo Studio
                </button>
                <button className="btn-ghost h-11 px-5" onClick={() => setMode('letter')}>
                  <Mail size={16} /> Write a Letter
                </button>
              </div>
            </div>
            <div className="relative hidden h-[330px] md:block">
              {heroFrames.length
                ? heroFrames.map((f, i) => (
                    <motion.button
                      key={f.id}
                      onClick={() => openFrame(f.id)}
                      initial={{ opacity: 0, y: 30, rotate: 0 }}
                      animate={{ opacity: 1, y: 0, rotate: [-7, 3, 8][i] }}
                      whileHover={{ y: -8, rotate: 0, zIndex: 5 }}
                      transition={{ delay: 0.15 * i, type: 'spring', stiffness: 120 }}
                      className="absolute w-[30%] overflow-hidden rounded-2xl border-[5px] border-white bg-linen shadow-lift"
                      style={{ left: ['3%', '34%', '65%'][i], top: [26, 4, 32][i] }}
                      title={f.name}
                    >
                      <div className="aspect-[9/16] w-full">{framed[f.id] && <img src={framed[f.id]} alt={f.name} className="h-full w-full object-cover" />}</div>
                    </motion.button>
                  ))
                : [BOARD[0], BOARD[2], BOARD[1]].map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, rotate: [-8, 4, -2][i] }}
                  transition={{ delay: 0.15 * i, type: 'spring', stiffness: 120 }}
                  className="absolute w-[46%] overflow-hidden rounded-2xl border-[6px] border-white bg-linen shadow-lift"
                  style={{ left: ['0%', '27%', '54%'][i], top: [30, 0, 40][i] }}
                >
                  <div className={ratio[p.aspect] + ' max-h-[280px]'}>{imgs[p.id] && <img src={imgs[p.id]} alt="" className="h-full w-full object-cover" />}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FrameShowcase />

        {/* search + vibe filters */}
        <div className="sticky top-0 z-20 -mx-3 mb-5 bg-oat/90 px-3 py-2 backdrop-blur sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <label className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-linen px-4 ring-terracotta/20 transition focus-within:bg-white focus-within:ring-4 lg:max-w-md">
              <Search size={17} className="text-taupe" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search looks: golden hour, letters, coquette…" className="w-full bg-transparent text-[14px] outline-none placeholder:text-taupe/70" />
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {[{ id: 'all', name: 'All', emoji: '✦' }, ...VIBES, { id: 'letters', name: 'Letters', emoji: '💌' }].map((v) => (
                <button key={v.id} onClick={() => setVibe(v.id)} className={`chip h-9 px-3.5 ${vibe === v.id ? 'chip-active !bg-espresso !border-espresso' : ''}`}>
                  <VibeIcon id={v.id} /> {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* masonry */}
        {pins.length ? (
          <div className="columns-2 gap-3 sm:gap-4 md:columns-3 md:gap-5 xl:columns-4 2xl:columns-5">
            {pins.map((p, i) => (
              <Pin key={p.id} pin={p} src={imgs[p.id]} index={i} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-taupe">No looks match “{q}”. Try “vintage” or “letter”.</p>
        )}
      </div>
    </div>
  )
}
