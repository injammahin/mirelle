/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        oat: '#FAF7F2',
        linen: '#F3EDE2',
        terracotta: { DEFAULT: '#C87D65', dark: '#B06A53', light: '#EBCBBE' },
        sage: { DEFAULT: '#8FA38A', dark: '#73876E', light: '#DCE3D7' },
        espresso: '#2C2523',
        taupe: '#7A6F6B',
        sand: '#E6DEC8',
        gold: '#D4A85A',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        script: ['Caveat', 'cursive'],
        hand: ['"Nothing You Could Do"', 'cursive'],
        type: ['"Courier Prime"', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(44,37,35,.04), 0 8px 24px -10px rgba(44,37,35,.14)',
        lift: '0 30px 60px -25px rgba(44,37,35,.38), 0 8px 18px -10px rgba(44,37,35,.18)',
        glow: '0 0 0 1px rgba(200,125,101,.25), 0 10px 30px -6px rgba(200,125,101,.6)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
