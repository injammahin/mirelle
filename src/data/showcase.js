// Default inspiration "pins" shown on the Explore board. Each one is a real recipe
// rendered live by the same engine users edit with — click to remix it.
import { createRecipe, createLetterRecipe } from '../lib/magic'
import { mulberry32 } from '../lib/random'
import { DEFAULT_LETTER, TEMPLATES } from './letter'

const photoPins = [
  ['coffee', 'coquette', '4:5', 3, 'Slow morning, pink ribbons'],
  ['golden', 'vintage90s', '9:16', 12, 'Summer tapes at golden hour'],
  ['book', 'darkAcademia', '4:5', 5, 'Candlelit chapter'],
  ['botanical', 'softBotanical', '1:1', 8, 'Pressed herbarium notes'],
  ['paris', 'minimalEditorial', '4:5', 21, 'An ordinary Tuesday in Paris'],
  ['mirror', 'coquette', '9:16', 44, 'Mirror, mirror, soft era'],
  ['golden', 'softBotanical', '4:5', 17, 'Wildflower field diary'],
  ['coffee', 'darkAcademia', '1:1', 33, 'Espresso & old books'],
  ['paris', 'vintage90s', '9:16', 9, 'Disposable days in the city'],
  ['book', 'coquette', '1:1', 61, 'Little lovely things'],
  ['mirror', 'minimalEditorial', '4:5', 4, 'The quiet issue'],
  ['botanical', 'vintage90s', '4:5', 27, 'Rewind to spring'],
]

export const SHOWCASE = photoPins.map(([sampleId, vibe, aspect, seed, title]) => {
  const recipe = createRecipe(vibe, aspect, mulberry32(seed * 977))
  return { id: `p-${sampleId}-${vibe}-${seed}`, kind: 'photo', sampleId, vibe, aspect, title, recipe }
})

const letterPins = [
  ['coquette', 0, 'Love letter, sealed in rose'],
  ['darkAcademia', 3, 'Pen pal from the library'],
  ['softBotanical', 1, 'Note to my future self'],
  ['vintage90s', 4, 'Open when you need a hug'],
]
export const LETTER_SHOWCASE = letterPins.map(([vibe, t, title], i) => {
  const tpl = TEMPLATES[t]
  const letter = { ...DEFAULT_LETTER, ...createLetterRecipe(vibe, mulberry32(101 + i * 31)), title: tpl.title, body: tpl.body, closing: tpl.closing }
  return { id: `l-${vibe}`, kind: 'letter', vibe, aspect: '4:5', title, letter }
})

// Interleave so the board feels curated
export const BOARD = (() => {
  const out = []
  let li = 0
  SHOWCASE.forEach((p, i) => {
    out.push(p)
    if (i % 3 === 1 && li < LETTER_SHOWCASE.length) out.push(LETTER_SHOWCASE[li++])
  })
  while (li < LETTER_SHOWCASE.length) out.push(LETTER_SHOWCASE[li++])
  return out
})()
