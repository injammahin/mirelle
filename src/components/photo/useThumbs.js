import { useEffect, useState } from 'react'
import { useImage, useAssetsVersion, useFontsVersion } from '../../lib/hooks'
import { makeCanvas, renderFilteredPhoto, renderPhotoScene } from '../../lib/photoRenderer'
import { FILTERS } from '../../data/filters'
import { FRAMES } from '../../data/frames'
import { getTemplate } from '../../lib/templateFrames'
import { useStudio } from '../../store/useStudio'
import { EXAMPLES } from '../../data/examples'

/** Real previews of the user's own photo with each filter preset. */
export function useFilterThumbs() {
  const photo = useStudio((s) => s.photo)
  const crop = useStudio((s) => s.crop)
  const img = useImage(photo.src || EXAMPLES[0]?.src)
  const [thumbs, setThumbs] = useState({})
  useEffect(() => {
    if (!img) return
    const t = setTimeout(() => {
      const out = {}
      FILTERS.forEach((f) => {
        const c = renderFilteredPhoto(img, f.params, crop, 132, 165, { cache: false })
        out[f.id] = c.toDataURL('image/jpeg', 0.82)
      })
      setThumbs(out)
    }, 60)
    return () => clearTimeout(t)
  }, [img, crop])
  return thumbs
}

/** Real previews of the given frames with the current photo + grading (rendered in small batches). */
export function useFrameThumbs(frames = FRAMES) {
  const photo = useStudio((s) => s.photo)
  const adj = useStudio((s) => s.adj)
  const captions = useStudio((s) => s.captions)
  const aspect = useStudio((s) => s.aspect)
  const img = useImage(photo.src || EXAMPLES[0]?.src)
  const av = useAssetsVersion()
  const fv = useFontsVersion()
  const [thumbs, setThumbs] = useState({})
  useEffect(() => {
    if (!img) return
    let t
    let i = 0
    const W = 160
    const baseH = aspect === '1:1' ? 160 : aspect === '9:16' ? 284 : 200
    const centred = { zoom: 1, x: 0, y: 0 }
    const step = () => {
      const out = {}
      const end = Math.min(frames.length, i + 10)
      for (; i < end; i++) {
        const f = frames[i]
        const tpl = f.kind === 'template' ? getTemplate(f) : null
        const H = f.kind === 'template' ? Math.round(W / (tpl ? tpl.aspect : 9 / 16)) : baseH
        const c = makeCanvas(W, H)
        renderPhotoScene(c.getContext('2d'), W, H, { image: img, adj, crop: centred, frameId: f.id, captions, layers: [] }, { cache: false })
        out[f.id] = c.toDataURL('image/jpeg', 0.85)
      }
      setThumbs((prev) => ({ ...prev, ...out }))
      if (i < frames.length) t = setTimeout(step, 16)
    }
    t = setTimeout(step, 180)
    return () => clearTimeout(t)
  }, [img, adj, captions, aspect, av, fv, frames])
  return thumbs
}
