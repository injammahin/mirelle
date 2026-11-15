// Hand-built SVG stickers. Every sticker is a standalone SVG string that renders
// both in the catalog (<img>) and on the export canvas (drawImage).
import { mulberry32 } from '../lib/random'

const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`

const f = (n) => Math.round(n * 10) / 10

/* ---------- Pressed lavender ---------- */
function lavender() {
  const rng = mulberry32(21)
  let buds = ''
  const sprig = (sx, sy, ex, ey, n, scale) => {
    let out = ''
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const x = sx + (ex - sx) * t
      const y = sy + (ey - sy) * t
      const side = i % 2 === 0 ? -1 : 1
      const rot = side * (20 + rng() * 18)
      const s = scale * (0.65 + 0.35 * (1 - t))
      const col = rng() > 0.5 ? 'url(#lv1)' : 'url(#lv2)'
      out += `<ellipse cx="${f(x + side * 4 * s)}" cy="${f(y)}" rx="${f(4.6 * s)}" ry="${f(8.4 * s)}" fill="${col}" transform="rotate(${f(rot)} ${f(x + side * 4 * s)} ${f(y)})"/>`
      out += `<ellipse cx="${f(x - side * 2 * s)}" cy="${f(y + 3)}" rx="${f(3.4 * s)}" ry="${f(6.2 * s)}" fill="#a993d6" opacity=".85" transform="rotate(${f(-rot * 0.6)} ${f(x - side * 2 * s)} ${f(y + 3)})"/>`
    }
    return out
  }
  buds += sprig(60, 150, 62, 18, 17, 1)
  buds += sprig(84, 176, 98, 92, 9, 0.75)
  const defs = `<linearGradient id="lv1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8a4e3"/><stop offset="1" stop-color="#7d67b8"/></linearGradient><linearGradient id="lv2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c86d1"/><stop offset="1" stop-color="#6a559f"/></linearGradient>`
  const body = `
  <path d="M60 330 C59 260 63 190 61 20" stroke="#7f8e68" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <path d="M61 250 C72 220 86 190 98 90" stroke="#889672" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M60 290 C40 270 28 250 22 222 C40 236 52 254 60 280Z" fill="#9aa883" opacity=".9"/>
  <path d="M61 300 C78 286 92 272 100 250 C84 258 70 272 61 292Z" fill="#8b9a74" opacity=".9"/>
  ${buds}`
  return svg(120, 334, body, defs)
}

/* ---------- Dried daisy ---------- */
function daisy() {
  let petals = ''
  const n = 22
  for (let i = 0; i < n; i++) {
    const a = (i * 360) / n
    const ry = 33 + ((i * 7) % 5) * 1.6
    petals += `<g transform="rotate(${f(a)} 100 92)"><ellipse cx="100" cy="${f(92 - ry - 10)}" rx="9.5" ry="${f(ry)}" fill="url(#dp)" stroke="#e1d2b5" stroke-width="1"/><path d="M100 ${f(92 - 14)} L100 ${f(92 - ry * 1.8)}" stroke="#e7dcc6" stroke-width="1"/></g>`
  }
  let dots = ''
  const rng = mulberry32(5)
  for (let i = 0; i < 46; i++) {
    const r = Math.sqrt(rng()) * 18
    const a = rng() * Math.PI * 2
    dots += `<circle cx="${f(100 + Math.cos(a) * r)}" cy="${f(92 + Math.sin(a) * r)}" r="${f(1.2 + rng() * 1.3)}" fill="${rng() > 0.5 ? '#9b5f1f' : '#f2c25e'}" opacity=".85"/>`
  }
  const defs = `<linearGradient id="dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe3c9"/></linearGradient><radialGradient id="dc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f6c75a"/><stop offset=".7" stop-color="#d9972f"/><stop offset="1" stop-color="#a86a1f"/></radialGradient>`
  const body = `
  <path d="M100 120 C104 180 96 230 104 298" stroke="#8e9a6c" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M102 230 C126 210 150 206 166 212 C148 226 126 234 102 238Z" fill="#9aa679"/>
  <path d="M101 258 C80 244 58 244 44 252 C62 262 82 266 101 264Z" fill="#8e9a6c"/>
  ${petals}
  <circle cx="100" cy="92" r="22" fill="url(#dc)"/>
  ${dots}`
  return svg(200, 300, body, defs)
}

/* ---------- Rose petal ---------- */
const rosePetal = () =>
  svg(
    160,
    150,
    `<path d="M80 142 C34 116 6 78 18 40 C30 8 66 8 80 34 C94 8 130 8 142 40 C154 78 126 116 80 142Z" fill="url(#rp)"/>
  <path d="M80 142 C34 116 6 78 18 40 C30 8 66 8 80 34 C94 8 130 8 142 40 C154 78 126 116 80 142Z" fill="none" stroke="#c46f7c" stroke-width="2" opacity=".35"/>
  <path d="M80 136 C78 104 76 70 80 38" stroke="#fbe0e2" stroke-width="2" fill="none" opacity=".8"/>
  <path d="M79 100 C64 86 48 74 34 66 M80 82 C96 70 112 60 126 56 M79 118 C66 110 54 104 44 100 M81 112 C96 104 110 96 120 88" stroke="#fbe0e2" stroke-width="1.4" fill="none" opacity=".7"/>
  <ellipse cx="58" cy="50" rx="16" ry="9" fill="#fff" opacity=".22" transform="rotate(-30 58 50)"/>`,
    `<radialGradient id="rp" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#f6cfd2"/><stop offset=".6" stop-color="#e49aa5"/><stop offset="1" stop-color="#c46f7c"/></radialGradient>`,
  )

