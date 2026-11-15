// Six painted sample scenes (SVG) so users can try every tool without uploading.
// They're generated in code — no network, no CORS, crisp at any export size.
import { mulberry32 } from '../lib/random'
import { svgToDataUrl } from '../lib/assets'

const W = 800
const H = 1000
const wrap = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W * 2}" height="${H * 2}" viewBox="0 0 ${W} ${H}"><defs>${defs}<filter id="b8"><feGaussianBlur stdDeviation="8"/></filter><filter id="b20"><feGaussianBlur stdDeviation="20"/></filter><filter id="b40"><feGaussianBlur stdDeviation="40"/></filter><filter id="b3"><feGaussianBlur stdDeviation="3"/></filter></defs>${body}</svg>`

/* 1 — Coffee table flat-lay with window shadows */
function coffee() {
  const defs = `<linearGradient id="cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe4d3"/><stop offset="1" stop-color="#dccbb3"/></linearGradient>
  <radialGradient id="cc" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c79a6f"/><stop offset=".55" stop-color="#9a6a43"/><stop offset=".85" stop-color="#6b4429"/><stop offset="1" stop-color="#4d2f1c"/></radialGradient>
  <radialGradient id="cs" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e2d6"/></radialGradient>
  <linearGradient id="cr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7b06a"/><stop offset=".6" stop-color="#c47f3b"/><stop offset="1" stop-color="#97571f"/></linearGradient>`
  const body = `
  <rect width="800" height="1000" fill="url(#cl)"/>
  <path d="M-50 120 C200 160 420 100 860 180 L860 260 C420 180 200 240 -50 210Z" fill="#fff" opacity=".35" filter="url(#b20)"/>
  <path d="M-50 640 C220 600 520 700 860 620 L860 700 C520 780 220 680 -50 720Z" fill="#b8a385" opacity=".35" filter="url(#b20)"/>
  <g transform="translate(520 120) rotate(8)">
    <rect x="-180" y="-60" width="300" height="400" rx="6" fill="#f8f2e6" filter="url(#b3)" opacity=".5" transform="translate(10 14)"/>
    <rect x="-180" y="-60" width="300" height="400" rx="6" fill="#fbf7ef"/>
    <rect x="-180" y="-60" width="150" height="400" fill="#f3ecdf"/>
    ${Array.from({ length: 13 }, (_, i) => `<rect x="-160" y="${-20 + i * 26}" width="${110 - (i % 3) * 18}" height="5" rx="2" fill="#cdbfa8"/><rect x="-12" y="${-20 + i * 26}" width="${118 - (i % 4) * 14}" height="5" rx="2" fill="#d6cab6"/>`).join('')}
  </g>
  <ellipse cx="300" cy="560" rx="214" ry="206" fill="#7a6248" opacity=".22" filter="url(#b20)" transform="translate(26 30)"/>
  <circle cx="300" cy="560" r="210" fill="url(#cs)"/>
  <circle cx="300" cy="560" r="150" fill="#efe9de"/>
  <circle cx="300" cy="560" r="138" fill="#fff"/>
  <path d="M432 520 C500 500 520 600 438 610" stroke="#fff" stroke-width="26" fill="none" stroke-linecap="round"/>
  <circle cx="300" cy="560" r="118" fill="url(#cc)"/>
  <path d="M300 640 C230 590 236 520 272 516 C290 514 300 530 300 546 C300 530 310 514 328 516 C364 520 370 590 300 640Z" fill="#f4e6d2" opacity=".95"/>
  <path d="M300 620 C258 588 260 548 280 546 C292 545 300 556 300 566 C300 556 308 545 320 546 C340 548 342 588 300 620Z" fill="#b98b5f" opacity=".55"/>
  <g transform="translate(560 760) rotate(-24)">
    <ellipse cx="0" cy="20" rx="160" ry="60" fill="#7a5a36" opacity=".25" filter="url(#b20)"/>
    <path d="M-150 10 C-120 -60 120 -60 150 10 C110 -10 -110 -10 -150 10Z" fill="url(#cr)"/>
    <path d="M-120 14 C-90 -50 90 -50 120 14 C80 -6 -80 -6 -120 14Z" fill="#d89a52" opacity=".9"/>
    <path d="M-60 -30 C-40 0 -40 20 -50 40 M0 -42 C10 -10 10 20 0 46 M60 -30 C40 0 40 20 50 40" stroke="#8a4f1c" stroke-width="5" fill="none" opacity=".55"/>
    <path d="M-150 10 C-140 50 -60 60 0 58 C60 60 140 50 150 10 C110 -10 -110 -10 -150 10Z" fill="#b8722f"/>
  </g>
  <circle cx="130" cy="860" r="9" fill="#5c3a22" opacity=".7"/><circle cx="160" cy="885" r="6" fill="#5c3a22" opacity=".6"/><circle cx="104" cy="900" r="5" fill="#5c3a22" opacity=".6"/>
  <g opacity=".22" filter="url(#b8)">
    ${Array.from({ length: 4 }, (_, i) => `<path d="M${-200 + i * 260} -40 L${-20 + i * 260} -40 L${520 + i * 260} 1060 L${340 + i * 260} 1060Z" fill="#5a4630"/>`).join('')}
  </g>`
  return wrap(defs, body)
}

