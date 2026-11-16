import { useEffect, useMemo, useRef, useState } from 'react'

function useVp() {
  const get = () => ({ w: window.innerWidth, h: window.innerHeight })
  const [v, setV] = useState(get)
  useEffect(() => {
    const on = () => setV(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ImagePlus, Download, Smartphone, ChevronLeft, RefreshCcw, X, Loader2, Minus, Plus, Trash2, RotateCw } from 'lucide-react'
import { FRAMES } from '../../data/frames'
import { STICKERS, STICKER_MAP } from '../../data/stickers'
import { loadTemplate } from '../../lib/templateFrames'
import { prepareSticker, getStickerCanvas } from '../../lib/imageStickers'
import { useStudio } from '../../store/useStudio'
import GestureStickers from '../ui/GestureStickers'
import { FILTERS } from '../../data/filters'
import { STRIP_LAYOUTS, STRIP_STYLES, renderStrip, stripLayout } from '../../lib/stripRenderer'
import { makeCanvas, renderFilteredPhoto } from '../../lib/photoRenderer'
import { deliverCanvas } from '../../lib/exporter'
import { makeStory } from '../../lib/story'
import { fileToDataUrl } from '../photo/PhotosPanel'
import { loadAllFonts } from '../../data/fonts'
import { crack, chime, buzz } from '../../lib/sfx'

const BOOTH_FILTERS = ['original', 'noir-soft', 'gold-200', 'porcelain', 'super-8', 'honey', 'rose', 'cinema', 'y2k-flash', 'stardust']
const loadImg = (src) =>
  new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })

/* ---------------- scene: strip inside a frame backdrop + stickers ---------------- */
const BACKDROPS = () => FRAMES.filter((f) => f.kind === 'template' && f.preview && (f.meta?.slots?.length || 1) <= 1)

function drawStickers(ctx, W, H, list) {
  for (const st of list) {
    const d = STICKER_MAP[st.id]
    const src = d && getStickerCanvas(d)
    if (!src) continue
    const w = st.w * W
    const h = (w * (d.h || 1)) / (d.w || 1)
    ctx.save()
    ctx.translate(st.x * W, st.y * H)
    ctx.rotate(((st.r || 0) * Math.PI) / 180)
    ctx.shadowColor = 'rgba(40,25,15,0.28)'
    ctx.shadowBlur = W * 0.012
    ctx.shadowOffsetY = W * 0.005
    ctx.drawImage(src, -w / 2, -h / 2, w, h)
    ctx.restore()
  }
}

/** Strip alone, or the strip set into a frame's card (frame flowers stay on top), then stickers. */
export function composeBooth(targetW, { tpl, L, strip, stickers, images = [], adj = {} }) {
  if (!tpl) {
    const c = makeCanvas(targetW, Math.round(targetW / L.ratio))
    const ctx = c.getContext('2d')
    ctx.drawImage(strip(targetW), 0, 0, c.width, c.height)
    drawStickers(ctx, c.width, c.height, stickers)
    return c
  }
  const W = targetW
  const H = Math.round(W / tpl.aspect)
  const c = makeCanvas(W, H)
  const ctx = c.getContext('2d')
  const iw = tpl.img.naturalWidth || tpl.img.width
  const ih = tpl.img.naturalHeight || tpl.img.height
  const k = Math.max(W / iw, H / ih)
  const ox = (W - iw * k) / 2
  const oy = (H - ih * k) / 2
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(tpl.img, ox, oy, iw * k, ih * k)
  const [sx, sy, sw, sh] = tpl.slot
  const S = { x: ox + sx * iw * k, y: oy + sy * ih * k, w: sw * iw * k, h: sh * ih * k }
  // the frame IS the frame: photos go straight into its card, edge to edge with hairline gaps
  const g = Math.max(2, Math.min(S.w, S.h) * 0.018)
  const n = L.shots
  const cells =
    L.id === 'grid'
      ? [0, 1, 2, 3].map((i) => ({ x: S.x + (i % 2) * ((S.w + g) / 2), y: S.y + Math.floor(i / 2) * ((S.h + g) / 2), w: (S.w - g) / 2, h: (S.h - g) / 2 }))
      : [...Array(n)].map((_, i) => ({ x: S.x, y: S.y + i * ((S.h + g) / n), w: S.w, h: (S.h - g * (n - 1)) / n }))
  ctx.fillStyle = '#f4eee5'
  ctx.fillRect(S.x, S.y, S.w, S.h)
  cells.forEach((C, i) => {
    const img = images[i]
    if (img) {
      const fp = renderFilteredPhoto(img, adj, { zoom: 1, x: 0, y: -0.25 }, Math.round(C.w), Math.round(C.h), { cache: false })
      ctx.drawImage(fp, C.x, C.y, C.w, C.h)
    } else {
      const eg = ctx.createLinearGradient(C.x, C.y, C.x + C.w, C.y + C.h)
      eg.addColorStop(0, '#efe6d8')
      eg.addColorStop(1, '#e2d5c1')
      ctx.fillStyle = eg
      ctx.fillRect(C.x, C.y, C.w, C.h)
      ctx.fillStyle = 'rgba(110,85,65,0.35)'
      ctx.font = `300 ${Math.min(C.w, C.h) * 0.3}px "Plus Jakarta Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('+', C.x + C.w / 2, C.y + C.h / 2)
    }
  })
  if (tpl.overlay) ctx.drawImage(tpl.overlay, ox, oy, iw * k, ih * k)
  drawStickers(ctx, W, H, stickers)
  return c
}

/* ---------------- camera booth ---------------- */
function CameraBooth({ shots, onDone, onClose }) {
  const video = useRef(null)
  const [err, setErr] = useState('')
  const [count, setCount] = useState(null)
  const [flash, setFlash] = useState(0)
  const [taken, setTaken] = useState([])
  const [running, setRunning] = useState(false)
  useEffect(() => {
    let stream
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        stream = s
        if (video.current) video.current.srcObject = s
      })
      .catch(() => setErr('Camera access was blocked. You can still upload photos.'))
    if (!navigator.mediaDevices) setErr('This browser has no camera access. You can still upload photos.')
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])
  const snap = () => {
    const v = video.current
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const x = c.getContext('2d')
    x.translate(c.width, 0)
    x.scale(-1, 1) // mirror, like a real booth
    x.drawImage(v, 0, 0)
    return c.toDataURL('image/jpeg', 0.92)
  }
  const start = async () => {
    if (running || !video.current?.videoWidth) return
    setRunning(true)
    const out = []
    for (let i = 0; i < shots; i++) {
      for (const n of [3, 2, 1]) {
        setCount(n)
        buzz(8)
        await new Promise((r) => setTimeout(r, 750))
      }
      setCount(null)
      setFlash((f) => f + 1)
      crack()
      buzz(30)
      out.push(snap())
      setTaken([...out])
      await new Promise((r) => setTimeout(r, 650))
    }
    chime()
    setRunning(false)
    onDone(out)
  }
  return (
    <motion.div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0f0d0c]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close camera">
        <X size={18} />
      </button>
      <p className="absolute left-5 top-5 font-serif text-[15px] italic text-white/70">Mirelle booth</p>
      {err ? (
        <p className="max-w-xs text-center text-[14px] text-white/80">{err}</p>
      ) : (
        <div className="relative w-[min(88vw,520px)] overflow-hidden rounded-[22px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]" style={{ aspectRatio: '4 / 5' }}>
          <video ref={video} autoPlay playsInline muted className="h-full w-full scale-x-[-1] object-cover" />
          {/* booth frame vignette */}
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,0.55)' }} />
          <AnimatePresence>
            {count && (
              <motion.div key={count} className="absolute inset-0 flex items-center justify-center" initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.35 }}>
                <span className="font-serif text-[120px] italic leading-none text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.5)]">{count}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {flash > 0 && <motion.div key={flash} className="absolute inset-0 bg-white" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.55 }} />}
          </AnimatePresence>
        </div>
      )}
      {/* film counter */}
      <div className="mt-5 flex gap-2">
        {[...Array(shots)].map((_, i) => (
          <div key={i} className="h-14 w-11 overflow-hidden rounded-md border border-white/20 bg-white/5">
            {taken[i] && <motion.img src={taken[i]} alt="" className="h-full w-full object-cover" initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} />}
          </div>
        ))}
      </div>
      {!err && (
        <button onClick={start} disabled={running} className="mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/80 bg-white/10 text-white transition active:scale-95 disabled:opacity-40" aria-label="Start the booth">
          <span className={`h-11 w-11 rounded-full ${running ? 'bg-red-500' : 'bg-white'}`} />
        </button>
      )}
      <p className="mt-3 text-[12px] uppercase tracking-[0.28em] text-white/50">{running ? 'strike a pose' : `${shots} shots · tap to start`}</p>
    </motion.div>
  )
}

/* ---------------- page ---------------- */
export default function BoothPage() {
  const setMode = useStudio((s) => s.setMode)
  const showToast = useStudio((s) => s.showToast)
  const [layout, setLayout] = useState('four')
  const [style, setStyle] = useState('gallery')
  const [filter, setFilter] = useState('original')
  const [caption, setCaption] = useState('us, always')
  const [showDate, setShowDate] = useState(true)
  const [srcs, setSrcs] = useState([])
  const [imgs, setImgs] = useState([])
  const [camera, setCamera] = useState(false)
  const [busy, setBusy] = useState('')
  const [fontsReady, setFontsReady] = useState(false)
  const [backdrop, setBackdrop] = useState(null) // frame id
  const [tpl, setTpl] = useState(null)
  const [stickers, setStickers] = useState([])
  const [sel, setSel] = useState(null)
  const [stTick, setStTick] = useState(0)
  const backdrops = useMemo(() => BACKDROPS(), [])
  const stickerList = useMemo(() => STICKERS.filter((s) => s.kind === 'image' && !s.custom), [])
  useEffect(() => {
    let alive = true
    if (!backdrop) return setTpl(null)
    loadTemplate(FRAMES.find((f) => f.id === backdrop)).then((t) => alive && setTpl(t))
    return () => {
      alive = false
    }
  }, [backdrop])
  const addSticker = async (id) => {
    await prepareSticker(STICKER_MAP[id]).catch(() => {})
    setStickers((l) => [...l, { id, x: 0.25 + Math.random() * 0.5, y: 0.2 + Math.random() * 0.6, w: tpl ? 0.22 : 0.4, r: Math.round(Math.random() * 24 - 12) }])
    setSel(stickers.length)
    setStTick((t) => t + 1)
  }
  const fileRef = useRef(null)
  const pickIdx = useRef(null)
  const canvasRef = useRef(null)
  const L = stripLayout(layout)
  const vp = useVp()
  const mobile = vp.w < 768
  const adj = useMemo(() => FILTERS.find((f) => f.id === filter)?.params || {}, [filter])

  useEffect(() => {
    loadAllFonts().then(() => setFontsReady(true))
  }, [])
  useEffect(() => {
    let alive = true
    Promise.all(srcs.map((s) => (s ? loadImg(s).catch(() => null) : null))).then((r) => alive && setImgs(r))
    return () => {
      alive = false
    }
  }, [srcs])

  // live preview
  const ratio = tpl ? tpl.aspect : L.ratio
  const PW = tpl ? 360 : L.id === 'grid' ? 520 : 300
  const PH = Math.round(PW / ratio)
  const stripFn = (w) => {
    const c = makeCanvas(w, Math.round(w / L.ratio))
    renderStrip(c.getContext('2d'), c.width, c.height, { layout, style, images: imgs, adj, caption, showDate })
    return c
  }
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const raf = requestAnimationFrame(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const out = composeBooth(Math.round(PW * dpr), { tpl, L, strip: stripFn, stickers, images: imgs, adj })
      c.width = out.width
      c.height = out.height
      c.getContext('2d').drawImage(out, 0, 0)
    })
    return () => cancelAnimationFrame(raf)
  }, [imgs, layout, style, adj, caption, showDate, PW, PH, fontsReady, tpl, stickers, stTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = async (files, at = null) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    const urls = await Promise.all(list.map((f) => fileToDataUrl(f)))
    setSrcs((prev) => {
      const next = [...prev]
      if (at != null) next[at] = urls[0]
      else
        urls.forEach((u) => {
          const empty = [...Array(L.shots)].findIndex((_, i) => !next[i])
          if (empty >= 0) next[empty] = u
          else next.push(u)
        })
      return next.slice(0, 4)
    })
  }

  const renderHD = (scale) => composeBooth(Math.round((tpl ? 1440 : L.id === 'grid' ? 1800 : 1200) * scale), { tpl, L, strip: stripFn, stickers, images: imgs, adj })
  const filled = imgs.slice(0, L.shots).filter(Boolean).length
  const save = async (story) => {
    if (!filled) return showToast('Add photos first ✨')
    setBusy(story ? 'story' : 'png')
    await new Promise((r) => setTimeout(r, 30))
    try {
      const strip = renderHD(story ? 1 : 1.5)
      const out = story
        ? await deliverCanvas(makeStory(strip, tpl ? { fill: 0.9, radius: 0.012 } : { tilt: L.id === 'grid' ? 0 : -3, fill: L.id === 'grid' ? 0.86 : 0.62, radius: 0.008 }), `mirelle-booth-story.jpg`, useStudio.getState().setReadyExport, 'jpg')
        : await deliverCanvas(strip, `mirelle-booth-${Date.now()}.png`, useStudio.getState().setReadyExport)
      if (!out.pending) showToast(story ? 'Story saved ✨' : 'Strip saved ✨')
    } catch (e) {
      showToast(e.message || 'Could not save')
    } finally {
      setBusy('')
    }
  }

  const Chip = ({ on, onClick, children }) => (
    <button onClick={onClick} className={`chip shrink-0 ${on ? 'chip-active' : ''}`}>
      {children}
    </button>
  )

  return (
    <div className="soft-scroll h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-5 px-4 pb-32 pt-4 md:grid-cols-[minmax(0,1fr)_380px] md:gap-10 md:px-8 md:pb-12 md:pt-8">
        {/* preview */}
        <div className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[28px] border border-sand/70 bg-gradient-to-br from-[#faf5ee] via-[#f3e9dc] to-[#e9dccb] py-7 md:min-h-[70vh] md:py-10">
          <button onClick={() => setMode('explore')} className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-sand bg-white text-espresso shadow-soft" aria-label="Back">
            <ChevronLeft size={18} />
          </button>
          <p className="mb-5 flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.32em] text-taupe">
            <span className="h-px w-6 bg-taupe/40" /> photo booth
          </p>
          <motion.div
            key={layout + (tpl ? backdrop : '')}
            initial={{ y: 30, opacity: 0, rotate: 0 }}
            animate={{ y: [0, -6, 0], opacity: 1, rotate: tpl ? 0 : L.id === 'grid' ? -1 : mobile ? -2 : -3 }}
            transition={{ y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, default: { type: 'spring', stiffness: 80, damping: 14 } }}
            className="relative"
            style={{ width: Math.round(Math.min(tpl ? 400 : L.id === 'grid' ? 520 : 300, vp.w * (tpl ? 0.8 : L.id === 'grid' ? 0.74 : 0.6), vp.h * (mobile ? 0.52 : 0.7) * ratio)), filter: 'drop-shadow(0 30px 40px rgba(40,25,15,0.35)) drop-shadow(0 6px 10px rgba(40,25,15,0.18))' }}
          >
            <canvas ref={canvasRef} className="block h-auto w-full max-w-full" style={{ aspectRatio: `${PW} / ${PH}` }} />
            {/* tap a frame to replace that photo */}
            {!tpl && (
            <div className="absolute inset-0">
              {[...Array(L.shots)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    pickIdx.current = i
                    fileRef.current?.click()
                  }}
                  className="absolute outline-none"
                  style={{ left: 0, right: 0, top: `${(i / L.shots) * 85}%`, height: `${85 / L.shots}%`, ...(L.id === 'grid' ? { left: `${(i % 2) * 50}%`, right: `${(1 - (i % 2)) * 50}%`, top: `${Math.floor(i / 2) * 41}%`, height: '41%' } : {}) }}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
            )}
            <GestureStickers list={stickers} setList={setStickers} sel={sel} setSel={setSel} />
          </motion.div>
          <p className="mt-5 px-4 text-center text-[11.5px] text-taupe">{filled ? 'Tap a frame to swap that photo' : 'Take photos or add your own'}</p>
        </div>

        {/* controls */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => setCamera(true)} className="btn-primary h-12 text-[14px]">
              <Camera size={17} /> Take photos
            </button>
            <button
              onClick={() => {
                pickIdx.current = null
                fileRef.current?.click()
              }}
              className="btn-ghost h-12 text-[14px]"
            >
              <ImagePlus size={17} /> Upload
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files || [], pickIdx.current)
              e.target.value = ''
            }}
          />

          <div>
            <p className="mb-2 text-[12px] font-semibold text-espresso">Layout</p>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {STRIP_LAYOUTS.map((l) => (
                <Chip key={l.id} on={layout === l.id} onClick={() => setLayout(l.id)}>
                  {l.name}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold text-espresso">Strip</p>
            <div className="grid grid-cols-3 gap-2">
              {STRIP_STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyle(s.id)} className={`tile flex flex-col items-center gap-1.5 px-1 py-2.5 ${style === s.id ? 'tile-active' : ''}`}>
                  <span className="h-8 w-5 rounded-[3px] shadow-soft" style={{ background: s.swatch, border: '1px solid rgba(0,0,0,0.08)' }} />
                  <span className="text-[10.5px] font-semibold leading-tight text-espresso">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold text-espresso">Film</p>
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {BOOTH_FILTERS.map((id) => {
                const f = FILTERS.find((x) => x.id === id)
                return f ? (
                  <Chip key={id} on={filter === id} onClick={() => setFilter(id)}>
                    {f.name}
                  </Chip>
                ) : null
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold text-espresso">Backdrop frame</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              <button onClick={() => setBackdrop(null)} className={`tile flex h-[106px] w-[62px] shrink-0 items-center justify-center text-[10.5px] font-semibold text-taupe ${!backdrop ? 'tile-active' : ''}`}>
                Strip only
              </button>
              {backdrops.map((f) => (
                <button key={f.id} onClick={() => setBackdrop(f.id)} className={`tile h-[106px] w-[62px] shrink-0 overflow-hidden p-0.5 ${backdrop === f.id ? 'tile-active' : ''}`} title={f.name}>
                  <img src={f.preview} alt={f.name} loading="lazy" className="h-full w-full rounded-[10px] object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[12px] font-semibold text-espresso">Stickers</p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              {stickerList.map((s) => (
                <button key={s.id} onClick={() => addSticker(s.id)} className="tile flex h-14 w-14 shrink-0 items-center justify-center p-1" title={s.name}>
                  {(s.preview || s.src) && <img src={s.preview || s.src} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain" />}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] text-taupe">Tap to add · drag with one finger · pinch & twist with two</p>
          </div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-espresso">Caption</span>
            <input className="input font-serif italic" maxLength={28} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="us, always" />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-sand bg-white/60 px-4 py-3">
            <span className="text-[13px] font-medium text-espresso">Date stamp</span>
            <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="h-5 w-5 accent-[#c87d65]" />
          </label>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button onClick={() => save(false)} disabled={!!busy} className="btn-primary h-12 text-[14px]">
              {busy === 'png' ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />} Save strip
            </button>
            <button onClick={() => save(true)} disabled={!!busy} className="btn-ghost h-12 text-[14px]">
              {busy === 'story' ? <Loader2 size={17} className="animate-spin" /> : <Smartphone size={17} />} Story
            </button>
          </div>
          {filled > 0 && (
            <button onClick={() => setSrcs([])} className="flex w-full items-center justify-center gap-1.5 py-1 text-[12px] font-medium text-taupe hover:text-espresso">
              <RefreshCcw size={13} /> Start over
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {camera && (
          <CameraBooth
            shots={L.shots}
            onClose={() => setCamera(false)}
            onDone={(shots) => {
              setSrcs(shots)
              setTimeout(() => setCamera(false), 700)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
