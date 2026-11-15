import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Maximize2, X, Home } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { useMediaQuery } from '../../lib/hooks'
import { ASPECTS } from '../../data/filters'
import Tabs from '../ui/Tabs'
import MagicBar from './MagicBar'
import PhotoStage from '../photo/PhotoStage'
import LetterStage from '../letter/LetterStage'
import { PHOTO_TOOLS, LETTER_TOOLS, toTabs } from './tools'

function ZoomBar() {
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const aspect = useStudio((s) => s.aspect)
  const setAspect = useStudio((s) => s.setAspect)
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden justify-center md:flex">
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full border border-sand p-1 shadow-soft">
        {Object.keys(ASPECTS).map((k) => (
          <button key={k} onClick={() => setAspect(k)} className={`h-8 rounded-full px-3 text-[11.5px] font-bold transition ${aspect === k ? 'bg-espresso text-oat' : 'text-taupe hover:text-espresso'}`}>
            {k}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-sand" />
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-espresso hover:bg-linen" onClick={() => setZoom(zoom - 0.1)} title="Zoom out">
          <Minus size={15} />
        </button>
        <span className="w-12 text-center text-[12px] font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-espresso hover:bg-linen" onClick={() => setZoom(zoom + 0.1)} title="Zoom in">
          <Plus size={15} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full text-espresso hover:bg-linen" onClick={() => setZoom(1)} title="Fit to screen">
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function StudioLayout() {
  const mode = useStudio((s) => s.mode)
  const setMode = useStudio((s) => s.setMode)
  const selectedId = useStudio((s) => s.selectedId)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isMd = useMediaQuery('(min-width: 768px)')
  const tools = mode === 'letter' ? LETTER_TOOLS : PHOTO_TOOLS
  const leftTools = isLg ? tools.filter((t) => t.side === 'left') : tools
  const rightTools = tools.filter((t) => t.side === 'right')

  const [leftTab, setLeftTab] = useState(tools[0].id)
  const [rightTab, setRightTab] = useState(rightTools[0].id)
  const [sheet, setSheet] = useState(null)
  // swipe-down-to-close for the mobile sheet
  const [sheetDrag, setSheetDrag] = useState(0)
  const dragStart = useRef(null)
  const startSheetDrag = (e) => {
    dragStart.current = { y: e.clientY, t: Date.now() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveSheetDrag = (e) => {
    if (!dragStart.current) return
    setSheetDrag(Math.max(0, e.clientY - dragStart.current.y))
  }
  const endSheetDrag = (e) => {
    if (!dragStart.current) return
    const dy = e.clientY - dragStart.current.y
    const fast = dy > 30 && dy / Math.max(1, Date.now() - dragStart.current.t) > 0.5
    dragStart.current = null
    setSheetDrag(0)
    if (dy > 70 || fast) setSheet(null)
  }

  useEffect(() => {
    setLeftTab(tools[0].id)
    setRightTab(rightTools[0].id)
    setSheet(null)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // jump to the layer inspector when something gets selected
  useEffect(() => {
    if (!selectedId || mode !== 'photo') return
    if (isLg) setRightTab('layers')
    else if (isMd) setLeftTab('layers')
    else setSheet((s) => (s ? 'layers' : s))
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const sheetTool = tools.find((t) => t.id === sheet)

  return (
    <div className="flex min-h-0 flex-1">
      {/* left catalog column (md+) */}
      <aside className="hidden w-[310px] shrink-0 border-r border-sand bg-oat md:block xl:w-[340px]">
        <Tabs tabs={toTabs(leftTools)} value={leftTab} onChange={setLeftTab} />
      </aside>

      {/* center canvas */}
      <main className="flex min-w-0 flex-1 flex-col">
        <MagicBar />
        <div className="relative min-h-0 flex-1">
          {mode === 'letter' ? <LetterStage /> : <PhotoStage />}
          <ZoomBar />
        </div>

        {/* mobile bottom sheet */}
        <AnimatePresence initial={false}>
          {sheetTool && (
            <motion.div key="sheet" initial={{ height: 0 }} animate={{ height: '46dvh' }} exit={{ height: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} className="glass overflow-hidden rounded-t-[26px] border-t border-sand shadow-[0_-12px_40px_-20px_rgba(44,37,35,.35)] md:hidden" style={{ transform: sheetDrag ? `translateY(${sheetDrag}px)` : undefined, transition: sheetDrag ? 'none' : 'transform .2s ease' }}>
              <div className="flex h-full flex-col">
                {/* swipe this header down to close */}
                <div className="touch-none" onPointerDown={startSheetDrag} onPointerMove={moveSheetDrag} onPointerUp={endSheetDrag} onPointerCancel={endSheetDrag}>
                <div className="flex cursor-grab items-center justify-between px-4 pb-1.5 pt-2.5">
                  <span className="mx-auto h-1.5 w-12 rounded-full bg-sand" />
                </div>
                <div className="flex items-center justify-between px-4 pb-2">
                  <h2 className="font-serif text-[18px]">{sheetTool.label}</h2>
                  <button className="icon-btn h-8 w-8" onPointerDown={(e) => e.stopPropagation()} onClick={() => setSheet(null)}>
                    <X size={15} />
                  </button>
                </div>
                </div>
                <div className="soft-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <motion.div key={sheetTool.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                    {sheetTool.render()}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* mobile dock */}
        <nav className="glass safe-bottom border-t border-sand md:hidden">
          <div className="no-scrollbar flex items-stretch gap-0.5 overflow-x-auto px-1.5 py-1.5">
            <button onClick={() => setMode('explore')} className="flex min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-taupe">
              <Home size={19} />
              <span className="text-[10px] font-semibold">Explore</span>
            </button>
            <span className="my-2 w-px shrink-0 bg-sand" />
            {tools.map((t) => {
              const Icon = t.icon
              const active = sheet === t.id
              return (
                <button key={t.id} onClick={() => setSheet(active ? null : t.id)} className={`relative flex min-w-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition ${active ? 'bg-espresso text-oat' : 'text-espresso'}`}>
                  <Icon size={19} />
                  <span className="text-[10px] font-semibold">{t.label}</span>
                  {t.id === 'layers' && selectedId && !active && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-terracotta" />}
                </button>
              )
            })}
          </div>
        </nav>
      </main>

      {/* right inspector (lg+) */}
      <aside className="hidden w-[330px] shrink-0 border-l border-sand bg-oat lg:block xl:w-[350px]">
        <Tabs tabs={toTabs(rightTools)} value={rightTab} onChange={setRightTab} />
      </aside>
    </div>
  )
}
