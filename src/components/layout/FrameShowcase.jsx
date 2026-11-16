import { useStudio } from '../../store/useStudio'

/** Opens the studio on a frame. The photo slot stays empty until the user adds their own photo. */
export function openFrame(id) {
  const st = useStudio.getState()
  st.setFrame(id)
  st.setMode('photo')
  st.showToast(st.photo.src ? 'Frame selected ✨' : 'Frame selected — tap “Add photo” to drop yours in ✨')
}

export const useOpenFrame = () => openFrame
