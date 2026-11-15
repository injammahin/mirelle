export const FONTS = {
  caveat: { id: 'caveat', label: 'Script', family: '"Caveat", cursive', weight: 600 },
  nothing: { id: 'nothing', label: 'Handwritten', family: '"Nothing You Could Do", cursive', weight: 400 },
  playfair: { id: 'playfair', label: 'Editorial', family: '"Playfair Display", serif', weight: 500, italic: true },
  cormorant: { id: 'cormorant', label: 'Classic Serif', family: '"Cormorant Garamond", serif', weight: 500 },
  courier: { id: 'courier', label: 'Typewriter', family: '"Courier Prime", monospace', weight: 400 },
  jakarta: { id: 'jakarta', label: 'Modern Sans', family: '"Plus Jakarta Sans", sans-serif', weight: 600 },
}

export function fontString(id, px, opts = {}) {
  const f = FONTS[id] || FONTS.caveat
  const italic = opts.italic ?? f.italic
  return `${italic ? 'italic ' : ''}${opts.weight ?? f.weight} ${Math.max(1, px)}px ${f.family}`
}

export async function loadAllFonts() {
  if (typeof document === 'undefined' || !document.fonts) return
  const specs = [
    ...Object.values(FONTS).map((f) => `${f.italic ? 'italic ' : ''}${f.weight} 40px ${f.family}`),
    'italic 500 40px "Cormorant Garamond"',
    'italic 600 40px "Cormorant Garamond"',
    '600 40px "Cormorant Garamond"',
    '700 40px "Courier Prime"',
    '400 40px "Playfair Display"',
    'italic 400 40px "Playfair Display"',
    '400 40px "Caveat"',
    '500 40px "Plus Jakarta Sans"',
  ]
  await Promise.allSettled(specs.map((s) => document.fonts.load(s)))
}