/* 2 — Golden hour portrait silhouette */
function golden() {
  const rng = mulberry32(8)
  let grass = ''
  for (let i = 0; i < 90; i++) {
    const x = rng() * 820 - 10
    const h = 60 + rng() * 140
    grass += `<path d="M${x} 1000 Q${x + (rng() - 0.5) * 30} ${1000 - h / 2} ${x + (rng() - 0.5) * 40} ${1000 - h}" stroke="${rng() > 0.5 ? '#6b4a2a' : '#8a6234'}" stroke-width="${2 + rng() * 3}" fill="none" opacity=".85"/>`
  }
  const defs = `<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3b58a"/><stop offset=".45" stop-color="#f6c98e"/><stop offset=".75" stop-color="#f0a46c"/><stop offset="1" stop-color="#b9683f"/></linearGradient>
  <radialGradient id="gsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe8"/><stop offset=".3" stop-color="#ffe7a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffc77a" stop-opacity="0"/></radialGradient>
  <linearGradient id="gp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b2418"/><stop offset=".7" stop-color="#5a3624"/><stop offset="1" stop-color="#e8955c"/></linearGradient>`
  const body = `
  <rect width="800" height="1000" fill="url(#gs)"/>
  <circle cx="610" cy="430" r="300" fill="url(#gsun)"/>
  <path d="M0 640 C140 600 300 620 420 600 C560 580 680 610 800 590 L800 1000 L0 1000Z" fill="#c07a48" opacity=".55" filter="url(#b20)"/>
  <path d="M0 720 C200 690 420 720 800 690 L800 1000 L0 1000Z" fill="#9b5d34" opacity=".75" filter="url(#b8)"/>
  <g>
    <path d="M200 1000 C200 860 230 770 300 740 C330 728 350 720 360 700 C352 684 346 662 346 640 C340 640 334 626 338 612 L344 600 C340 520 380 452 452 446 C540 440 590 504 584 590 C582 640 566 690 540 720 C548 744 566 752 600 770 C660 800 700 880 712 1000Z" fill="url(#gp)"/>
    <path d="M452 446 C380 452 340 520 344 600 C330 620 300 700 312 760 C330 720 352 690 364 660 C360 600 380 520 450 470Z" fill="#2c1a12"/>
    <path d="M452 446 C540 440 596 510 590 600 C600 680 640 760 650 800 C610 760 580 700 574 640 C590 560 560 480 452 446Z" fill="#3a2418"/>
    <path d="M584 590 C590 640 586 690 560 730" stroke="#ffd59a" stroke-width="5" fill="none" opacity=".75" filter="url(#b3)"/>
    <path d="M600 770 C660 800 700 880 712 1000" stroke="#ffcf8a" stroke-width="7" fill="none" opacity=".6" filter="url(#b3)"/>
  </g>
  ${grass}
  <circle cx="460" cy="260" r="40" fill="#fff4d6" opacity=".25"/><circle cx="380" cy="180" r="18" fill="#fff4d6" opacity=".3"/><circle cx="300" cy="110" r="64" fill="#ffd9a6" opacity=".14"/>
  <rect width="800" height="1000" fill="#ff9a50" opacity=".08"/>`
  return wrap(defs, body)
}

