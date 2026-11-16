import { Film, Compass, Camera, Mail, Download, Loader2 } from 'lucide-react'
import { useStudio } from '../../store/useStudio'
import { LogoMark } from '../ui/Logo'
import { useDownloadPng } from './DownloadButton'

export const NAV = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'photo', label: 'Photo Studio', icon: Camera },
  { id: 'booth', label: 'Photo Booth', icon: Film },
  { id: 'letter', label: 'Letters', icon: Mail },
]

export default function NavRail() {
  const mode = useStudio((s) => s.mode)
  const setMode = useStudio((s) => s.setMode)
  const [download, busy] = useDownloadPng()
  return (
    <nav className="hidden w-[72px] shrink-0 flex-col items-center gap-2 border-r border-sand bg-oat py-4 md:flex">
      <button onClick={() => setMode('explore')} className="mb-3 flex h-11 w-11 items-center justify-center rounded-full shadow-glow" title="Mirelle — Aesthetic Studio">
        <LogoMark size={44} />
      </button>
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = mode === id
        return (
          <button key={id} onClick={() => setMode(id)} className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${active ? 'bg-espresso text-oat' : 'text-taupe hover:bg-linen hover:text-espresso'}`} title={label}>
            <Icon size={20} />
            <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1 text-[11.5px] font-semibold text-oat opacity-0 shadow-soft transition group-hover:opacity-100">{label}</span>
          </button>
        )
      })}
      <div className="flex-1" />
      <button
        onClick={download}
        disabled={busy}
        className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-taupe transition hover:bg-linen hover:text-espresso"
        title="Download HD PNG"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
        <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg bg-espresso px-2.5 py-1 text-[11.5px] font-semibold text-oat opacity-0 shadow-soft transition group-hover:opacity-100">Download HD PNG</span>
      </button>
    </nav>
  )
}
