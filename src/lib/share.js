// Letters travel inside the link itself (no server): the letter + envelope design are JSON,
// compressed and base64url-encoded into the URL hash, e.g.  https://site/#l=...
// Papers, seals and stickers are referenced by id because they ship with the app.

export const REVEALS = [
  { id: 'envelope', name: 'Classic', note: 'Closure releases, flap lifts, letter rises out' },
  { id: 'flip', name: 'Address side', note: 'Arrives stamped & addressed, flips over, opens' },
  { id: 'stardust', name: 'Stardust', note: 'Golden sparkles swirl, envelope melts into light' },
  { id: 'petals', name: 'Petal shower', note: 'Petals drift down as the letter blooms in' },
  { id: 'unfold', name: 'Folded letter', note: 'A sealed letter unfolds panel by panel' },
]

export const ENVELOPES = {
  ivory: { name: 'Ivory', body: '#f7f2e8', ink: '#4a3a30' },
  cream: { name: 'Cream', body: '#f1e6d2', ink: '#4a3a30' },
  blush: { name: 'Blush', body: '#efd3cf', ink: '#6b3c3c' },
  rose: { name: 'Dusty rose', body: '#d9a5a3', ink: '#5a2e30' },
  sage: { name: 'Sage', body: '#c9d2bb', ink: '#3c4a33' },
  sky: { name: 'Dusty blue', body: '#b9cad4', ink: '#2f4250' },
  lavender: { name: 'Lavender', body: '#d6cbe3', ink: '#47395c' },
  kraft: { name: 'Kraft', body: '#c8a27a', ink: '#3f2b1b' },
  burgundy: { name: 'Burgundy', body: '#7b2d36', ink: '#f6e6d6' },
  midnight: { name: 'Midnight', body: '#26304d', ink: '#efe6d6' },
}
export const FLAPS = [
  { id: 'classic', name: 'Classic' },
  { id: 'scallop', name: 'Gold scallop' },
  { id: 'round', name: 'Rounded' },
]
export const CLOSURES = [
  { id: 'seal', name: 'Wax seal' },
  { id: 'ribbon', name: 'Ribbon bow' },
  { id: 'twine', name: 'Twine' },
  { id: 'none', name: 'None' },
]
export const RIBBONS = {
  blush: { name: 'Blush organza', color: '#eaa9b6' },
  rose: { name: 'Dusty rose', color: '#c97c8c' },
  burgundy: { name: 'Burgundy', color: '#7d1f30' },
  sage: { name: 'Sage', color: '#9fb08d' },
  ivory: { name: 'Ivory', color: '#f2ead9' },
  gold: { name: 'Gold', color: '#c9a24a' },
  lavender: { name: 'Lavender', color: '#b8a3d8' },
}
// tucked under the closure (ids from the sticker library)
export const SPRIGS = [
  { id: 'none', name: 'None' },
  { id: 'img-letter-babys-breath', name: "Baby's breath" },
  { id: 'img-bouquets-lavender-bunch', name: 'Lavender' },
  { id: 'img-flowers-daisy', name: 'Daisy' },
  { id: 'img-flowers-white-cosmos', name: 'Cosmos' },
  { id: 'img-letter-pearl-blossom', name: 'Pearl blossom' },
  { id: 'img-flowers-pressed-cosmos', name: 'Pressed' },
  { id: 'img-letter-blush-lily', name: 'Lily' },
]
export const LINERS = [
  { id: 'plain', name: 'Plain' },
  { id: 'gold', name: 'Gold dots' },
  { id: 'gingham', name: 'Gingham' },
  { id: 'stripe', name: 'Stripes' },
]

export const DEFAULT_SHARE = { reveal: 'envelope', envelope: 'ivory', flap: 'scallop', closure: 'seal', ribbon: 'blush', sprig: 'img-letter-babys-breath', liner: 'gold', to: '', note: '' }

const KEEP = ['paper', 'font', 'ink', 'size', 'lineHeight', 'align', 'title', 'body', 'closing', 'signature', 'postmark', 'stampPhrase', 'seal', 'washi', 'botanicals', 'seed', 'textBox', 'layers']

const b64url = (bytes) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const unb64url = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}
const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer())

export const cleanLetter = (letter) => {
  const l = Object.fromEntries(KEEP.filter((k) => letter[k] !== undefined).map((k) => [k, letter[k]]))
  // user-uploaded stickers live only on the sender's device
  l.layers = (l.layers || []).filter((x) => !String(x.stickerId).startsWith('img-mine-'))
  return l
}

/** { letter, aspect, share } -> shareable URL */
export async function makeLetterLink({ letter, aspect, share }) {
  const json = new TextEncoder().encode(JSON.stringify({ v: 2, l: cleanLetter(letter), a: aspect, s: { ...DEFAULT_SHARE, ...share } }))
  let payload
  if (typeof CompressionStream !== 'undefined') payload = 'z' + b64url(await pipe(json, new CompressionStream('deflate-raw')))
  else payload = 'j' + b64url(json)
  return `${location.origin}${location.pathname}#l=${payload}`
}

export async function readLetterLink(hash = location.hash) {
  const m = /^#l=([zj])([A-Za-z0-9_-]+)$/.exec(hash)
  if (!m) return null
  let bytes = unb64url(m[2])
  if (m[1] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
  const d = JSON.parse(new TextDecoder().decode(bytes))
  // v1 links stored reveal / envelope / to separately
  const share = d.s || { reveal: d.r, envelope: d.e, to: d.t, closure: 'seal', flap: 'classic', sprig: 'none', liner: 'plain' }
  return { letter: d.l, aspect: d.a || '4:5', share: { ...DEFAULT_SHARE, ...share, envelope: ENVELOPES[share.envelope] ? share.envelope : 'ivory' } }
}

export const isLetterLink = () => /^#l=/.test(location.hash)
