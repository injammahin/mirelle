import { useId } from 'react'
import { motion } from 'framer-motion'
import { ENVELOPES, RIBBONS } from '../../lib/share'
import { STICKER_MAP } from '../../data/stickers'

/* ---------------- colour helpers ---------------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
export const shade = (h, k) => toHex(hex(h).map((v) => (k < 0 ? v * (1 + k) : v + (255 - v) * k)))
const GOLD = ['#a87a2e', '#f3d891', '#b98a3a', '#f1d58f', '#8f6424']

/* paper grain: noise clipped to whatever shape it is applied to */
const Grain = ({ id, amount = 0.11 }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="3" stitchTiles="stitch" result="n" />
    <feColorMatrix in="n" values={`0 0 0 0 0.32  0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 ${amount} 0`} result="g" />
    <feComposite in="g" in2="SourceAlpha" operator="in" />
  </filter>
)

/* embossed cotton paper: lit relief of fine fibres, kept inside the shape */
const Emboss = ({ id, seed = 3 }) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="2.6 2.1" numOctaves="2" seed={seed} result="n" />
    <feDiffuseLighting in="n" surfaceScale="0.22" lightingColor="#ffffff" result="l">
      <feDistantLight azimuth="225" elevation="58" />
    </feDiffuseLighting>
    <feComposite in="l" in2="SourceAlpha" operator="in" />
  </filter>
)
const Foil = ({ id }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.4" spreadMethod="reflect">
    <stop offset="0" stopColor="#9c6f28" />
    <stop offset="0.35" stopColor="#f6e2a6" />
    <stop offset="0.5" stopColor="#fff6d8" />
    <stop offset="0.65" stopColor="#d4ab55" />
    <stop offset="1" stopColor="#8a5e1e" />
    <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;1 0" dur="5s" repeatCount="indefinite" />
  </linearGradient>
)

const FLAP_PATH = {
  classic: 'M0 0 L100 0 L50 37 Z',
  scallop: 'M0 0 L100 0 C100 14 74 20 62 31 Q50 44 38 31 C26 20 0 14 0 0 Z',
  round: 'M0 0 L100 0 L100 6 C82 30 66 40 50 40 C34 40 18 30 0 6 Z',
}
const FLAP_TIP = { classic: 37, scallop: 38, round: 40 } // in the 0..64 viewBox

function Liner({ id, liner, c }) {
  if (liner === 'gold')
    return (
      <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill={shade(c, 0.55)} />
        <circle cx="2.5" cy="2.5" r="0.55" fill="#c9a24a" />
      </pattern>
    )
  if (liner === 'gingham')
    return (
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#fbf7f0" />
        <rect width="3" height="6" fill={shade(c, -0.05)} opacity="0.55" />
        <rect width="6" height="3" fill={shade(c, -0.05)} opacity="0.55" />
      </pattern>
    )
  if (liner === 'stripe')
    return (
      <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="4" height="4" fill="#fbf7f0" />
        <rect width="1.6" height="4" fill={shade(c, -0.08)} opacity="0.6" />
      </pattern>
    )
  return (
    <pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill={shade(c, -0.12)} />
    </pattern>
  )
}

