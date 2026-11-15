import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Camera, Mail, ArrowUpRight, Flower2, Heart, Sun, Landmark, Camera as CameraIcon, Folder } from 'lucide-react'
import { FRAMES } from '../../data/frames'
import { useStudio } from '../../store/useStudio'
import { openFrame } from './FrameShowcase'

// Home: a premium gallery of real photo frames. Every card is a small pre-rendered image,
// so the page does no canvas work at all and stays fast on any phone.
// category = folder name in src/assets/frames/
const CAT_INFO = { floral: ['Floral', Flower2], romantic: ['Romantic', Heart], sunflower: ['Sunflower', Sun], desi: ['Desi', Landmark], vintage: ['Vintage', CameraIcon] }
const catInfo = (id) => CAT_INFO[id] || [id.charAt(0).toUpperCase() + id.slice(1), Folder]

function Card({ f, i }) {
  return (
    <motion.button
      onClick={() => openFrame(f.id)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '120px' }}
      transition={{ duration: 0.45, delay: (i % 6) * 0.04 }}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-linen text-left shadow-soft sm:mb-4 md:mb-5"
    >
      <div className="aspect-[9/16] w-full overflow-hidden">
        <img src={f.preview} alt={f.name} loading={i < 8 ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-3 pb-3 pt-10">
        <span className="truncate font-serif text-[15px] italic text-white">{f.name}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-espresso opacity-0 shadow-soft transition group-hover:opacity-100">
          <ArrowUpRight size={15} />
        </span>
      </div>
    </motion.button>
  )
}

export default function ExploreBoard() {
  const setMode = useStudio((s) => s.setMode)
  const framesVersion = useStudio((s) => s.framesVersion)
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const all = useMemo(() => FRAMES.filter((f) => f.kind === 'template' && f.preview), [framesVersion])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((f) => (cat === 'all' || f.category === cat) && (!t || f.name.toLowerCase().includes(t) || f.category.includes(t)))
  }, [all, cat, q])
  const hero = [all[0], all[1], all[3]].filter(Boolean)
  const CATS = useMemo(() => [{ id: 'all', name: 'All', icon: Sparkles }, ...[...new Set(all.map((f) => f.category))].map((id) => ({ id, name: catInfo(id)[0], icon: catInfo(id)[1] }))], [all])

  return (
    <div className="soft-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-[1500px] px-3 pb-28 pt-4 sm:px-5 md:px-8 md:pb-12 md:pt-6">
        {/* hero */}
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-sand/70 bg-gradient-to-br from-[#faf5ee] via-[#f6eee4] to-[#efe4d6] px-6 py-7 sm:p-8 md:mb-8 md:p-12">
          <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-terracotta/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-sage/20 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.32em] text-taupe">
                <span className="h-px w-6 bg-taupe/40" /> Mirelle · aesthetic studio
              </p>
              <h1 className="mt-4 font-serif text-[30px] font-normal leading-[1.15] text-espresso sm:text-[38px] md:text-[44px]">
                <em className="font-normal">little frames</em> for your
                <br />
                softest moments <span className="text-terracotta/80">✦</span>
              </h1>
              <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-taupe">Pressed flowers, film light & paper keepsakes. Choose a frame and your photo settles right in.</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-espresso px-5 text-[13px] font-medium text-oat transition hover:bg-espresso/90" onClick={() => setMode('photo')}>
                  <Camera size={15} strokeWidth={1.7} /> Start creating
                </button>
                <button className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-espresso/80 underline-offset-4 transition hover:underline" onClick={() => setMode('letter')}>
                  <Mail size={15} strokeWidth={1.7} /> Write a letter
                </button>
              </div>
            </div>
            <div className="relative hidden h-[330px] md:block">
              {hero.map((f, i) => (
                <motion.button
                  key={f.id}
                  onClick={() => openFrame(f.id)}
                  initial={{ opacity: 0, y: 30, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, rotate: [-7, 3, 8][i] }}
                  whileHover={{ y: -8, rotate: 0, zIndex: 5 }}
                  transition={{ delay: 0.12 * i, type: 'spring', stiffness: 120 }}
                  className="absolute w-[30%] overflow-hidden rounded-2xl border-[5px] border-white bg-linen shadow-lift"
                  style={{ left: ['3%', '34%', '65%'][i], top: [26, 4, 32][i] }}
                  title={f.name}
                >
                  <div className="aspect-[9/16] w-full">
                    <img src={f.preview} alt={f.name} fetchpriority="high" decoding="async" className="h-full w-full object-cover" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* search + categories */}
        <div className="sticky top-0 z-20 -mx-3 mb-5 bg-oat/85 px-3 py-3 backdrop-blur-md sm:-mx-5 sm:px-5 md:-mx-8 md:px-8">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <label className="group flex h-12 w-full shrink-0 items-center gap-3 rounded-2xl border border-sand/80 bg-white/80 px-4 shadow-[0_6px_20px_-14px_rgba(60,40,30,0.35)] backdrop-blur transition focus-within:border-terracotta/40 focus-within:bg-white focus-within:shadow-[0_8px_26px_-14px_rgba(200,125,101,0.55)] lg:max-w-md">
              <Search size={17} strokeWidth={1.8} className="shrink-0 text-taupe transition group-focus-within:text-terracotta" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search frames — rose, sunflower, vintage…" className="min-w-0 flex-1 bg-transparent font-serif text-[15px] italic text-espresso outline-none placeholder:not-italic placeholder:font-sans placeholder:text-[13.5px] placeholder:text-taupe/70" />
              {q && (
                <button onClick={() => setQ('')} className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-taupe hover:bg-linen" aria-label="Clear search">
                  Clear
                </button>
              )}
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {CATS.map(({ id, name, icon: Icon }) => (
                <button key={id} onClick={() => setCat(id)} className={`chip h-9 shrink-0 px-3.5 ${cat === id ? 'chip-active !bg-espresso !border-espresso' : ''}`}>
                  <Icon size={14} strokeWidth={1.9} /> {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* gallery */}
        {list.length ? (
          <div className="columns-2 gap-3 sm:gap-4 md:columns-3 md:gap-5 xl:columns-4 2xl:columns-5">
            {list.map((f, i) => (
              <Card key={f.id} f={f} i={i} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-taupe">No frames match “{q}”. Try “rose” or “ocean”.</p>
        )}
      </div>
    </div>
  )
}
