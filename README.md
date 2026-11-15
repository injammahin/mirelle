# Mirelle — Aesthetic Studio

Turn everyday photos into Pinterest-style aesthetic edits, then write vintage digital letters sealed with wax.
It runs entirely in the browser, with no backend and no uploads to any server.

## Features

**Explore board (home)**
- Pinterest-style masonry board with 16 ready-made looks (photo edits + letters), rendered live by the editor engine
- Search, vibe filters and one-tap **Remix** to open any look in the studio

**Photo Studio**
- Drag-and-drop upload (JPG / PNG / WEBP, kept up to 4096px) + 6 built-in sample scenes
- 8 frames: Classic Polaroid (editable caption), Torn Journal, 35mm Film Strip, Vintage Locket, Gallery Mat, Coquette Lace, Y2K Digicam HUD
- 17 hand-built SVG stickers: lavender, daisy, dried rose, rose petal, fern, eucalyptus, bow, heart, butterfly, sparkles, moon, postage stamp, ticket stub, coffee ring, 3 washi tapes
- Drag, rotate, resize, flip, duplicate, reorder and delete layers (mouse and touch), plus keyboard nudging and undo/redo
- 10 colour-grading presets (Golden Hour, 90s Disposable, Soft Matcha, Cottagecore, Faded Espresso, Dazz Cam, Clean Girl, Coquette Blush, Dark Academia), with live thumbnails of *your* photo
- Fine-tuning: brightness, contrast, saturation, warmth, sepia, fade, soft blur, film grain, vignette, light leak, plus crop zoom and pan
- Text overlays with 6 fonts, colours, shadow, letter-spacing and curved / arched text

**✨ Auto Aesthetic**
- One tap builds a cohesive recipe: filter + matching frame + 2–3 well-placed stickers + caption + grain
- Vibe selector: Coquette · Dark Academia · Soft Botanical · 90s Vintage · Minimal Editorial

**💌 Letter Studio**
- 6 papers: Aged Parchment, Pressed Floral Handmade, Cotton Linen, Grid Notebook, Deckle-Edge Postcard, Botanical Margin
- Typewriter / cursive / handwritten / serif fonts, 5 ink colours, size, line-height and alignment (including justify)
- Wax seals (Monogram, Rose, Moon, Heart) in Burgundy, Gold, Sage or Cream, placed bottom-left, bottom-right or on the envelope flap
- Pressed flowers taped on with washi, a polaroid of your edited photo pinned with a paperclip or clothespin
- Poetic postmark ("Sent from a quiet morning — Nov 2026"), letter templates and a poetic prompt generator
- Text automatically wraps around the photo, seal and postmark, and shrinks to fit the page

**Export**
- PNG or JPG at HD (1080), 2K (2160) or 4K (3240px wide) in 1:1, 4:5 or 9:16
- **Download Project .zip**: bundles this full source code from inside the app (JSZip)

## Tech stack
React 18 · Vite 5 · Tailwind CSS 3 · SCSS · Zustand · Framer Motion · lucide-react · JSZip · HTML5 Canvas

## Getting started
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in /dist
npm run preview
```

## Project structure
```
src/
  App.jsx                    app shell (nav rail, top bar, explore / studio)
  store/useStudio.js         global state (zustand) + undo/redo
  data/                      filters, frames, stickers (SVG), samples, vibes, letter data, seals, showcase pins
  lib/photoRenderer.js       canvas engine: colour grading, grain, frames, stickers, curved text
  lib/letterRenderer.js      paper textures, text flow, seals, botanicals, polaroid pin
  lib/magic.js               Auto Aesthetic recipe engine
  lib/exporter.js            high-res PNG/JPG export
  lib/projectZip.js          in-app source code .zip
  components/ui/             shadcn-style primitives (Slider, Switch, Tabs, Segmented…)
  components/photo/          Photo Studio panels + interactive canvas
  components/letter/         Letter Studio panels + canvas
  components/layout/         Explore board, nav, magic bar, export, studio layout
  styles/                    Tailwind + SCSS textures (grain, paper, glass, sliders)
```

The live canvas, thumbnails, Explore pins and exports all use the same renderer, so what you see is exactly what you download.
