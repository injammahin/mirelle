import { FRAMES } from '../../data/frames'
import { useStudio } from '../../store/useStudio'
import { exampleByName, exampleFor } from '../../data/examples'

/** Opens the studio on a frame, with the same portrait its preview shows (until the user adds their own photo). */
export function openFrame(id) {
  const st = useStudio.getState()
  const f = FRAMES.find((x) => x.id === id)
  const usingExample = st.photo.sampleId !== null
  const ex = (f?.meta?.photo && exampleByName(f.meta.photo)) || exampleFor(0)
  if (ex && usingExample) st.setPhoto({ src: ex.src, name: ex.name, sampleId: 'example' })
  st.setFrame(id)
  // previews frame the portrait slightly above centre to keep the face in view; match that
  if (f?.preview && usingExample) useStudio.setState((s) => ({ crop: { ...s.crop, y: -0.4 } }))
  st.setMode('photo')
  st.showToast('Frame selected — add your photo and it drops right into the card ✨')
}

export const useOpenFrame = () => openFrame