/* ---------------- closures ---------------- */
export function Bow({ color, size, twine }) {
  if (twine)
    return (
      <svg width={size} height={size * 0.75} viewBox="0 0 120 90" style={{ overflow: 'visible' }}>
        {[0, 1.6].map((o, i) => (
          <g key={i} fill="none" stroke={i ? '#d6b98f' : '#9a7448'} strokeWidth={i ? 1.6 : 3.4} strokeLinecap="round" strokeDasharray={i ? '3 4' : undefined} transform={`translate(${o} ${-o})`}>
            <path d="M60 44 C42 18 14 22 20 40 C26 56 48 50 60 44" />
            <path d="M60 44 C78 18 106 22 100 40 C94 56 72 50 60 44" />
            <path d="M58 46 C52 62 44 76 34 88" />
            <path d="M62 46 C68 62 78 74 90 86" />
          </g>
        ))}
        <ellipse cx="60" cy="44" rx="6" ry="5" fill="#a27b4f" />
      </svg>
    )
  const uid = useId().replace(/:/g, '')
  const edge = shade(color, -0.35)
  const loopL = 'M60 46 C46 30 30 6 14 12 C-2 18 4 44 20 50 C34 55 50 50 60 46 Z'
  const loopR = 'M60 46 C74 30 90 6 106 12 C122 18 116 44 100 50 C86 55 70 50 60 46 Z'
  const tailL = 'M57 50 C50 62 44 72 32 80 C27 84 22 86 18 92 L27 90 L28 98 C38 88 46 80 52 70 C56 62 59 56 61 50 Z'
  const tailR = 'M63 50 C70 62 78 72 90 80 C95 84 100 86 104 92 L95 90 L94 98 C84 88 76 80 70 70 C66 62 61 56 59 50 Z'
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 120 100" style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 5px rgba(60,30,30,0.25))' }}>
      <defs>
        <linearGradient id={`o${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, 0.45)} />
          <stop offset="0.35" stopColor={color} />
          <stop offset="0.55" stopColor={shade(color, 0.35)} />
          <stop offset="0.8" stopColor={shade(color, -0.1)} />
          <stop offset="1" stopColor={shade(color, 0.2)} />
        </linearGradient>
      </defs>
      {/* sheer organza: translucent, layered, braided edge */}
      {[tailL, tailR, loopL, loopR].map((d, i) => (
        <g key={i}>
          <path d={d} fill={`url(#o${uid})`} fillOpacity="0.62" />
          <path d={d} fill="none" stroke={edge} strokeWidth="2.1" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={shade(color, 0.35)} strokeWidth="0.9" strokeDasharray="1.6 1.6" strokeLinejoin="round" />
        </g>
      ))}
      {/* inner folds catching light */}
      <path d="M58 44 C44 26 26 14 18 22" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M62 44 C76 26 94 14 102 22" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M56 47 C42 44 28 40 22 32" fill="none" stroke={edge} strokeOpacity="0.35" strokeWidth="1" />
      <path d="M64 47 C78 44 92 40 98 32" fill="none" stroke={edge} strokeOpacity="0.35" strokeWidth="1" />
      {/* knot */}
      <path d="M53 40 C55 36 65 36 67 40 C69 46 67 54 60 55 C53 54 51 46 53 40 Z" fill={`url(#o${uid})`} stroke={edge} strokeWidth="2" />
      <path d="M56 41 C58 39 62 39 64 41" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Wax seal that splits along a jagged crack. */
