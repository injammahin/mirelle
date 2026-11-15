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
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    mood: 'Honeyed sunlight',
    params: p({ brightness: 6, contrast: 8, saturation: 12, warmth: 38, fade: 8, tint: { r: 255, g: 170, b: 90, a: 14 }, vignette: 22, grain: 10, leak: 22 }),
  },
  {
    id: 'disposable-90s',
    name: '90s Disposable',
    mood: 'Flash & film rolls',
    params: p({ brightness: 4, contrast: 20, saturation: -4, warmth: 16, fade: 18, tint: { r: 255, g: 190, b: 140, a: 10 }, vignette: 30, grain: 48, leak: 34 }),
  },
  {
    id: 'soft-matcha',
    name: 'Soft Matcha',
    mood: 'Green tea calm',
    params: p({ brightness: 8, contrast: -8, saturation: -18, warmth: -6, fade: 24, tint: { r: 150, g: 182, b: 128, a: 22 }, vignette: 10, grain: 12 }),
  },
  {
    id: 'cottagecore',
    name: 'Cottagecore Warmth',
    mood: 'Baked bread & linen',
    params: p({ brightness: 5, contrast: 4, saturation: -4, warmth: 28, sepia: 12, fade: 16, tint: { r: 232, g: 180, b: 140, a: 12 }, vignette: 22, grain: 18 }),
  },
  {
    id: 'faded-espresso',
    name: 'Faded Espresso',
    mood: 'Muted coffee tones',
    params: p({ brightness: -6, contrast: 10, saturation: -32, warmth: 18, sepia: 30, fade: 28, tint: { r: 120, g: 80, b: 60, a: 14 }, vignette: 34, grain: 24 }),
  },
  {
    id: 'dazz-vintage',
    name: 'Dazz Cam Vintage',
    mood: 'Date-stamped memories',
    params: p({ brightness: 2, contrast: 24, saturation: 14, warmth: 12, fade: 10, tint: { r: 255, g: 120, b: 80, a: 6 }, vignette: 40, grain: 36, leak: 26, dateStamp: true }),
  },
  {
    id: 'clean-girl',
    name: 'Clean Girl Minimal',
    mood: 'Bright, airy, glowy',
    params: p({ brightness: 14, contrast: -8, saturation: -12, warmth: 6, fade: 12, tint: { r: 255, g: 232, b: 222, a: 10 } }),
  },
  {
    id: 'coquette-blush',
    name: 'Coquette Blush',
    mood: 'Ribbons & rosewater',
    params: p({ brightness: 8, contrast: -4, saturation: -6, warmth: 10, fade: 20, tint: { r: 255, g: 170, b: 190, a: 22 }, vignette: 16, grain: 10 }),
  },
  {
    id: 'dark-academia',
    name: 'Dark Academia',
    mood: 'Candlelit libraries',
    params: p({ brightness: -12, contrast: 18, saturation: -26, warmth: 16, sepia: 20, fade: 8, tint: { r: 110, g: 75, b: 45, a: 12 }, vignette: 52, grain: 22 }),
  },
]

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
}
