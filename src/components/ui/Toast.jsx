import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useStudio } from '../../store/useStudio'

export default function Toast() {
  const toast = useStudio((s) => s.toast)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: -12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} className="flex max-w-md items-center gap-2 rounded-full bg-espresso/95 px-4 py-2.5 text-[13px] font-medium text-oat shadow-lift">
            <Sparkles size={14} className="shrink-0 text-gold" />
            <span className="truncate">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