/* ---------- Coquette bow ---------- */
const bow = () =>
  svg(
    220,
    210,
    `<path d="M104 84 C90 124 74 166 58 202 L80 196 L92 208 C100 168 108 128 113 92Z" fill="url(#bw)" stroke="#d9939d" stroke-width="2"/>
  <path d="M116 84 C130 124 146 166 162 202 L140 196 L128 208 C120 168 112 128 107 92Z" fill="url(#bw)" stroke="#d9939d" stroke-width="2"/>
  <path d="M108 78 C70 22 14 26 18 72 C22 116 76 104 108 86Z" fill="url(#bw)" stroke="#d9939d" stroke-width="2"/>
  <path d="M112 78 C150 22 206 26 202 72 C198 116 144 104 112 86Z" fill="url(#bw)" stroke="#d9939d" stroke-width="2"/>
  <path d="M96 76 C72 50 44 46 34 64" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
  <path d="M124 76 C148 50 176 46 186 64" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
  <path d="M100 72 C88 66 70 70 60 80" stroke="#c97d89" stroke-width="1.5" fill="none" opacity=".6"/>
  <path d="M120 72 C132 66 150 70 160 80" stroke="#c97d89" stroke-width="1.5" fill="none" opacity=".6"/>
  <rect x="96" y="66" width="28" height="30" rx="11" fill="#eeb2bb" stroke="#d9939d" stroke-width="2"/>
  <path d="M102 74 C108 70 114 70 118 74" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>`,
    `<linearGradient id="bw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe1e4"/><stop offset=".55" stop-color="#f3bec6"/><stop offset="1" stop-color="#e7a2ad"/></linearGradient>`,
  )