export function Seal({ src, size, cracked }) {
  const L = 'polygon(0 0, 52% 0, 45% 28%, 56% 50%, 44% 74%, 51% 100%, 0 100%)'
  const R = 'polygon(52% 0, 100% 0, 100% 100%, 51% 100%, 44% 74%, 56% 50%, 45% 28%)'
  const half = (clip, dir) => (
    <motion.img
      src={src}
      alt=""
      draggable={false}
      className="absolute inset-0 h-full w-full object-contain"
      style={{ clipPath: clip }}
      initial={false}
      animate={cracked ? { x: dir * size * 0.24, y: size * 0.2, rotate: dir * 18, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.5, 0, 0.75, 0] }}
    />
  )
  const crumbs = [...Array(12)].map((_, i) => ({ a: (i / 12) * Math.PI * 2 + i, d: size * (0.45 + (i % 4) * 0.12), s: size * (0.03 + (i % 3) * 0.018) }))
  return (
    <motion.div className="relative" style={{ width: size, height: size, filter: 'drop-shadow(0 6px 9px rgba(50,15,15,0.38))' }} initial={false} animate={cracked ? { scale: [1, 1.1, 0.96, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
      {half(L, -1)}
      {half(R, 1)}
      {!cracked && (
        <div className="seal-glint absolute inset-0" style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
      )}
      {cracked &&
        crumbs.map((c, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-[30%]"
            style={{ width: c.s, height: c.s, background: 'radial-gradient(circle at 30% 30%, #b0384a, #5a0e1a)' }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(c.a) * c.d, y: [0, Math.sin(c.a) * c.d * 0.6, Math.sin(c.a) * c.d * 0.6 + size * 0.9], opacity: [1, 1, 0], rotate: 220 }}
            transition={{ duration: 0.9, ease: 'easeOut', times: [0, 0.4, 1] }}
          />
        ))}
    </motion.div>
  )
}

/** Seal / ribbon / twine + optional dried-flower sprig. `released` plays the untie. ax/ay: anchor (0..1) */
export function Closure({ w, h, deco, sealSrc, released, gone = false, ax = 0.5, ay = 0.58, vertical = true }) {
  const sprig = deco.sprig !== 'none' && STICKER_MAP[deco.sprig]
  const s = Math.min(w, h * 1.5)
  const ribbon = (RIBBONS[deco.ribbon] || RIBBONS.blush).color
  const bandX = deco.closure === 'seal' ? ax : 0.3
  const go = { duration: 0.7, ease: [0.5, 0, 0.3, 1] }
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 6 }}>
      {/* band around the envelope */}
      {(deco.closure === 'ribbon' || deco.closure === 'twine') && (
        <motion.div
          className="absolute"
          style={
            vertical
              ? { left: `${bandX * 100}%`, top: -2, bottom: -2, width: deco.closure === 'twine' ? 3 : s * 0.11, transform: 'translateX(-50%)' }
              : { top: `${ay * 100}%`, left: -2, right: -2, height: deco.closure === 'twine' ? 3 : s * 0.11, transform: 'translateY(-50%)' }
          }
          initial={false}
          animate={released ? { opacity: 0, scaleY: vertical ? 0.2 : 1, scaleX: vertical ? 1 : 0.2 } : { opacity: 1, scaleX: 1, scaleY: 1 }}
          transition={{ ...go, delay: 0.2 }}
        >
          {deco.closure === 'twine' ? (
            <div className="h-full w-full" style={{ background: 'repeating-linear-gradient(170deg, #8f6a3f 0 3px, #c9a676 3px 5px)', boxShadow: '0 1px 2px rgba(0,0,0,.25)' }} />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(${vertical ? 90 : 180}deg, ${shade(ribbon, -0.15)}, ${shade(ribbon, 0.2)} 25%, ${ribbon} 45%, ${shade(ribbon, 0.4)} 60%, ${ribbon} 80%, ${shade(ribbon, -0.15)})`, opacity: 0.68, boxShadow: '0 1px 3px rgba(60,30,30,.25)', borderLeft: vertical ? `1.5px solid ${shade(ribbon, -0.3)}` : undefined, borderRight: vertical ? `1.5px solid ${shade(ribbon, -0.3)}` : undefined }} />
          )}
        </motion.div>
      )}
      {deco.closure === 'twine' && (
        <motion.div
          className="absolute"
          style={vertical ? { top: `${ay * 100}%`, left: -2, right: -2, height: 3, transform: 'translateY(-50%)' } : { left: '50%', top: -2, bottom: -2, width: 3, transform: 'translateX(-50%)' }}
          initial={false}
          animate={released ? { opacity: 0, [vertical ? 'y' : 'x']: vertical ? h * 0.4 : w * 0.4 } : { opacity: 1, x: 0, y: 0 }}
          transition={{ ...go, delay: 0.3 }}
        >
          <div className="h-full w-full" style={{ background: 'repeating-linear-gradient(80deg, #8f6a3f 0 3px, #c9a676 3px 5px)', boxShadow: '0 1px 2px rgba(0,0,0,.25)' }} />
        </motion.div>
      )}
      {/* knot point */}
      <div className="absolute" style={{ left: `${bandX * 100}%`, top: `${ay * 100}%` }}>
        {sprig && (
          <motion.img
            src={sprig.src}
            alt=""
            draggable={false}
            className="absolute max-w-none"
            style={{ width: s * 0.36, left: -s * 0.3, top: -s * 0.28, filter: 'drop-shadow(0 3px 4px rgba(40,30,20,.25))' }}
            initial={false}
            animate={released ? { x: -w * 0.35, y: -h * 0.2, rotate: -65, opacity: 0 } : { x: 0, y: 0, rotate: -28, opacity: 1 }}
            transition={go}
          />
        )}
        {deco.closure === 'seal' && !gone && (
          <div className="absolute" style={{ left: -s * 0.12, top: -s * 0.12 }}>
            <Seal src={sealSrc} size={s * 0.24} cracked={released} />
          </div>
        )}
        {(deco.closure === 'ribbon' || deco.closure === 'twine') && (
          <motion.div
            className="absolute"
            style={{ left: -s * (deco.closure === 'twine' ? 0.18 : 0.22), top: -s * (deco.closure === 'twine' ? 0.15 : 0.19) }}
            initial={false}
            animate={released ? { y: -h * 0.5, rotate: 25, scale: 0.7, opacity: 0 } : { y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={go}
          >
            <Bow color={ribbon} size={s * (deco.closure === 'twine' ? 0.36 : 0.44)} twine={deco.closure === 'twine'} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

/** Stickers the sender placed on the envelope (x,y,w are fractions of the envelope). */
export function EnvelopeStickers({ list = [], w }) {
  return list.map((st, i) => {
    const d = STICKER_MAP[st.id]
    if (!d?.src) return null
    return (
      <img
        key={i}
        src={d.src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none"
        style={{ left: `${st.x * 100}%`, top: `${st.y * 100}%`, width: st.w * w, transform: `translate(-50%,-50%) rotate(${st.r || 0}deg)`, zIndex: 7, filter: 'drop-shadow(0 2px 3px rgba(40,30,20,.22))' }}
      />
    )
  })
}

/* ---------------- envelope, flap side ---------------- */
export function EnvelopeBack({ W, deco, stage = 0, letterUrl, sealSrc, children, glow = false }) {
  const uid = useId().replace(/:/g, '')
  const H = W * 0.64
  const col = (ENVELOPES[deco.envelope] || ENVELOPES.ivory).body
  const flap = FLAP_PATH[deco.flap] ? deco.flap : 'classic'
  const tip = FLAP_TIP[flap] / 64
  const open = stage >= 2
  const rising = stage >= 3
  const ink = (ENVELOPES[deco.envelope] || ENVELOPES.ivory).ink
  return (
    <div className="relative" style={{ width: W, height: H, perspective: W * 3 }}>
      {/* layered shadow: wide ambient + tight contact */}
      <div className="absolute -inset-x-4 -bottom-6 top-10 rounded-[20px]" style={{ background: 'rgba(40,25,15,0.28)', filter: `blur(${W * 0.07}px)`, transform: 'translateY(10%)' }} />
      <div className="absolute inset-x-1 -bottom-1 top-2 rounded-[8px]" style={{ background: 'rgba(40,25,15,0.35)', filter: `blur(${W * 0.012}px)` }} />
      {/* paper stack edge (envelope thickness) */}
      <div className="absolute inset-0 rounded-[6px]" style={{ background: shade(col, -0.22), transform: `translate(${W * 0.004}px, ${W * 0.008}px)` }} />
      {/* inside / liner */}
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none" style={{ zIndex: 1 }}>
        <defs>
          <Liner id={`ln${uid}`} liner={deco.liner} c={col} />
          <Grain id={`gr${uid}`} />
        </defs>
        <rect width="100" height="64" rx="1.6" fill={shade(col, -0.18)} />
        <path d={FLAP_PATH[flap]} fill={`url(#ln${uid})`} />
        <rect width="100" height="64" rx="1.6" fill="#000" filter={`url(#gr${uid})`} />
      </svg>
      {/* warm light spilling from inside once it opens */}
      <motion.div
        className="pointer-events-none absolute"
        style={{ left: '-12%', right: '-12%', top: '-60%', height: '125%', zIndex: 2, background: 'radial-gradient(ellipse 50% 45% at 50% 60%, rgba(255,238,195,0.95), rgba(255,214,150,0.45) 45%, rgba(255,214,150,0) 70%)', mixBlendMode: 'screen' }}
        initial={false}
        animate={{ opacity: glow ? [0, 1, 0.75] : 0, scale: glow ? [0.7, 1.15, 1] : 0.7 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {/* the letter */}
      <motion.div
        className="absolute overflow-hidden rounded-[3px] bg-white"
        style={{ left: W * 0.07, width: W * 0.86, top: H * 0.05, height: H * 0.9, zIndex: 3, boxShadow: '0 4px 14px rgba(40,25,15,0.25)' }}
        initial={false}
        animate={rising ? { y: -H * 0.92 } : { y: 0 }}
        transition={{ duration: 1.15, ease: [0.3, 0.7, 0.2, 1] }}
      >
        {letterUrl && <img src={letterUrl} alt="" className="h-full w-full object-cover object-top" draggable={false} />}
      </motion.div>
      {/* front pockets */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 64" preserveAspectRatio="none" style={{ zIndex: 4 }}>
        <defs>
          <linearGradient id={`pl${uid}`} x1="0" x2="1">
            <stop offset="0" stopColor={shade(col, 0.06)} />
            <stop offset="1" stopColor={shade(col, -0.07)} />
          </linearGradient>
          <linearGradient id={`pr${uid}`} x1="1" x2="0">
            <stop offset="0" stopColor={shade(col, 0.02)} />
            <stop offset="1" stopColor={shade(col, -0.1)} />
          </linearGradient>
          <linearGradient id={`pb${uid}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor={shade(col, 0.1)} />
            <stop offset="1" stopColor={shade(col, -0.02)} />
          </linearGradient>
          <Grain id={`g2${uid}`} amount={0.13} />
          <Emboss id={`em${uid}`} seed={5} />
          <radialGradient id={`lt${uid}`} cx="0.22" cy="0.1" r="1.05">
            <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.16" />
          </radialGradient>
        </defs>
        <path d="M0 0 L50 35 L0 64 Z" fill={`url(#pl${uid})`} />
        <path d="M100 0 L50 35 L100 64 Z" fill={`url(#pr${uid})`} />
        <path d="M0 64 L50 31 L100 64 Z" fill={`url(#pb${uid})`} />
        <path d="M0 64 L50 31 L100 64" fill="none" stroke={shade(col, -0.25)} strokeOpacity="0.35" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
        <path d="M0 64 L50 35 L100 64 L100 0 L50 35 L0 0 Z" fill="#000" filter={`url(#g2${uid})`} />
        <path d="M0 64 L50 35 L100 64 L100 0 L50 35 L0 0 Z" fill="#fff" filter={`url(#em${uid})`} style={{ mixBlendMode: 'multiply' }} opacity="0.2" />
        <path d="M0.6 63.4 L50 31.8 L99.4 63.4" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        <path d="M0 0.4 L49.5 35 M100 0.4 L50.5 35" fill="none" stroke="#000" strokeOpacity="0.07" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        <rect x="0.3" y="0.3" width="99.4" height="63.4" rx="1.4" fill={`url(#lt${uid})`} stroke={shade(col, -0.25)} strokeOpacity="0.4" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
      </svg>
      {deco.note && (
        <div className="pointer-events-none absolute inset-x-0 flex justify-center text-center font-script leading-tight" style={{ bottom: H * 0.1, zIndex: 5, color: ink, fontSize: W * 0.052, paddingLeft: deco.closure === 'ribbon' || deco.closure === 'twine' ? '40%' : '14%', paddingRight: deco.closure === 'ribbon' || deco.closure === 'twine' ? '6%' : '14%' }}>
          {deco.note}
        </div>
      )}
      {/* flap: hinged at the top, liner on its inside */}
      <motion.div
        className="absolute left-0 right-0 top-0 origin-top"
        style={{ height: H * tip, zIndex: rising ? 2 : 5, transformStyle: 'preserve-3d', filter: `drop-shadow(0 ${W * 0.008}px ${W * 0.012}px rgba(40,25,15,0.3)) drop-shadow(0 1px 1px rgba(40,25,15,0.25))` }}
        initial={false}
        animate={{ rotateX: open ? 178 : 0 }}
        transition={{ duration: 0.7, ease: [0.5, 0, 0.25, 1] }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${FLAP_TIP[flap] + 3}`} preserveAspectRatio="none" style={{ backfaceVisibility: 'hidden', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`fl${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={shade(col, 0.07)} />
              <stop offset="1" stopColor={shade(col, -0.05)} />
            </linearGradient>
            <linearGradient id={`gd${uid}`} x1="0" y1="0" x2="1" y2="1">
              {GOLD.map((g, i) => (
                <stop key={i} offset={i / (GOLD.length - 1)} stopColor={g} />
              ))}
            </linearGradient>
            <Grain id={`g3${uid}`} amount={0.12} />
            <Emboss id={`e3${uid}`} seed={9} />
            <Foil id={`fo${uid}`} />
            <linearGradient id={`fh${uid}`} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={FLAP_PATH[flap]} fill={`url(#fl${uid})`} />
          <path d={FLAP_PATH[flap]} fill="#000" filter={`url(#g3${uid})`} />
          <path d={FLAP_PATH[flap]} fill="#fff" filter={`url(#e3${uid})`} style={{ mixBlendMode: 'multiply' }} opacity="0.2" />
          <path d={FLAP_PATH[flap]} fill={`url(#fh${uid})`} />
          <path d={FLAP_PATH[flap]} fill="none" stroke={flap === 'scallop' ? `url(#fo${uid})` : shade(col, -0.2)} strokeOpacity={flap === 'scallop' ? 1 : 0.45} strokeWidth={flap === 'scallop' ? 2 : 0.6} vectorEffect="non-scaling-stroke" />
        </svg>
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${FLAP_TIP[flap] + 3}`} preserveAspectRatio="none" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
          <defs>
            <Liner id={`l2${uid}`} liner={deco.liner} c={col} />
          </defs>
          <path d={FLAP_PATH[flap]} fill={`url(#l2${uid})`} />
        </svg>
      </motion.div>
      <EnvelopeStickers list={deco.stickers} w={W} />
      {deco.closure !== 'none' && <Closure w={W} h={H} deco={deco} sealSrc={sealSrc} released={stage >= 1} gone={stage >= 2} ay={tip} />}
      {children}
    </div>
  )
}

/* ---------------- envelope, address side ---------------- */
function Stamp({ size, img }) {
  const uid = useId().replace(/:/g, '')
  const holes = []
  const n = 9
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 100
    holes.push([t, 0], [t, 120], [0, t * 1.2], [100, t * 1.2])
  }
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" style={{ filter: 'drop-shadow(0 2px 3px rgba(40,25,15,.25))' }}>
      <defs>
        <mask id={`m${uid}`}>
          <rect width="100" height="120" fill="#fff" />
          {holes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4.2" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#m${uid})`}>
        <rect width="100" height="120" fill="#fbf7ef" />
        <rect x="11" y="11" width="78" height="98" fill="#e9dcc6" />
        {img && <image href={img} x="14" y="16" width="72" height="72" preserveAspectRatio="xMidYMid meet" />}
        <text x="50" y="104" textAnchor="middle" fontSize="11" fontFamily="'Playfair Display', serif" fontStyle="italic" fill="#7a5a44">
          love
        </text>
      </g>
    </svg>
  )
}

export function EnvelopeFront({ W, deco, sealSrc }) {
  const uid = useId().replace(/:/g, '')
  const H = W * 0.64
  const E = ENVELOPES[deco.envelope] || ENVELOPES.ivory
  const sprig = deco.sprig !== 'none' && STICKER_MAP[deco.sprig]
  return (
    <div className="relative" style={{ width: W, height: H }}>
      <div className="absolute -inset-x-2 -bottom-3 top-6 rounded-[14px]" style={{ background: 'rgba(40,25,15,0.35)', filter: `blur(${W * 0.04}px)`, transform: 'translateY(6%)' }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 64" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fb${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(E.body, 0.1)} />
            <stop offset="1" stopColor={shade(E.body, -0.06)} />
          </linearGradient>
          <Grain id={`fg${uid}`} amount={0.13} />
        </defs>
        <rect width="100" height="64" rx="1.6" fill={`url(#fb${uid})`} />
        <rect width="100" height="64" rx="1.6" fill="#000" filter={`url(#fg${uid})`} />
        {/* postmark waves */}
        <g fill="none" stroke={E.ink} strokeOpacity="0.32" strokeWidth="0.45" vectorEffect="non-scaling-stroke">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M56 ${8 + i * 2.6} q3 -1.4 6 0 t6 0 t6 0 t6 0`} />
          ))}
          <ellipse cx="66" cy="12" rx="7.5" ry="7.5" />
        </g>
      </svg>
      <div className="absolute" style={{ right: W * 0.05, top: H * 0.07 }}>
        <Stamp size={W * 0.15} img={sprig?.src || sealSrc} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: E.ink }}>
        <span className="font-sans uppercase tracking-[0.3em] opacity-60" style={{ fontSize: W * 0.026 }}>
          a letter for
        </span>
        <span className="font-script leading-none" style={{ fontSize: W * 0.11 }}>
          {deco.to || 'you'}
        </span>
        {deco.note && (
          <span className="mt-1 font-serif italic opacity-75" style={{ fontSize: W * 0.035 }}>
            {deco.note}
          </span>
        )}
      </div>
      <EnvelopeStickers list={deco.stickers} w={W} />
    </div>
  )
}
