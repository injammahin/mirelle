import React from 'react'
import ReactDOM from 'react-dom/client'
import { lazy, Suspense } from 'react'
import App from './App'
import { isLetterLink } from './lib/share'
// letter links (#l=...) open the animated envelope page instead of the studio
const LetterViewer = lazy(() => import('./components/letter/LetterViewer'))
window.addEventListener('hashchange', () => /^#l=/.test(location.hash) && location.reload())
import './styles/index.css'
import './styles/textures.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLetterLink() ? (
      <Suspense fallback={<div className="h-[100dvh] bg-oat" />}>
        <LetterViewer />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