/* ---------- Butterfly ---------- */
const butterfly = () =>
  svg(
    220,
    180,
    `<g opacity=".97">
    <path d="M108 86 C90 30 40 6 16 22 C-2 36 18 82 56 94 C76 100 96 96 108 90Z" fill="url(#bf1)" stroke="#9c5a44" stroke-width="2"/>
    <path d="M112 86 C130 30 180 6 204 22 C222 36 202 82 164 94 C144 100 124 96 112 90Z" fill="url(#bf1)" stroke="#9c5a44" stroke-width="2"/>
    <path d="M106 96 C82 100 46 112 44 140 C42 164 78 168 96 144 C104 132 108 112 108 100Z" fill="url(#bf2)" stroke="#9c5a44" stroke-width="2"/>
    <path d="M114 96 C138 100 174 112 176 140 C178 164 142 168 124 144 C116 132 112 112 112 100Z" fill="url(#bf2)" stroke="#9c5a44" stroke-width="2"/>
    <path d="M104 84 C80 60 50 40 26 30 M104 88 C76 80 46 74 22 66 M106 100 C86 116 66 132 54 146 M114 84 C140 60 170 40 194 30 M116 88 C144 80 174 74 198 66 M114 100 C134 116 154 132 166 146" stroke="#9c5a44" stroke-width="1" opacity=".45" fill="none"/>
    <circle cx="48" cy="40" r="7" fill="#fdf4ea" opacity=".9"/><circle cx="172" cy="40" r="7" fill="#fdf4ea" opacity=".9"/>
    <circle cx="66" cy="66" r="4" fill="#fdf4ea" opacity=".8"/><circle cx="154" cy="66" r="4" fill="#fdf4ea" opacity=".8"/>
    <circle cx="72" cy="140" r="5" fill="#fdf4ea" opacity=".8"/><circle cx="148" cy="140" r="5" fill="#fdf4ea" opacity=".8"/>
    <ellipse cx="110" cy="96" rx="5" ry="30" fill="#4a332a"/>
    <circle cx="110" cy="64" r="6" fill="#4a332a"/>
    <path d="M108 60 C100 40 92 30 82 22 M112 60 C120 40 128 30 138 22" stroke="#4a332a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="82" cy="22" r="3" fill="#4a332a"/><circle cx="138" cy="22" r="3" fill="#4a332a"/>
  </g>`,
    `<linearGradient id="bf1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3c3a8"/><stop offset=".6" stop-color="#d98b6c"/><stop offset="1" stop-color="#b8664d"/></linearGradient><linearGradient id="bf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7a98d"/><stop offset="1" stop-color="#c87d65"/></linearGradient>`,
  )

/* ---------- Postage stamp ---------- */
function stamp() {
  let holes = ''
  const W = 180,
    H = 220,
    r = 6,
    step = 15
  for (let x = step / 2; x < W; x += step) holes += `<circle cx="${x}" cy="0" r="${r}"/><circle cx="${x}" cy="${H}" r="${r}"/>`
  for (let y = step / 2; y < H; y += step) holes += `<circle cx="0" cy="${y}" r="${r}"/><circle cx="${W}" cy="${y}" r="${r}"/>`
  const defs = `<mask id="sm"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${holes}</g></mask><linearGradient id="ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9b6"/><stop offset="1" stop-color="#e3a787"/></linearGradient>`
  const body = `<g mask="url(#sm)"><rect width="${W}" height="${H}" fill="#fbf6ec"/></g>
  <rect x="18" y="18" width="144" height="184" fill="url(#ss)"/>
  <circle cx="122" cy="70" r="20" fill="#fbe9c8" opacity=".9"/>
  <path d="M18 150 C50 120 76 126 96 140 C118 122 142 112 162 124 L162 202 L18 202Z" fill="#8fa38a"/>
  <path d="M18 172 C52 150 92 158 120 168 C138 160 152 158 162 162 L162 202 L18 202Z" fill="#6f8467"/>
  <path d="M58 150 C56 120 60 100 58 84" stroke="#4e5f49" stroke-width="2" fill="none"/>
  <circle cx="58" cy="80" r="9" fill="#c87d65"/><circle cx="58" cy="80" r="3.5" fill="#f6d27a"/>
  <rect x="18" y="18" width="144" height="184" fill="none" stroke="#2c2523" stroke-opacity=".35" stroke-width="1.5"/>
  <text x="30" y="44" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="#2c2523" opacity=".85">25¢</text>
  <text x="90" y="194" font-family="Georgia, 'Times New Roman', serif" font-size="11" letter-spacing="3" text-anchor="middle" fill="#fbf6ec">AURA POST</text>`
  return svg(W, H, body, defs)
}

/* ---------- Washi tape ---------- */
function washi(id, base, patternDef, patternFill) {
  const rng = mulberry32(id.length * 13)
  let left = ''
  let right = ''
  for (let y = 0; y <= 56; y += 7) {
    right += `L${f(234 - rng() * 6)} ${y} `
    left += `L${f(4 + rng() * 6)} ${56 - y} `
  }
  const path = `M8 0 L232 0 ${right}L8 56 ${left}Z`
  return svg(
    240,
    56,
    `<g opacity=".86"><path d="${path}" fill="${base}"/><path d="${path}" fill="${patternFill}"/>
    <path d="M10 6 L230 6" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></g>`,
    patternDef,
  )
}
const washiSage = () =>
  washi(
    'sage',
    '#c9d3c1',
    `<pattern id="wg" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="8" height="16" fill="#8fa38a" opacity=".35"/><rect width="16" height="8" fill="#8fa38a" opacity=".25"/></pattern>`,
    'url(#wg)',
  )
