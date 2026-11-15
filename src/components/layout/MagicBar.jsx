import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Undo2, Redo2, Lightbulb } from 'lucide-react'
import { FRAME_MAP } from '../../data/frames'
import { STICKER_MAP } from '../../data/stickers'
import { loadTemplate, templateAspect } from '../../lib/templateFrames'
import { prepareSticker } from '../../lib/imageStickers'
import VibeIcon from '../ui/VibeIcon'
import { VIBES } from '../../data/vibes'
import { PROMPTS } from '../../data/letter'
import { useStudio } from '../../store/useStudio'
import { createLetterRecipe, createRecipe, pickAutoFrame, autoStickerIds, createAutoRecipe } from '../../lib/magic'
import { pick, uid } from '../../lib/random'

function Burst({ bursts }) {
  return (
    <AnimatePresence>
      {bursts.map((b) => (
        <motion.span key={b.id} className="pointer-events-none absolute inset-0 z-20" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1, delay: 0.3 }}>
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2
            const d = 46 + (i % 3) * 18
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 text-[13px]"
                style={{ color: i % 2 ? '#D4A85A' : '#C87D65' }}
                initial={{ x: 0, y: 0, scale: 0.2, rotate: 0 }}
                animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 1, rotate: 180 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
              >
                {i % 3 === 0 ? '✦' : i % 3 === 1 ? '✧' : '•'}
              </motion.span>
            )
          })}
        </motion.span>
      ))}
    </AnimatePresence>
  )
}

export default function MagicBar() {
  const mode = useStudio((s) => s.mode)
  const vibe = useStudio((s) => s.vibe)
  const setVibe = useStudio((s) => s.setVibe)
  const historyLen = useStudio((s) => s.history.length)
  const futureLen = useStudio((s) => s.future.length)
  const [bursts, setBursts] = useState([])

  const go = () => {
    const st = useStudio.getState()
    const id = uid()
    setBursts((b) => [...b, { id }])
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
    if (mode === 'letter') {
      const r = createLetterRecipe(vibe)
      st.setLetter({ ...r, seal: { ...st.letter.seal, ...r.seal } })
      useStudio.setState((s) => ({ magicTick: s.magicTick + 1 }))
      st.showToast(`Stationery styled · ${VIBES.find((v) => v.id === vibe).name}`)
    } else {
      const frameId = pickAutoFrame(vibe, st.frameId)
      if (!frameId) {
        const r = createRecipe(vibe, st.aspect)
        st.applyRecipe(r)
        st.showToast(r.summary)
        return
      }
      // load the frame + stickers first so placement uses their real sizes
      const frame = FRAME_MAP[frameId]
      const stickerIds = autoStickerIds(vibe)
      Promise.all([loadTemplate(frame), ...stickerIds.map((id) => prepareSticker(STICKER_MAP[id]))])
        .catch(() => {})
        .then(() => {
          const r = createAutoRecipe(vibe, frameId, templateAspect(frame), stickerIds)
          useStudio.getState().applyRecipe(r)
          useStudio.getState().showToast(r.summary)
        })
    }
  }

  const prompt = () => {
    const st = useStudio.getState()
    const p = pick(PROMPTS)
    st.showToast(`Prompt: ${p}`)
    st.setLetter({ body: `${st.letter.body.trim()}\n\n${p} ` })
  }

  return (
    <div className="flex items-center gap-2 border-b border-sand/80 bg-oat/80 px-3 py-2 md:px-5 md:py-3">
      <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
        {VIBES.map((v) => (
          <button key={v.id} onClick={() => setVibe(v.id)} className={`chip ${vibe === v.id ? 'chip-active' : ''}`}>
            <VibeIcon id={v.id} />
            {v.name}
          </button>
        ))}
      </div>
      {mode === 'photo' && (
        <div className="hidden items-center gap-1 sm:flex">
          <button className="icon-btn" onClick={() => useStudio.getState().undo()} disabled={!historyLen} title="Undo (Ctrl+Z)">
            <Undo2 size={15} />
          </button>
          <button className="icon-btn" onClick={() => useStudio.getState().redo()} disabled={!futureLen} title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={15} />
          </button>
        </div>
      )}
      {mode === 'letter' && (
        <button className="icon-btn hidden sm:inline-flex" onClick={prompt} title="Poetic prompt generator">
          <Lightbulb size={15} />
        </button>
      )}
      <div className="relative shrink-0">
        <Burst bursts={bursts} />
        <motion.button whileTap={{ scale: 0.94 }} onClick={go} className="magic-btn btn h-10 px-4 text-white md:px-5">
          <Sparkles size={16} className="relative z-10" />
          <span className="relative z-10 hidden min-[370px]:inline">Auto</span>
        </motion.button>
      </div>
    </div>
  )
}
