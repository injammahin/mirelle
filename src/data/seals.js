// Procedural wax seals + metal paperclip + wooden clothespin SVGs.
import { mulberry32 } from '../lib/random'
import { SEAL_COLORS } from './letter'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function blobPath(cx, cy, r, seed, points = 26, wobble = 0.09) {
  const rng = mulberry32(seed)
  const pts = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const rr = r * (1 - wobble / 2 + rng() * wobble) + (i % 7 === 0 ? r * 0.06 : 0)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  let d = ''
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i]
    const p1 = pts[(i + 1) % pts.length]
    const mx = (p0[0] + p1[0]) / 2
    const my = (p0[1] + p1[1]) / 2
    d += i === 0 ? `M${mx.toFixed(1)} ${my.toFixed(1)} ` : ''
    const n = pts[(i + 1) % pts.length]
    const nn = pts[(i + 2) % pts.length]
    d += `Q${n[0].toFixed(1)} ${n[1].toFixed(1)} ${((n[0] + nn[0]) / 2).toFixed(1)} ${((n[1] + nn[1]) / 2).toFixed(1)} `
  }
  return d + 'Z'
}

function emblem(style, monogram, c) {
  switch (style) {
    case 'monogram':
      return `<text x="100" y="104" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="700" font-size="68" fill="${c}">${esc((monogram || 'A').slice(0, 2))}</text>
      <path d="M58 140 C70 154 88 160 100 160 C112 160 130 154 142 140" stroke="${c}" stroke-width="3" fill="none"/>
      ${[0, 1, 2, 3].map((i) => `<ellipse cx="${64 + i * 6}" cy="${136 + i * 5}" rx="6" ry="3" fill="${c}" transform="rotate(${30 + i * 8} ${64 + i * 6} ${136 + i * 5})"/><ellipse cx="${136 - i * 6}" cy="${136 + i * 5}" rx="6" ry="3" fill="${c}" transform="rotate(${-30 - i * 8} ${136 - i * 6} ${136 + i * 5})"/>`).join('')}`
    case 'rose':
      return `<g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round">
        <path d="M100 96 C92 92 92 82 100 80 C110 78 114 90 106 98 C96 106 84 98 84 86 C84 70 104 64 116 74 C128 86 120 108 100 112 C78 116 68 96 72 80"/>
        <path d="M72 80 C64 96 70 120 100 124 C130 128 140 100 132 80"/>
        <path d="M100 124 L100 154"/>
        <path d="M100 140 C88 128 74 130 68 138 C78 146 92 146 100 140Z" fill="${c}"/>
        <path d="M100 146 C112 134 126 136 132 144 C122 152 108 152 100 146Z" fill="${c}"/></g>`
    case 'moon':
      return `<path d="M108 58 A44 44 0 1 0 140 120 A36 36 0 1 1 108 58Z" fill="${c}"/>
        <path d="M136 64 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4Z" fill="${c}"/>
        <circle cx="128" cy="100" r="3" fill="${c}"/><circle cx="64" cy="60" r="2.5" fill="${c}"/>`
    case 'heart':
    default:
      return `<path d="M100 146 C68 124 56 104 60 86 C64 66 88 60 100 80 C112 60 136 66 140 86 C144 104 132 124 100 146Z" fill="none" stroke="${c}" stroke-width="5"/>
        <path d="M100 128 C82 116 76 104 78 94 C80 84 92 82 100 92 C108 82 120 84 122 94 C124 104 118 116 100 128Z" fill="${c}"/>`
  }
}

export function sealSvg(style = 'rose', colorKey = 'burgundy', monogram = 'A') {
  const col = SEAL_COLORS[colorKey] || SEAL_COLORS.burgundy
  const seed = { monogram: 3, rose: 11, moon: 19, heart: 27 }[style] || 5
  const outer = blobPath(100, 100, 92, seed, 30, 0.12)
  const defs = `<radialGradient id="wx" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="${col.light}"/><stop offset=".45" stop-color="${col.base}"/><stop offset="1" stop-color="${col.dark}"/></radialGradient>
  <radialGradient id="wi" cx=".6" cy=".65" r=".7"><stop offset="0" stop-color="${col.light}" stop-opacity=".5"/><stop offset=".6" stop-color="${col.base}"/><stop offset="1" stop-color="${col.dark}"/></radialGradient>`
  const body = `
  <path d="${outer}" fill="url(#wx)"/>
  <path d="${outer}" fill="none" stroke="${col.dark}" stroke-opacity=".4" stroke-width="2"/>
  <circle cx="100" cy="100" r="64" fill="url(#wi)"/>
  <circle cx="100" cy="100" r="64" fill="none" stroke="${col.dark}" stroke-width="5" opacity=".55"/>
  <circle cx="99" cy="99" r="67" fill="none" stroke="${col.light}" stroke-width="2.5" opacity=".6"/>
  <g transform="translate(-1.6 -1.6)" opacity=".55">${emblem(style, monogram, col.light)}</g>
  <g opacity=".9">${emblem(style, monogram, col.dark)}</g>
  <ellipse cx="66" cy="50" rx="22" ry="9" fill="#fff" opacity=".22" transform="rotate(-30 66 50)"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs>${defs}</defs>${body}</svg>`
}

export const PAPERCLIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="170" viewBox="0 0 60 170"><defs><linearGradient id="pc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d939a"/><stop offset=".35" stop-color="#f4f6f8"/><stop offset=".6" stop-color="#b9bfc6"/><stop offset="1" stop-color="#7a8087"/></linearGradient></defs>
<path d="M22 60 V138 A12 12 0 0 0 46 138 V30 A18 18 0 0 0 10 30 V128" fill="none" stroke="#5c6167" stroke-opacity=".35" stroke-width="7" stroke-linecap="round" transform="translate(2 3)"/>
<path d="M22 60 V138 A12 12 0 0 0 46 138 V30 A18 18 0 0 0 10 30 V128" fill="none" stroke="url(#pc)" stroke-width="6" stroke-linecap="round"/></svg>`

export const CLOTHESPIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="190" viewBox="0 0 64 190"><defs><linearGradient id="wd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c49a6c"/><stop offset=".5" stop-color="#e2c093"/><stop offset="1" stop-color="#b5895c"/></linearGradient><linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="1" stop-color="#8d939a"/></linearGradient></defs>
<rect x="8" y="6" width="22" height="178" rx="6" fill="url(#wd)"/><rect x="34" y="6" width="22" height="178" rx="6" fill="url(#wd)"/>
<path d="M13 20 C16 60 12 110 16 170 M24 16 C22 70 26 120 22 176 M40 18 C43 70 39 120 43 172 M50 16 C48 80 52 130 49 176" stroke="#9c7347" stroke-width="1" opacity=".5" fill="none"/>
<rect x="4" y="74" width="56" height="16" rx="7" fill="url(#mt)" stroke="#6f757b" stroke-width="1"/>
<circle cx="32" cy="82" r="10" fill="none" stroke="#6f757b" stroke-width="3"/></svg>`