const washiTerra = () =>
  washi(
    'terra',
    '#ebc0ae',
    `<pattern id="wd" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.6" fill="#fff8f0" opacity=".9"/><circle cx="14" cy="14" r="2.6" fill="#c87d65" opacity=".7"/></pattern>`,
    'url(#wd)',
  )
const washiCream = () =>
  washi(
    'cream',
    '#f4ead7',
    `<pattern id="wf" width="28" height="28" patternUnits="userSpaceOnUse"><g transform="translate(9 9)"><circle r="3" cx="0" cy="-4" fill="#e9a8b2"/><circle r="3" cx="4" cy="0" fill="#e9a8b2"/><circle r="3" cx="0" cy="4" fill="#e9a8b2"/><circle r="3" cx="-4" cy="0" fill="#e9a8b2"/><circle r="2" fill="#f2c25e"/></g><path d="M20 22 q4 -6 8 -2" stroke="#8fa38a" stroke-width="1.6" fill="none"/></pattern>`,
    'url(#wf)',
  )

/* ---------- Coffee ring stain ---------- */
function coffeeRing() {
  const rng = mulberry32(77)
  let splats = ''
  for (let i = 0; i < 14; i++) {
    const a = rng() * Math.PI * 2
    const d = 92 + rng() * 26
    splats += `<circle cx="${f(110 + Math.cos(a) * d)}" cy="${f(110 + Math.sin(a) * d)}" r="${f(1 + rng() * 3.5)}" fill="#8a5a3b" opacity="${f(0.25 + rng() * 0.3)}"/>`
  }
  return svg(
    220,
    220,
    `<circle cx="110" cy="110" r="84" fill="none" stroke="#8a5a3b" stroke-width="9" opacity=".22"/>
  <circle cx="112" cy="108" r="86" fill="none" stroke="#7a4b2f" stroke-width="2.5" opacity=".35"/>
  <path d="M40 140 A78 78 0 0 1 150 38" fill="none" stroke="#6b3f26" stroke-width="3.5" opacity=".3" stroke-linecap="round"/>
  <circle cx="110" cy="110" r="78" fill="#a87a55" opacity=".05"/>
  ${splats}`,
  )
}

/* ---------- Sparkles ---------- */
const star = (x, y, r, fill) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}"/>`
const sparkles = () =>
  svg(
    200,
    200,
    `${star(84, 90, 62, 'url(#sg)')}${star(84, 90, 26, '#fff8e4')}${star(158, 44, 26, 'url(#sg)')}${star(150, 150, 18, 'url(#sg)')}
  <circle cx="40" cy="166" r="4" fill="#e0b25e"/><circle cx="176" cy="104" r="3" fill="#e0b25e"/><circle cx="30" cy="30" r="3" fill="#e0b25e"/>`,
    `<linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dc9a"/><stop offset=".55" stop-color="#e0b25e"/><stop offset="1" stop-color="#c58f3c"/></linearGradient>`,
  )

/* ---------- Pressed fern ---------- */
function fern() {
  let leaves = ''
  for (let i = 0; i < 13; i++) {
    const y = 40 + i * 19
    const s = 1 - i * 0.045
    const len = 40 * s + 8
    leaves += `<path d="M60 ${y} C${f(60 - len * 0.5)} ${f(y - 14)} ${f(60 - len)} ${f(y - 8)} ${f(60 - len - 4)} ${f(y - 2)} C${f(60 - len * 0.6)} ${f(y + 4)} ${f(60 - len * 0.3)} ${f(y + 4)} 60 ${f(y + 3)}Z" fill="${i % 2 ? '#8fa38a' : '#9eb198'}"/>`
    leaves += `<path d="M60 ${f(y + 8)} C${f(60 + len * 0.5)} ${f(y - 6)} ${f(60 + len)} ${f(y)} ${f(60 + len + 4)} ${f(y + 6)} C${f(60 + len * 0.6)} ${f(y + 12)} ${f(60 + len * 0.3)} ${f(y + 12)} 60 ${f(y + 11)}Z" fill="${i % 2 ? '#7f9479' : '#8fa38a'}"/>`
  }
  return svg(
    120,
    320,
    `<path d="M60 318 C62 240 58 140 60 22" stroke="#6c7f66" stroke-width="3" fill="none" stroke-linecap="round"/>${leaves}<path d="M60 24 C56 14 58 8 64 6 C64 14 62 18 60 24Z" fill="#9eb198"/>`,
  )
}

