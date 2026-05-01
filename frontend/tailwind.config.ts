import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

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
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#0E0E10',
            '--tw-prose-headings': '#0E0E10',
            '--tw-prose-links': '#8B6914',
            '--tw-prose-bold': '#0E0E10',
            '--tw-prose-quotes': '#6B6B6F',
            '--tw-prose-quote-borders': '#D4A547',
            '--tw-prose-code': '#0E0E10',
            '--tw-prose-hr': '#D4A547',
            'h1, h2, h3, h4': {
              fontWeight: '700',
              letterSpacing: '-0.02em',
            },
            a: {
              color: '#8B6914',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              '&:hover': {
                color: '#D4A547',
              },
            },
            blockquote: {
              borderLeftColor: '#D4A547',
              color: '#6B6B6F',
              fontStyle: 'normal',
            },
            pre: {
              backgroundColor: '#141B2D',
              color: '#F5E6B8',
              borderRadius: '0.5rem',
              padding: '1rem',
              overflowX: 'auto',
            },
            code: {
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '0.875em',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            img: {
              borderRadius: '0.75rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              marginTop: '2em',
              marginBottom: '2em',
            },
            table: {
              fontSize: '0.875em',
            },
            'thead th': {
              color: '#0E0E10',
              fontWeight: '600',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config