/* 3 — Botanical flat-lay */
function botanical() {
  const rng = mulberry32(31)
  const leaf = (x, y, s, r, c) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C40 -60 120 -70 180 0 C120 70 40 60 0 0Z" fill="${c}"/><path d="M4 0 L176 0" stroke="#e8efe2" stroke-width="2.5" opacity=".6"/>${[30, 60, 90, 120, 150].map((p) => `<path d="M${p} 0 L${p + 22} -22 M${p} 0 L${p + 22} 22" stroke="#e8efe2" stroke-width="1.6" opacity=".45"/>`).join('')}</g>`
  let leaves = ''
  const palette = ['#7f9479', '#93a68d', '#6c8066', '#a5b59f', '#5f7359']
  const spots = [
    [80, 120, -20],
    [600, 90, 200],
    [700, 420, 160],
    [60, 520, 20],
    [120, 880, -40],
    [640, 860, 210],
    [420, 940, 250],
    [300, 60, 100],
  ]
  spots.forEach(([x, y, r]) => (leaves += leaf(x, y, 0.9 + rng() * 0.6, r, palette[Math.floor(rng() * palette.length)])))
  let flowers = ''
  const fl = (x, y, c, n = 6) => {
    let p = ''
    for (let i = 0; i < n; i++) p += `<ellipse cx="${x}" cy="${y - 22}" rx="12" ry="22" fill="${c}" transform="rotate(${(i * 360) / n} ${x} ${y})"/>`
    return p + `<circle cx="${x}" cy="${y}" r="10" fill="#e9b949"/>`
  }
  flowers += fl(520, 260, '#f6efe3') + fl(250, 720, '#eebdc2') + fl(560, 640, '#f6efe3', 8) + fl(180, 330, '#d9c7e8')
  const defs = `<linearGradient id="bb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4e8dc"/><stop offset="1" stop-color="#cfd6c5"/></linearGradient>`
  const body = `
  <rect width="800" height="1000" fill="url(#bb)"/>
  <g filter="url(#b8)" opacity=".3">${leaves}</g>
  <g transform="translate(8 14)" opacity=".18" filter="url(#b8)">${leaves}</g>
  ${leaves}
  <g transform="translate(400 500) rotate(-6)">
    <rect x="-150" y="-190" width="300" height="380" fill="#6f5a49" opacity=".18" filter="url(#b20)" transform="translate(12 18)"/>
    <rect x="-150" y="-190" width="300" height="380" fill="#f8f3ea"/>
    <text x="0" y="-110" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="34" fill="#4f5f4b">herbarium</text>
    <path d="M-100 -80 L100 -80" stroke="#8fa38a" stroke-width="1.5"/>
    <path d="M0 150 C-6 80 6 0 0 -50" stroke="#7a8b6f" stroke-width="3" fill="none"/>
    ${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${i % 2 ? 22 : -22}" cy="${120 - i * 40}" rx="26" ry="10" fill="#93a68d" transform="rotate(${i % 2 ? -30 : 30} ${i % 2 ? 22 : -22} ${120 - i * 40})"/>`).join('')}
    <circle cx="0" cy="-56" r="14" fill="#c87d65"/>
  </g>
  ${flowers}
  <path d="M40 980 C200 900 300 960 420 880 C520 820 640 860 780 800" stroke="#b7a07c" stroke-width="4" fill="none"/>
  <path d="M40 990 C200 910 300 970 420 890 C520 830 640 870 780 810" stroke="#9c8562" stroke-width="2" fill="none" opacity=".6"/>`
  return wrap(defs, body)
}

/* 4 — Parisian street */
function paris() {
  const windows = (x0, y0, cols, rows, w, h, gx, gy) => {
    let s = ''
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * gx
        const y = y0 + r * gy
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5d6a73"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pw)"/><path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * 0.4} H${x + w}" stroke="#efe6d6" stroke-width="2"/><rect x="${x - 6}" y="${y + h - 4}" width="${w + 12}" height="10" fill="#2f2a2a"/>${[0, 1, 2, 3, 4].map((k) => `<path d="M${x - 4 + k * ((w + 8) / 4)} ${y + h - 4} V${y + h + 8}" stroke="#2f2a2a" stroke-width="2"/>`).join('')}`
      }
    return s
  }
  const defs = `<linearGradient id="psky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfdde4"/><stop offset="1" stop-color="#f3e6d6"/></linearGradient>
  <linearGradient id="pw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".4"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  <linearGradient id="pst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9ab98"/><stop offset="1" stop-color="#8e7f6c"/></linearGradient>
  <pattern id="paw" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#c87d65"/><rect x="20" width="20" height="10" fill="#f6efe3"/></pattern>`
  const body = `
  <rect width="800" height="1000" fill="url(#psky)"/>
  <path d="M0 0 H300 L360 640 L0 1000Z" fill="#eadfcd"/>
  <path d="M800 0 H520 L460 640 L800 1000Z" fill="#e3d4bd"/>
  <g transform="matrix(1 .08 0 1 0 0)">${windows(30, 60, 2, 4, 70, 110, 130, 170)}</g>
  <g transform="matrix(1 -.08 0 1 0 0)">${windows(570, 120, 2, 4, 70, 110, 120, 170)}</g>
  <path d="M300 0 L360 640 L460 640 L520 0Z" fill="#dfe7ea" opacity=".7"/>
  <path d="M370 640 C370 540 400 470 410 380 C420 470 450 540 452 640Z" fill="#9aa6ac" opacity=".55"/>
  <path d="M0 1000 L360 640 L460 640 L800 1000Z" fill="url(#pst)"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M${-100 + i * 90} 1000 L${380 + i * 6} 640" stroke="#7d6f5d" stroke-width="1.5" opacity=".35"/>`).join('')}
  ${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${660 + i * i * 4} H800" stroke="#7d6f5d" stroke-width="1.2" opacity=".25"/>`).join('')}
  <path d="M0 720 L210 700 L210 760 L0 800Z" fill="url(#paw)"/>
  <path d="M0 800 L210 760 L210 772 L0 816Z" fill="#a85f48"/>
  <g fill="#3a3330">
    <circle cx="90" cy="880" r="34" fill="#f2ebe0" stroke="#3a3330" stroke-width="4"/><rect x="86" y="880" width="8" height="90"/>
    <path d="M150 840 v120 M190 840 v120 M150 860 h40" stroke="#3a3330" stroke-width="5"/>
  </g>
  <g>
    <rect x="636" y="420" width="10" height="460" fill="#2f2a2a"/>
    <path d="M620 420 L662 420 L654 380 L628 380Z" fill="#2f2a2a"/><rect x="626" y="352" width="30" height="30" fill="#fde7b0" opacity=".9"/>
    <path d="M620 352 L662 352 L641 330Z" fill="#2f2a2a"/>
  </g>
  <circle cx="641" cy="367" r="60" fill="#ffe7a8" opacity=".25" filter="url(#b20)"/>
  <rect width="800" height="1000" fill="#f3d3b1" opacity=".12"/>`
  return wrap(defs, body)
}

/* 5 — Mirror selfie */
function mirror() {
  const defs = `<linearGradient id="mw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efe6d8"/><stop offset="1" stop-color="#e3d6c3"/></linearGradient>
  <linearGradient id="mm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e2dc"/><stop offset="1" stop-color="#c9c0b4"/></linearGradient>
  <linearGradient id="mf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7b98f"/><stop offset="1" stop-color="#b48f63"/></linearGradient>
  <linearGradient id="mb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4efe6"/><stop offset="1" stop-color="#ddd3c4"/></linearGradient>`
  const body = `
  <rect width="800" height="1000" fill="url(#mw)"/>
  <rect y="860" width="800" height="140" fill="url(#mf)"/>
  ${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${875 + i * 18} H800" stroke="#9c7a52" stroke-width="1" opacity=".3"/>`).join('')}
  <path d="M-40 -20 L320 -20 L180 1020 L-160 1020Z" fill="#fff" opacity=".28" filter="url(#b20)"/>
  <rect x="190" y="70" width="420" height="820" rx="210" fill="#b89a6a"/>
  <rect x="206" y="86" width="388" height="788" rx="194" fill="url(#mm)"/>
  <g>
    <rect x="206" y="560" width="388" height="314" fill="#cdbba3" opacity=".7"/>
    <rect x="460" y="420" width="90" height="190" rx="6" fill="#efe8dc" opacity=".8"/>
    <path d="M500 420 C470 360 520 320 560 340 C540 370 530 400 520 420Z" fill="#8fa38a" opacity=".7"/>
    <path d="M400 330 C360 330 340 360 342 400 C344 436 360 456 372 466 L360 520 C300 540 270 600 262 700 L262 874 L540 874 L540 700 C532 600 500 540 440 520 L428 466 C444 452 458 430 458 400 C460 360 440 330 400 330Z" fill="#f2ede5"/>
    <path d="M400 320 C350 316 326 360 330 410 C334 470 330 520 318 560 C348 540 360 500 362 460 C356 420 360 380 400 350 C440 380 444 420 438 460 C440 500 452 540 482 560 C470 520 466 470 470 410 C474 360 450 316 400 320Z" fill="#5a4030"/>
    <rect x="420" y="470" width="66" height="118" rx="12" fill="#2b2726"/>
    <circle cx="438" cy="490" r="7" fill="#57514d"/><circle cx="458" cy="490" r="5" fill="#57514d"/>
    <path d="M440 590 C452 610 470 612 486 600" stroke="#e7cbb3" stroke-width="16" stroke-linecap="round" fill="none"/>
    <rect x="262" y="660" width="278" height="214" fill="#d8cdbd" opacity=".55"/>
  </g>
  <path d="M260 120 C300 100 330 100 360 120 L240 700 C232 600 236 300 260 120Z" fill="#fff" opacity=".22"/>
  <g transform="translate(650 640)">
    <path d="M-50 220 L50 220 L40 120 L-40 120Z" fill="#c9a07a"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M0 120 C${-90 + i * 22} ${60 - (i % 3) * 30} ${-110 + i * 26} ${-20 - (i % 2) * 40} ${-80 + i * 20} ${-80 - (i % 3) * 20}" stroke="#6f8467" stroke-width="4" fill="none"/><ellipse cx="${-80 + i * 20}" cy="${-80 - (i % 3) * 20}" rx="22" ry="11" fill="${i % 2 ? '#8fa38a' : '#73876e'}" transform="rotate(${-60 + i * 15} ${-80 + i * 20} ${-80 - (i % 3) * 20})"/>`).join('')}
  </g>
  <rect x="40" y="740" width="150" height="120" rx="10" fill="url(#mb)"/>
  <rect x="58" y="700" width="40" height="40" rx="4" fill="#f6efe3"/><path d="M78 700 v-16" stroke="#3a3330" stroke-width="2"/><ellipse cx="78" cy="682" rx="4" ry="8" fill="#ffcf75"/>
  <circle cx="78" cy="680" r="40" fill="#ffd98a" opacity=".22" filter="url(#b20)"/>`
  return wrap(defs, body)
}

/* 6 — Book aesthetic on a knit blanket */
function book() {
  let knit = ''
  for (let y = 0; y < 1000; y += 34)
    for (let x = (y / 34) % 2 ? 0 : 17; x < 820; x += 34) knit += `<path d="M${x} ${y} q8 18 0 34 M${x + 10} ${y} q-8 18 0 34" stroke="#d9cdb9" stroke-width="5" fill="none" stroke-linecap="round"/>`
  let lines = ''
  for (let i = 0; i < 18; i++) {
    lines += `<rect x="-300" y="${-250 + i * 26}" width="${240 - (i % 4) * 22}" height="5" rx="2" fill="#bfae94"/>`
    lines += `<rect x="40" y="${-250 + i * 26}" width="${250 - (i % 5) * 18}" height="5" rx="2" fill="#bfae94"/>`
  }
  const defs = `<linearGradient id="kb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece3d4"/><stop offset="1" stop-color="#ddd0bb"/></linearGradient>
  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3ead9"/><stop offset=".47" stop-color="#fbf6ec"/><stop offset=".5" stop-color="#d8cbb4"/><stop offset=".53" stop-color="#fbf6ec"/><stop offset="1" stop-color="#efe5d2"/></linearGradient>
  <radialGradient id="cf" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c8"/><stop offset="1" stop-color="#ffcf75" stop-opacity="0"/></radialGradient>`
  const body = `
  <rect width="800" height="1000" fill="url(#kb)"/>
  <g opacity=".7">${knit}</g>
  <g transform="translate(400 520) rotate(-8)">
    <path d="M-340 -300 L0 -280 L340 -300 L350 300 L0 320 L-350 300Z" fill="#6b4a3a" opacity=".25" filter="url(#b20)" transform="translate(16 22)"/>
    <path d="M-345 -296 L0 -276 L345 -296 L352 296 L0 316 L-352 296Z" fill="#8a5a44"/>
    <path d="M-330 -290 C-200 -300 -60 -290 0 -270 C60 -290 200 -300 330 -290 L336 286 C200 276 60 286 0 306 C-60 286 -200 276 -336 286Z" fill="url(#pg)"/>
    ${lines}
    <g transform="translate(150 120) rotate(20)">
      <path d="M0 80 C-2 40 2 0 0 -60" stroke="#8a845e" stroke-width="3" fill="none"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${i % 2 ? 6 : -6}" cy="${-60 + i * 10}" rx="5" ry="9" fill="#a58fcf" transform="rotate(${i % 2 ? 25 : -25} ${i % 2 ? 6 : -6} ${-60 + i * 10})"/>`).join('')}
    </g>
  </g>
  <g transform="translate(130 150)">
    <circle r="120" fill="url(#cf)" opacity=".7"/>
    <rect x="-46" y="-30" width="92" height="110" rx="10" fill="#f6efe3"/>
    <rect x="-46" y="-30" width="92" height="22" rx="10" fill="#e9dccb"/>
    <path d="M0 -30 v-18" stroke="#3a3330" stroke-width="3"/><ellipse cx="0" cy="-58" rx="8" ry="16" fill="#ffcf75"/><ellipse cx="0" cy="-54" rx="3.5" ry="8" fill="#fff6dc"/>
  </g>
  <g transform="translate(660 870)">
    <circle r="96" fill="#7a6248" opacity=".25" filter="url(#b8)" transform="translate(8 12)"/>
    <circle r="92" fill="#f4ede2"/><circle r="72" fill="#5b3a27"/><circle r="72" fill="#b07b52" opacity=".35"/>
    <path d="M90 -10 C130 -10 130 40 88 36" stroke="#f4ede2" stroke-width="18" fill="none" stroke-linecap="round"/>
  </g>`
  return wrap(defs, body)
}

const list = [
  { id: 'coffee', name: 'Coffee Table', make: coffee },
  { id: 'golden', name: 'Golden Hour Portrait', make: golden },
  { id: 'botanical', name: 'Botanical Flat-lay', make: botanical },
  { id: 'paris', name: 'Parisian Street', make: paris },
  { id: 'mirror', name: 'Mirror Selfie', make: mirror },
  { id: 'book', name: 'Book Aesthetic', make: book },
]

export const SAMPLES = list.map(({ make, ...s }) => ({ ...s, src: svgToDataUrl(make()) }))
export const SAMPLE_MAP = Object.fromEntries(SAMPLES.map((s) => [s.id, s]))
