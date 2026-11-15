// Every source file of this project, bundled as raw text (lazy-loaded chunk).
import pkg from '../../package.json?raw'
import viteConfig from '../../vite.config.js?raw'
import tailwindConfig from '../../tailwind.config.js?raw'
import postcssConfig from '../../postcss.config.js?raw'
import indexHtml from '../../index.html?raw'
import readme from '../../README.md?raw'

const src = import.meta.glob('/src/**/*.{js,jsx,css,scss}', { query: '?raw', import: 'default', eager: true })

export const files = {
  'package.json': pkg,
  'vite.config.js': viteConfig,
  'tailwind.config.js': tailwindConfig,
  'postcss.config.js': postcssConfig,
  'index.html': indexHtml,
  'README.md': readme,
  '.gitignore': 'node_modules\ndist\n.DS_Store\n*.log\n',
  ...Object.fromEntries(Object.entries(src).map(([path, code]) => [path.replace(/^\//, ''), code])),
}
