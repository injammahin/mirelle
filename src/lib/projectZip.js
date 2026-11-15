// In-app "Download Project .zip" — bundles the full Vite + React + Tailwind source with JSZip.
import { download } from './exporter'

export async function downloadProjectZip() {
  const [{ default: JSZip }, { files }] = await Promise.all([import('jszip'), import('./projectSources.js')])
  const zip = new JSZip()
  const root = zip.folder('auracraft-aesthetic-studio')
  Object.entries(files).forEach(([path, content]) => root.file(path, content))
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  download(blob, 'auracraft-aesthetic-studio.zip')
  return Object.keys(files).length
}
