// Deterministic PRNG so procedural textures and grain stay stable between renders.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10)
export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)]
export const rand = (min, max, rng = Math.random) => min + (max - min) * rng()
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
