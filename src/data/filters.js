const base = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sepia: 0,
  fade: 0,
  blur: 0,
  grain: 0,
  vignette: 0,
  leak: 0,
  tint: null, // { r, g, b, a: 0-100 }
  dateStamp: false,
}
const p = (o) => ({ ...base, ...o })

export const FILTERS = [
  { id: 'original', name: 'Original', mood: 'As captured', params: p({}) },
  // ✦ Signature looks: grade + one standout effect
  {
    id: 'stardust', name: 'Stardust', mood: 'Glitter on every highlight', look: true, sig: true,
    params: p({ lookStrength: 100, glitter: 70, glow: 22, grade: { curve: [[0, 10], [64, 70], [128, 138], [192, 206], [255, 252]], shadows: [130, 100, 130, 0.18], highlights: [255, 214, 225, 0.26], vibrance: 8, saturation: -4 } }),
  },
  {
    id: 'cinestill', name: '800T', mood: 'Night film, red halation', look: true, sig: true,
    params: p({ lookStrength: 100, halation: 75, grain: 10, grade: { curve: [[0, 10], [64, 58], [128, 128], [192, 202], [255, 246]], b: [[0, 14], [128, 134], [255, 248]], shadows: [60, 110, 140, 0.34], highlights: [255, 200, 165, 0.2], vibrance: 6, saturation: -6 } }),
  },
  {
    id: 'pearl', name: 'Pearl', mood: 'Iridescent dream', look: true, sig: true,
    params: p({ lookStrength: 100, pearl: 55, glow: 20, grade: { curve: [[0, 16], [64, 76], [128, 144], [192, 210], [255, 252]], shadows: [130, 120, 160, 0.16], highlights: [255, 240, 248, 0.2], vibrance: 4, saturation: -10 } }),
  },
  {
    id: 'prism', name: 'Prism', mood: 'Vintage lens fringe', look: true, sig: true,
    params: p({ lookStrength: 100, prism: 70, glow: 14, grain: 6, grade: { curve: [[0, 14], [64, 68], [128, 134], [192, 202], [255, 246]], shadows: [90, 110, 130, 0.2], highlights: [255, 215, 180, 0.22], vibrance: 6, saturation: -6 } }),
  },
  {
    id: 'angel', name: 'Angel', mood: 'Heavenly soft bloom', look: true, sig: true,
    params: p({ lookStrength: 100, glow: 38, soft: 26, grade: { curve: [[0, 18], [64, 82], [128, 150], [192, 216], [255, 254]], shadows: [150, 130, 140, 0.14], highlights: [255, 246, 236, 0.18], vibrance: 4, saturation: -12 } }),
  },
  {
    id: 'y2k-flash', name: 'Y2K Flash', mood: 'Digicam flash, date stamp', look: true, sig: true,
    params: p({ lookStrength: 100, dateStamp: true, vignette: 16, grain: 6, grade: { curve: [[0, 6], [64, 66], [128, 142], [192, 218], [255, 255]], b: [[0, 8], [128, 136], [255, 255]], shadows: [70, 90, 130, 0.22], highlights: [235, 240, 255, 0.14], vibrance: 14, saturation: 4 } }),
  },
  {
    id: 'golden-dust', name: 'Golden Dust', mood: 'Sun glitter & honey light', look: true, sig: true,
    params: p({ lookStrength: 100, glitter: 45, glow: 26, halation: 18, grade: { curve: [[0, 12], [64, 70], [128, 138], [192, 206], [255, 250]], b: [[0, 8], [128, 118], [255, 232]], shadows: [130, 90, 70, 0.2], highlights: [255, 205, 140, 0.32], vibrance: 10 } }),
  },
  {
    id: 'moonlit', name: 'Moonlit', mood: 'Blue-hour hush', look: true, sig: true,
    params: p({ lookStrength: 100, glow: 18, halation: 12, grade: { curve: [[0, 14], [64, 62], [128, 126], [192, 196], [255, 244]], shadows: [60, 80, 140, 0.34], highlights: [220, 230, 255, 0.2], vibrance: -4, saturation: -18 } }),
  },
  // Premium grades (lib/grade.js): soft curves + split-toning + skin-safe vibrance. Subtle on purpose.
  {
    id: 'porcelain', name: 'Porcelain', mood: 'Clean, luminous skin', look: true,
    params: p({ lookStrength: 100, glow: 10, grade: { curve: [[0, 6], [60, 66], [128, 140], [196, 208], [255, 252]], shadows: [150, 120, 110, 0.14], highlights: [255, 246, 238, 0.18], vibrance: 12, saturation: -4 } }),
  },
  {
    id: 'honey', name: 'Honey', mood: 'Golden-hour warmth', look: true,
    params: p({ lookStrength: 100, glow: 14, grade: { curve: [[0, 10], [64, 68], [128, 134], [192, 200], [255, 248]], r: [[0, 0], [128, 134], [255, 255]], b: [[0, 6], [128, 120], [255, 236]], shadows: [130, 90, 70, 0.2], highlights: [255, 205, 150, 0.3], vibrance: 10, saturation: -2 } }),
  },
  {
    id: 'peach-fuzz', name: 'Peach Fuzz', mood: 'Soft peachy blush', look: true,
    params: p({ lookStrength: 100, glow: 12, grade: { curve: [[0, 12], [64, 72], [128, 138], [192, 204], [255, 250]], shadows: [150, 100, 120, 0.18], highlights: [255, 200, 180, 0.3], vibrance: 8, saturation: -8 } }),
  },
  {
    id: 'milk-tea', name: 'Milk Tea', mood: 'Creamy & muted', look: true,
    params: p({ lookStrength: 100, glow: 8, grade: { curve: [[0, 22], [64, 74], [128, 134], [192, 196], [255, 240]], shadows: [120, 100, 90, 0.28], highlights: [250, 232, 205, 0.32], vibrance: -6, saturation: -24 } }),
  },
  {
    id: 'seoul-cafe', name: 'Seoul Café', mood: 'Bright, airy & clean', look: true,
    params: p({ lookStrength: 100, glow: 10, grade: { curve: [[0, 16], [64, 80], [128, 148], [192, 212], [255, 252]], shadows: [120, 140, 160, 0.2], highlights: [255, 244, 236, 0.16], vibrance: 6, saturation: -12 } }),
  },
  {
    id: 'rose', name: 'Rosé', mood: 'Blush-pink romance', look: true,
    params: p({ lookStrength: 100, glow: 12, grade: { curve: [[0, 10], [64, 70], [128, 136], [192, 202], [255, 250]], shadows: [130, 100, 130, 0.22], highlights: [255, 205, 220, 0.3], vibrance: 6, saturation: -6 } }),
  },
  {
    id: 'gold-200', name: 'Gold 200', mood: 'Classic warm film', look: true,
    params: p({ lookStrength: 100, grain: 9, glow: 6, grade: { curve: [[0, 14], [60, 62], [128, 132], [196, 202], [255, 244]], r: [[0, 4], [128, 136], [255, 252]], g: [[0, 0], [128, 130], [255, 250]], b: [[0, 18], [128, 118], [255, 226]], shadows: [80, 100, 110, 0.18], highlights: [255, 214, 160, 0.24], vibrance: 4, saturation: -6 } }),
  },
  {
    id: 'cinema', name: 'Cinema', mood: 'Teal shadows, warm skin', look: true,
    params: p({ lookStrength: 100, grade: { curve: [[0, 8], [64, 58], [128, 128], [192, 200], [255, 246]], shadows: [60, 120, 140, 0.32], highlights: [255, 196, 150, 0.22], vibrance: 4, saturation: -8 } }),
  },
  {
    id: 'velvet', name: 'Velvet', mood: 'Deep, rich & moody', look: true,
    params: p({ lookStrength: 100, vignette: 14, grade: { curve: [[0, 6], [64, 54], [128, 120], [192, 190], [255, 240]], shadows: [80, 50, 70, 0.26], highlights: [245, 210, 185, 0.16], vibrance: 0, saturation: -10 } }),
  },
  {
    id: 'super-8', name: 'Super 8', mood: 'Faded home-movie film', look: true,
    params: p({ lookStrength: 100, grain: 14, glow: 10, grade: { curve: [[0, 30], [64, 78], [128, 132], [192, 190], [255, 232]], shadows: [90, 100, 115, 0.26], highlights: [250, 225, 195, 0.3], vibrance: -4, saturation: -18 } }),
  },
  {
    id: 'sunkissed', name: 'Sunkissed', mood: 'Dreamy backlit glow', look: true,
    params: p({ lookStrength: 100, glow: 24, grade: { curve: [[0, 12], [64, 72], [128, 140], [192, 208], [255, 252]], shadows: [140, 100, 80, 0.16], highlights: [255, 200, 140, 0.3], vibrance: 10, saturation: -2 } }),
  },
  {
    id: 'noir-soft', name: 'Noir Soft', mood: 'Gentle black & white', look: true,
    params: p({ lookStrength: 100, grain: 6, grade: { mono: true, curve: [[0, 14], [64, 60], [128, 130], [192, 204], [255, 246]], highlights: [240, 228, 212, 0.08] } }),
  },
]
// Older preset ids (used by vibes / saved designs) now point at the new grades.
const ALIAS = { 'golden-hour': 'honey', 'disposable-90s': 'gold-200', 'soft-matcha': 'seoul-cafe', cottagecore: 'peach-fuzz', 'faded-espresso': 'milk-tea', 'dazz-vintage': 'super-8', 'clean-girl': 'porcelain', 'coquette-blush': 'rose', 'dark-academia': 'velvet' }
for (const [old, to] of Object.entries(ALIAS)) {
  const t = FILTERS.find((f) => f.id === to)
  FILTERS.push({ ...t, id: old, hidden: true })
}

export const FILTER_MAP = Object.fromEntries(FILTERS.map((f) => [f.id, f]))
export const DEFAULT_ADJ = FILTER_MAP.original.params

export const ADJUSTMENTS = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'warmth', label: 'Warmth', min: -100, max: 100 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
  { key: 'fade', label: 'Fade', min: 0, max: 100 },
  { key: 'blur', label: 'Soft Blur', min: 0, max: 100 },
  { key: 'grain', label: 'Film Grain', min: 0, max: 100 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
  { key: 'leak', label: 'Light Leak', min: 0, max: 100 },
]

export const ASPECTS = {
  '1:1': { label: '1:1', name: 'Square', w: 1, h: 1 },
  '4:5': { label: '4:5', name: 'Portrait', w: 4, h: 5 },
  '9:16': { label: '9:16', name: 'Pin / Story', w: 9, h: 16 },
  // matches the current photo; PhotoStage updates w/h when a photo loads
  original: { label: 'Original', name: 'Your photo', w: 4, h: 5 },
}
