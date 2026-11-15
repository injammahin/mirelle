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
  // Pinterest looks: matched to real reference photos (data/looks.json)
  { id: 'window-glow', name: 'Window Glow', mood: 'Sun through the curtains', look: true, params: p({ look: 'window-glow', lookStrength: 85, glow: 70, soft: 34, haze: 52, hazeFrom: [0.12, 0.08], hazeColor: [255, 214, 176], grain: 4 }) },
  { id: 'peach-bloom', name: 'Peach Bloom', mood: 'Glowing peach petals', look: true, params: p({ look: 'peach-bloom', lookStrength: 85, glow: 85, soft: 28, haze: 30, hazeFrom: [0.5, 0.15], hazeColor: [255, 196, 170], contrast: 6 }) },
  { id: 'linen-blush', name: 'Linen Blush', mood: 'Soft & airy pink', look: true, params: p({ look: 'linen-blush', lookStrength: 80, lookCast: 26, glow: 36, soft: 24, haze: 30, hazeFrom: [0.2, 0], hazeColor: [255, 228, 232] }) },
  { id: 'afternoon-haze', name: 'Afternoon Haze', mood: 'Hazy golden light', look: true, params: p({ look: 'afternoon-haze', lookStrength: 85, glow: 55, soft: 22, haze: 46, hazeFrom: [0.85, 0.1], hazeColor: [255, 222, 170], fade: 6 }) },
  { id: 'super8-rose', name: 'Super 8 Rose', mood: 'Faded film memory', look: true, params: p({ look: 'super8-rose', lookStrength: 85, glow: 40, soft: 32, haze: 22, hazeFrom: [0.5, 0.3], hazeColor: [255, 200, 220], grain: 16, fade: 6 }) },
  { id: 'golden-wall', name: 'Golden Wall', mood: 'Warm sunset shadows', look: true, params: p({ look: 'golden-wall', lookStrength: 85, glow: 30, soft: 10, haze: 44, hazeFrom: [0.9, 0.2], hazeColor: [255, 170, 90] }) },
  { id: 'lamp-light', name: 'Lamp Light', mood: 'Cosy tungsten night', look: true, params: p({ look: 'lamp-light', lookStrength: 85, glow: 34, soft: 18, haze: 48, hazeFrom: [0.1, 0.12], hazeColor: [255, 160, 80], grain: 12, vignette: 18 }) },
  { id: 'sunlit-table', name: 'Sunlit Table', mood: 'Rich golden hour', look: true, params: p({ look: 'sunlit-table', lookStrength: 80, glow: 34, soft: 10, haze: 36, hazeFrom: [0.15, 0.05], hazeColor: [255, 205, 140] }) },
  { id: 'candlelit-pink', name: 'Candlelit Pink', mood: 'Moody warm evening', look: true, params: p({ look: 'candlelit-pink', lookStrength: 80, lookCast: 50, glow: 30, soft: 14, haze: 22, hazeFrom: [0.1, 0.1], hazeColor: [255, 180, 120], vignette: 14 }) },
  { id: 'paris-street', name: 'Paris Street', mood: 'Muted cinematic film', look: true, params: p({ look: 'paris-street', lookStrength: 85, glow: 34, soft: 16, haze: 30, hazeFrom: [0.1, 0.05], hazeColor: [255, 226, 190], fade: 8, grain: 8 }) },
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
  // matches the current photo; PhotoStage updates w/h when a photo loads
  original: { label: 'Original', name: 'Your photo', w: 4, h: 5 },
}
