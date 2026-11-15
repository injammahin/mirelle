import { motion, AnimatePresence } from 'framer-motion'
import { useId } from 'react'

export default function Tabs({ tabs, value, onChange }) {
  const id = useId()
  const current = tabs.find((t) => t.id === value) || tabs[0]
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="no-scrollbar flex overflow-x-auto border-b border-sand px-2">
        {tabs.map((t) => {
          const active = t.id === current.id
          return (
            <button key={t.id} onClick={() => onChange(t.id)} className={`relative flex min-w-[52px] flex-1 flex-col items-center gap-1 px-1.5 pb-2.5 pt-3 text-[11px] font-semibold transition-colors ${active ? 'text-espresso' : 'text-taupe hover:text-espresso'}`}>
              {t.icon}
              {t.label}
              {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-terracotta" />}
            </button>
          )
        })}
      </div>
      <div className="soft-scroll min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="p-4">
            {current.render()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
