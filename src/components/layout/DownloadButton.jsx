import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { downloadBestPng } from '../../lib/exporter'

/** Downloads the current design as a high-resolution PNG. */
export function useDownloadPng() {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    if (busy) return
    const st = useStudio.getState()
    setBusy(true)
    st.showToast('Rendering your HD PNG…')
    try {
      await new Promise((r) => setTimeout(r, 30))
      const out = await downloadBestPng(st, st.mode === 'letter' ? 'letter' : 'photo')
      if (!out.pending) st.showToast(`Saved ${out.w}×${out.h} PNG ✨`)
    } catch (e) {
      st.showToast(e.message || 'Download failed')
    } finally {
      setBusy(false)
    }
  }
  return [run, busy]
}

export default function DownloadButton() {
  const [run, busy] = useDownloadPng()
  return (
    <>
      <button onClick={run} disabled={busy} className="hidden h-9 items-center gap-1.5 rounded-full bg-terracotta px-4 text-[12.5px] font-semibold text-white shadow-glow transition hover:brightness-105 disabled:opacity-70 md:inline-flex">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download PNG
      </button>
      <button onClick={run} disabled={busy} title="Download HD PNG" className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta text-white shadow-glow disabled:opacity-70 md:hidden">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={16} />}
      </button>
    </>
  )
}
