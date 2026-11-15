import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, ImageDown, X } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { download, saveToPhotos } from '../../lib/exporter'

/**
 * Mobile: after rendering, the share sheet needs a fresh tap. This sheet shows the finished
 * image and a "Save to Photos" button (share sheet -> "Save Image" puts it in the gallery).
 */
export default function SaveSheet() {
  const ready = useStudio((s) => s.readyExport)
  const close = () => useStudio.getState().setReadyExport(null)
  const url = useMemo(() => (ready ? URL.createObjectURL(ready.blob) : null), [ready])
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])

  const save = async () => {
    const ok = await saveToPhotos(ready)
    if (ok) {
      useStudio.getState().showToast('Saved ✨')
      close()
    }
  }

  return (
    <AnimatePresence>
      {ready && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-[28px] bg-oat p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-lift sm:rounded-[28px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-[20px] text-espresso">Your image is ready</h2>
              <button className="icon-btn h-8 w-8" onClick={close} aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="mx-auto mb-4 flex max-h-[46dvh] justify-center overflow-hidden rounded-2xl bg-linen">
              <img src={url} alt="Your design" className="max-h-[46dvh] w-auto object-contain" />
            </div>
            <button onClick={save} className="btn-primary h-12 w-full text-[15px]">
              <ImageDown size={18} /> Save to Photos
            </button>
            <p className="mt-2 text-center text-[11.5px] text-taupe">In the share menu, choose “Save Image” to add it to your gallery.</p>
            <button
              onClick={() => {
                download(ready.blob, ready.name)
                close()
              }}
              className="btn-ghost mt-3 h-10 w-full text-[13px]"
            >
              <Download size={15} /> Save as file instead
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
