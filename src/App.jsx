import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Camera, Mail } from 'lucide-react'
import { useStudio } from './store/useStudio'
import NavRail from './components/layout/NavRail'
import TopBar from './components/layout/TopBar'
import ExploreBoard from './components/layout/ExploreBoard'
import { lazy, Suspense, useEffect } from 'react'
// the editor is split out so the home gallery loads light and fast
const StudioLayout = lazy(() => import('./components/layout/StudioLayout'))
import Toast from './components/ui/Toast'
import SaveSheet from './components/ui/SaveSheet'

function ExploreDock() {
  const mode = useStudio((s) => s.mode)
  const setMode = useStudio((s) => s.setMode)
  const items = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'photo', label: 'Studio', icon: Camera },
    { id: 'letter', label: 'Letters', icon: Mail },
  ]
  return (
    <nav className="glass safe-bottom fixed inset-x-3 bottom-3 z-40 rounded-full border border-sand shadow-lift md:hidden">
      <div className="flex justify-around p-1.5">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMode(id)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${mode === id ? 'bg-espresso text-oat' : 'text-taupe'}`}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  // warm the editor chunk once the home page is idle, so tapping a frame opens instantly
  useEffect(() => {
    const go = () => import('./components/layout/StudioLayout')
    const id = window.requestIdleCallback ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1500)
    return () => (window.cancelIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [])
  const mode = useStudio((s) => s.mode)
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-oat">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <AnimatePresence mode="wait">
          <motion.div key={mode === 'explore' ? 'explore' : 'studio'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex min-h-0 flex-1 flex-col">
            {mode === 'explore' ? (
              <ExploreBoard />
            ) : (
              <Suspense fallback={<div className="flex h-full items-center justify-center text-[13px] text-taupe">Opening studio…</div>}>
                <StudioLayout />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {mode === 'explore' && <ExploreDock />}
      <Toast />
      <SaveSheet />
      <div className="grain-overlay" />
    </div>
  )
}