/* ---------- Eucalyptus sprig ---------- */
function eucalyptus() {
  let leaves = ''
  const pts = [
    [60, 40, 18],
    [42, 70, 22],
    [80, 92, 23],
    [38, 122, 25],
    [84, 150, 26],
    [36, 182, 26],
    [82, 212, 27],
    [40, 244, 25],
  ]
  pts.forEach(([x, y, r], i) => {
    leaves += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * 0.86)}" fill="${i % 2 ? '#a9b8a6' : '#97a996'}" stroke="#7d8f7b" stroke-width="1.2"/><path d="M${x} ${y - r * 0.7} L${x} ${y + r * 0.7}" stroke="#d9e2d6" stroke-width="1.2" opacity=".7"/>`
  })
  return svg(120, 300, `<path d="M60 296 C64 220 56 140 60 30" stroke="#7a6a5a" stroke-width="3" fill="none" stroke-linecap="round"/>${leaves}`)
}

/* ---------- Crescent moon ---------- */
const moon = () =>
  svg(
    170,
    170,
    `<path d="M108 18 A68 68 0 1 0 152 116 A56 56 0 1 1 108 18Z" fill="url(#mg)" stroke="#b88a3c" stroke-width="2"/>
  <circle cx="64" cy="74" r="7" fill="#c99a48" opacity=".35"/><circle cx="82" cy="118" r="5" fill="#c99a48" opacity=".35"/><circle cx="52" cy="110" r="4" fill="#c99a48" opacity=".3"/>
  ${star(140, 50, 12, '#e0b25e')}${star(124, 84, 7, '#e0b25e')}`,
    `<linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e2a8"/><stop offset="1" stop-color="#d9aa55"/></linearGradient>`,
  )

/* ---------- Ticket stub ---------- */
const ticket = () =>
  svg(
    250,
    112,
    `<path d="M8 4 H242 V40 A16 16 0 0 0 242 72 V108 H8 V72 A16 16 0 0 0 8 40Z" fill="#f2e3c4" stroke="#c9a978" stroke-width="2"/>
  <path d="M180 10 V102" stroke="#b08f5e" stroke-width="2" stroke-dasharray="5 5"/>
  <text x="96" y="52" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="700" letter-spacing="3" fill="#8a3f2e">ADMIT ONE</text>
  <text x="96" y="78" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" letter-spacing="2" fill="#5e4636">ROW C · SEAT 14</text>
  <text x="212" y="64" text-anchor="middle" font-family="'Courier New', monospace" font-size="16" fill="#8a3f2e" transform="rotate(-90 212 60)">Nº 0814</text>`,
  )

/* ---------- Heart ---------- */
const heart = () =>
  svg(
    160,
    150,
    `<path d="M80 140 C30 104 8 74 12 46 C16 18 50 6 80 36 C110 6 144 18 148 46 C152 74 130 104 80 140Z" fill="url(#hg)" stroke="#b5646f" stroke-width="2"/>
  <path d="M40 40 C48 30 60 30 66 36" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
  <circle cx="38" cy="54" r="3" fill="#fff" opacity=".7"/>`,
    `<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b2bb"/><stop offset="1" stop-color="#d47d89"/></linearGradient>`,
  )

