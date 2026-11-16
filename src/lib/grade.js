// Premium colour grading, the way pro editors (VSCO / Lightroom presets) do it:
//  1. smooth tone curves (master + per channel), never clipped
//  2. split-toning: one colour for shadows, one for highlights
//  3. vibrance that boosts dull colours but leaves skin alone
//  4. everything blended by "intensity" so a filter can be dialled down
// Skin tones are detected per pixel and protected, so faces always stay natural.

/** Monotone cubic interpolation through control points -> 256-entry lookup table. */
function curveLUT(points) {
  const pts = points?.length ? points : [[0, 0], [255, 255]]
  const n = pts.length
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const d = []
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1))
  const m = [d[0]]
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2)
  m.push(d[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[i] = t * a * d[i]
      m[i + 1] = t * b * d[i]
    }
  }
  const lut = new Float32Array(256)
  let k = 0
  for (let v = 0; v < 256; v++) {
    while (k < n - 2 && v > xs[k + 1]) k++
    const h = xs[k + 1] - xs[k] || 1
    const t = Math.min(1, Math.max(0, (v - xs[k]) / h))
    const t2 = t * t, t3 = t2 * t
    lut[v] = (2 * t3 - 3 * t2 + 1) * ys[k] + (t3 - 2 * t2 + t) * h * m[k] + (-2 * t3 + 3 * t2) * ys[k + 1] + (t3 - t2) * h * m[k + 1]
  }
  return lut
}

const lutCache = new Map()
function luts(g) {
  const key = JSON.stringify([g.curve, g.r, g.g, g.b])
  let v = lutCache.get(key)
  if (!v) {
    v = { m: curveLUT(g.curve), r: curveLUT(g.r), g: curveLUT(g.g), b: curveLUT(g.b) }
    lutCache.set(key, v)
  }
  return v
}

/**
 * g = { curve, r, g, b: [[x,y]...], shadows: [r,g,b,amount], highlights: [r,g,b,amount],
 *       vibrance (-100..100), saturation (-100..100), mono: bool }
 */
export function applyGrade(ctx, w, h, g, strength = 1) {
  if (!g || strength <= 0) return
  const L = luts(g)
  const sh = g.shadows || [0, 0, 0, 0]
  const hi = g.highlights || [0, 0, 0, 0]
  // tint direction = colour minus its own grey, so toning shifts hue without changing brightness
  const tone = (c) => {
    const y = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    return [(c[0] - y) * c[3], (c[1] - y) * c[3], (c[2] - y) * c[3]]
  }
  const ts = tone(sh), th = tone(hi)
  const vib = (g.vibrance || 0) / 100
  const sat = 1 + (g.saturation || 0) / 100
  const mono = !!g.mono
  const id = ctx.getImageData(0, 0, w, h)
  const d = id.data
  for (let i = 0; i < d.length; i += 4) {
    const r0 = d[i], g0 = d[i + 1], b0 = d[i + 2]
    // curves
    let r = L.r[L.m[r0] | 0], gg = L.g[L.m[g0] | 0], b = L.b[L.m[b0] | 0]
    const max = Math.max(r0, g0, b0), min = Math.min(r0, g0, b0)
    const s0 = max ? (max - min) / max : 0
    // skin likelihood: warm hue (red > green > blue), moderate saturation, mid brightness
    let skin = 0
    if (r0 > g0 && g0 > b0 && s0 > 0.12 && s0 < 0.68 && max > 70) {
      const hue = ((g0 - b0) / (max - min || 1)) * 60 // 0..60 degrees
      skin = hue > 4 && hue < 46 ? 1 - Math.abs(hue - 22) / 26 : 0
    }
    const protect = 1 - 0.65 * skin
    // split toning by luminance
    const y = 0.299 * r + 0.587 * gg + 0.114 * b
    const t = y / 255
    const ws = (1 - t) * (1 - t), wh = t * t
    r += (ts[0] * ws + th[0] * wh) * protect
    gg += (ts[1] * ws + th[1] * wh) * protect
    b += (ts[2] * ws + th[2] * wh) * protect
    // vibrance (dull colours move most, skin barely) + global saturation
    const y2 = 0.299 * r + 0.587 * gg + 0.114 * b
    let k = sat
    if (vib) k *= 1 + vib * (1 - Math.min(1, s0 * 1.4)) * (vib > 0 ? protect : 1)
    if (mono) k = 0
    r = y2 + (r - y2) * k
    gg = y2 + (gg - y2) * k
    b = y2 + (b - y2) * k
    // intensity
    d[i] = r0 + (r - r0) * strength
    d[i + 1] = g0 + (gg - g0) * strength
    d[i + 2] = b0 + (b - b0) * strength
  }
  ctx.putImageData(id, 0, 0)
}
