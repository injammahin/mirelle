// Real stationery images for the Letter Studio (src/assets/letter-papers).
// `area` = where the letter text goes, as fractions [x, y, w, h] of the image.
import META from '../assets/letter-papers/papers.json'

const files = import.meta.glob('../assets/letter-papers/*.webp', { eager: true, query: '?url', import: 'default' })

export const IMAGE_PAPERS = META.map((m) => ({
  ...m,
  src: files[`../assets/letter-papers/${m.slug}.webp`],
  thumb: files[`../assets/letter-papers/${m.slug}.thumb.webp`],
}))
export const IMAGE_PAPER_MAP = Object.fromEntries(IMAGE_PAPERS.map((p) => [p.id, p]))
