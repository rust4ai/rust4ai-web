import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Spice desert night palette
        bg: '#F2EFE8',           // warm off-white page bg (like Huddle)
        ink: '#0E0E10',          // near-black text
        muted: '#6B6B6F',        // secondary text
        night: '#141B2D',        // dark navy sky
        'night-light': '#1C2640', // lighter navy
        sand: '#D4A547',         // golden sand primary
        'sand-light': '#E5C878', // light gold
        'sand-dark': '#8B6914',  // deep sand/brown
        moon: '#F5E6B8',         // crescent moon glow
        dune: '#A07B2E',         // mid-tone dune
        rust: '#CE422B',         // accent for CTAs

        // Card tints (Huddle-style pastels, spice-tinted)
        'card-sage': '#C8D4C5',
        'card-lilac': '#D4CBE0',
        'card-rose': '#E5BFC0',
        'card-amber': '#E5C896',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
