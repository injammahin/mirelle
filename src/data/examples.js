// Example portraits used inside frames on the home page and as the studio's starting photo.
// Drop more images into src/assets/examples/ and they are picked up automatically.
export const EXAMPLES = Object.entries(import.meta.glob('../assets/examples/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' }))
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => ({ src, name: path.split('/').pop().replace(/\.[^.]+$/, '') }))

const ORDER = [3, 5, 1, 2, 4, 6, 0] // pleasant pairing of portraits with the first frames
export const exampleFor = (i) => (EXAMPLES.length ? EXAMPLES[ORDER[i % ORDER.length] % EXAMPLES.length] : null)

/** Portrait paired with a frame (frame-meta "photo"), falling back to rotation. */
export const exampleByName = (name) => EXAMPLES.find((e) => e.name === name) || null
