export const PAPERS = [
  { id: 'parchment', name: 'Aged Parchment', note: 'Tea-stained, burnt edges' },
  { id: 'floral', name: 'Pressed Floral Handmade', note: 'Petal inclusions, deckle' },
  { id: 'linen', name: 'Crisp Cotton Linen', note: 'Fine woven texture' },
  { id: 'grid', name: 'Grid Notebook Page', note: 'Journal grid & margin' },
  { id: 'deckle', name: 'Deckle-Edge Postcard', note: 'Stamp box & address' },
  { id: 'botanical', name: 'Botanical Pressed Margin', note: 'Pressed leaves margin' },
]

export const LETTER_FONTS = [
  { id: 'courier', name: 'Typewriter' },
  { id: 'caveat', name: 'Cursive Ink' },
  { id: 'nothing', name: 'Handwritten' },
  { id: 'cormorant', name: 'Serif Editorial' },
]

export const INKS = [
  { id: 'sepia', name: 'Sepia Brown', color: '#6B4A35' },
  { id: 'black', name: 'Fountain Pen Black', color: '#1F1D24' },
  { id: 'rose', name: 'Dried Rose', color: '#A35D62' },
  { id: 'forest', name: 'Forest Green', color: '#3E5641' },
  { id: 'navy', name: 'Midnight Navy', color: '#2E3A59' },
]
export const INK_MAP = Object.fromEntries(INKS.map((i) => [i.id, i]))

export const SEAL_STYLES = [
  { id: 'monogram', name: 'Monogram' },
  { id: 'rose', name: 'Botanical Rose' },
  { id: 'moon', name: 'Celestial Moon' },
  { id: 'heart', name: 'Heart' },
]

export const SEAL_COLORS = {
  burgundy: { name: 'Burgundy', base: '#7d1f2c', light: '#b04654', dark: '#4a0e16' },
  gold: { name: 'Gold', base: '#b88a30', light: '#ecc97a', dark: '#7a5714' },
  sage: { name: 'Sage', base: '#6f8467', light: '#a9bb9f', dark: '#43553e' },
  cream: { name: 'Cream', base: '#d6c8ac', light: '#f6efe0', dark: '#a39272' },
}

export const SEAL_POSITIONS = [
  { id: 'bottom-right', name: 'Bottom right' },
  { id: 'bottom-left', name: 'Bottom left' },
  { id: 'flap', name: 'Envelope flap' },
]

export const LETTER_BOTANICALS = ['lavender', 'daisy', 'driedRose', 'fern', 'eucalyptus', 'rosePetal']

export const WASHI_COLORS = {
  sage: { name: 'Sage', id: 'washiSage', swatch: '#c9d3c1' },
  terra: { name: 'Terracotta', id: 'washiTerra', swatch: '#ebc0ae' },
  cream: { name: 'Floral', id: 'washiCream', swatch: '#f4ead7' },
}

export const STAMP_PHRASES = [
  'Sent from a quiet morning',
  'Written by candlelight',
  'Posted on a rainy afternoon',
  'Sealed with soft intentions',
  'From the window seat',
  'Somewhere between chapters',
  'Delivered with warm tea',
  'Written under the linden tree',
]

export const PROMPTS = [
  'Describe the light in the room you’re writing from.',
  'What small ritual made this week feel softer?',
  'Write about a smell that instantly takes you home.',
  'Tell them about a stranger’s kindness you noticed lately.',
  'What are you quietly proud of right now?',
  'Describe a perfect slow Sunday, hour by hour.',
  'Which song is the soundtrack of this season of your life?',
  'Write a memory you keep returning to — and why.',
  'What would you whisper to your younger self today?',
  'List five tiny joys from the last three days.',
  'Describe the view from your favourite window.',
  'What are you learning to let go of?',
  'Write about a book that changed the way you see things.',
  'What does “home” feel like to you lately?',
  'Tell them what you hope their next year holds.',
  'Write about the last time you laughed until you cried.',
  'Describe a place you want to visit together someday.',
  'What season are you in — and what is it teaching you?',
  'Write about the first time you met.',
  'What made you think of them this week?',
  'Describe a meal you’ll always remember.',
  'If today were a poem, what would its first line be?',
]

export const TEMPLATES = [
  {
    id: 'love',
    name: 'Love Letter',
    title: 'My dearest,',
    body: 'I’ve been collecting little pieces of today to give to you — the way the morning light spilled across the table, the first sip of coffee, the song that played twice on the radio.\n\nEvery ordinary moment feels a little more golden because you exist in the same world as it. I hope this finds you wrapped in something warm, smiling at nothing in particular.',
    closing: 'yours, always,',
  },
  {
    id: 'future',
    name: 'Note to Future Self',
    title: 'Dear future me,',
    body: 'I hope you still stop to notice the small things — the steam rising from your tea, the hush right after rain, the way strangers hold doors open.\n\nRight now I’m learning to be gentle with myself. I hope by the time you read this, it has become second nature. Keep romanticizing your little life. It was always worth it.',
    closing: 'with patience & love,',
  },
  {
    id: 'thanks',
    name: 'Thank You Note',
    title: 'Thank you, truly',
    body: 'Your kindness arrived exactly when I needed it, like an umbrella on an unexpectedly rainy day.\n\nI wanted you to know it didn’t go unnoticed — it’s tucked away in the part of my heart where I keep the good things.',
    closing: 'with gratitude,',
  },
  {
    id: 'penpal',
    name: 'Pen Pal Hello',
    title: 'Hello, friend!',
    body: 'Greetings from my little corner of the world, where the cafés are slow and the bookshops smell of old paper.\n\nTell me everything — what you’re reading, what you’re cooking, what the sky looked like this morning. I’ve tucked a pressed flower in here for you.',
    closing: 'warmly, your pen pal,',
  },
  {
    id: 'openwhen',
    name: 'Open When…',
    title: 'Open when you need a hug',
    body: 'Close your eyes for a second. Breathe in like you’re smelling fresh bread, breathe out like you’re cooling hot cocoa.\n\nYou are doing so much better than you think. This feeling is a weather, not a climate — it will pass, and I’ll be right here when it does.',
    closing: 'hugging you from afar,',
  },
]

export const DEFAULT_LETTER = {
  paper: 'img:pressed-violet',
  font: 'caveat',
  ink: 'sepia',
  size: 0.046,
  lineHeight: 1.45,
  align: 'left',
  title: TEMPLATES[0].title,
  body: TEMPLATES[0].body,
  closing: TEMPLATES[0].closing,
  signature: 'M.',
  postmark: false,
  stampPhrase: STAMP_PHRASES[0],
  seal: { enabled: true, style: 'rose', size: 1, position: 'bottom-right' },
  botanicals: [],
  layers: [], // real stickers on the letter
  washi: 'sage',
  photoPin: { enabled: false, clip: 'paperclip', corner: 'top-right' },
  seed: 7,
}
