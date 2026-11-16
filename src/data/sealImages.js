// Real wax-seal images (src/assets/seals). Old seal ids map to the closest new seal.
import META from '../assets/seals/seals.json'

const files = import.meta.glob('../assets/seals/*.webp', { eager: true, query: '?url', import: 'default' })

export const SEALS = META.map((m) => ({ ...m, src: files[`../assets/seals/${m.id}.webp`] }))
const MAP = Object.fromEntries(SEALS.map((s) => [s.id, s]))
const OLD = { monogram: 'gold-monogram-m', moon: 'gold-sun', rose: 'rose', heart: 'heart' }
export const sealById = (id) => MAP[id] || MAP[OLD[id]] || SEALS[0]
