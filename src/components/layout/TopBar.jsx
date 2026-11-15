import { LogoMark, Wordmark } from '../ui/Logo'
import { useStudio } from '../../store/useStudio'
import DownloadButton from './DownloadButton'
import Segmented from '../ui/Segmented'

const TITLES = { explore: 'Explore looks', photo: 'Photo Studio', letter: 'Letter Studio' }

export default function TopBar() {
  const mode = useStudio((s) => s.mode)
  const setMode = useStudio((s) => s.setMode)
  return (
    <header className="glass sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-sand px-3 md:h-16 md:px-6">
      <button onClick={() => setMode('explore')} className="flex min-w-0 items-center gap-2" title="Mirelle — Aesthetic Studio">
        <LogoMark size={34} className="shrink-0 md:hidden" />
        <span className="hidden sm:block md:hidden"><Wordmark compact /></span>
        <span className="hidden md:block"><Wordmark /></span>
      </button>
      <div className="hidden text-[11px] text-taupe lg:block">· {TITLES[mode]}</div>
      <div className="flex-1" />
      <Segmented
        className="w-[210px] sm:w-[300px] md:hidden"
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'explore', label: 'Explore' },
          { value: 'photo', label: 'Photo' },
          { value: 'letter', label: 'Letter' },
        ]}
      />
      <DownloadButton />
    </header>
  )
}