/* ---------- Dried rose head ---------- */
const driedRose = () =>
  svg(
    180,
    260,
    `<path d="M90 120 C94 170 86 210 92 256" stroke="#7d7356" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M92 190 C116 176 138 178 152 188 C134 198 112 200 92 198Z" fill="#8d8a66"/>
  <path d="M90 214 C66 202 46 204 34 212 C52 222 72 224 90 220Z" fill="#7f7c5b"/>
  <path d="M90 128 C56 128 38 104 42 76 C46 52 66 40 90 44 C114 40 134 52 138 76 C142 104 124 128 90 128Z" fill="#a9505c"/>
  <path d="M90 118 C66 118 54 100 58 80 C62 64 76 58 90 60 C104 58 118 64 122 80 C126 100 114 118 90 118Z" fill="#c26a74"/>
  <path d="M90 104 C76 104 70 92 72 82 C76 72 86 70 92 74 C100 70 110 74 110 84 C110 96 102 104 90 104Z" fill="#a9505c"/>
  <path d="M84 86 C86 80 96 78 98 86 C98 92 90 94 86 90" stroke="#7d3440" stroke-width="2.4" fill="none"/>
  <path d="M60 92 C66 74 80 66 90 66 M120 92 C114 74 100 66 90 66" stroke="#8e3d48" stroke-width="2" fill="none" opacity=".6"/>
  <path d="M74 128 L66 146 L84 136 Z M106 128 L114 146 L96 136Z" fill="#7d7356"/>`,
  )

const defs = [
  { id: 'lavender', name: 'Pressed Lavender', kind: 'botanical', make: lavender, defaultW: 0.15, tags: ['botanical'] },
  { id: 'daisy', name: 'Dried Daisy', kind: 'botanical', make: daisy, defaultW: 0.24, tags: ['botanical'] },
  { id: 'driedRose', name: 'Dried Rose', kind: 'botanical', make: driedRose, defaultW: 0.22, tags: ['botanical', 'coquette'] },
  { id: 'rosePetal', name: 'Rose Petal', kind: 'charm', make: rosePetal, defaultW: 0.16, tags: ['botanical', 'coquette'] },
  { id: 'fern', name: 'Pressed Fern', kind: 'botanical', make: fern, defaultW: 0.14, tags: ['botanical'] },
  { id: 'eucalyptus', name: 'Eucalyptus', kind: 'botanical', make: eucalyptus, defaultW: 0.15, tags: ['botanical'] },
  { id: 'bow', name: 'Ribbon Bow', kind: 'charm', make: bow, defaultW: 0.24, tags: ['coquette'] },
  { id: 'heart', name: 'Candy Heart', kind: 'charm', make: heart, defaultW: 0.14, tags: ['coquette'] },
  { id: 'butterfly', name: 'Butterfly', kind: 'charm', make: butterfly, defaultW: 0.22, tags: ['coquette', 'botanical'] },
  { id: 'sparkles', name: 'Sparkle Stars', kind: 'sparkle', make: sparkles, defaultW: 0.15, tags: ['coquette', 'vintage'], shadow: false },
  { id: 'moon', name: 'Celestial Moon', kind: 'charm', make: moon, defaultW: 0.16, tags: ['vintage'] },
  { id: 'stamp', name: 'Postage Stamp', kind: 'charm', make: stamp, defaultW: 0.18, tags: ['vintage'] },
  { id: 'ticket', name: 'Ticket Stub', kind: 'charm', make: ticket, defaultW: 0.28, tags: ['vintage'] },
  { id: 'coffeeRing', name: 'Coffee Ring', kind: 'stain', make: coffeeRing, defaultW: 0.36, tags: ['vintage'], shadow: false },
  { id: 'washiSage', name: 'Sage Gingham Washi', kind: 'tape', make: washiSage, defaultW: 0.34, tags: ['tape'], shadow: false },
  { id: 'washiTerra', name: 'Terracotta Dot Washi', kind: 'tape', make: washiTerra, defaultW: 0.34, tags: ['tape'], shadow: false },
  { id: 'washiCream', name: 'Floral Cream Washi', kind: 'tape', make: washiCream, defaultW: 0.34, tags: ['tape'], shadow: false },
]

export const STICKERS = defs.map(({ make, ...d }) => {
  const s = make()
  const m = s.match(/width="(\d+)" height="(\d+)"/)
  return { ...d, svg: s, w: +m[1], h: +m[2] }
})
export const STICKER_MAP = Object.fromEntries(STICKERS.map((s) => [s.id, s]))

export const STICKER_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'botanical', name: 'Botanical' },
  { id: 'coquette', name: 'Coquette' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'tape', name: 'Washi' },
]
