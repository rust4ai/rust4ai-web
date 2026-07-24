import { useState } from 'react'
import { Link } from 'react-router-dom'

const links = [
  { to: '/tutorials', label: 'Learn' },
  { to: '/projects', label: 'Featured' },
  { to: '/newsletter', label: 'Newsletter' },
  { to: 'https://metalcraftai.com', label: 'Metalcraft', external: true },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-bg border-b border-ink/5">
      <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight uppercase">
          rust4ai
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-ink mr-auto ml-16">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.to}
                href={l.to}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:opacity-60 transition-opacity"
              >
                {l.label}
                <span aria-hidden className="text-xs text-sand-dark">↗</span>
              </a>
            ) : (
              <Link key={l.to} to={l.to} className="hover:opacity-60 transition-opacity">
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-ink transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-ink transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-ink/5 px-8 py-4 flex flex-col gap-4 text-[15px] font-medium text-ink">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.to}
                href={l.to}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 hover:opacity-60 transition-opacity"
              >
                {l.label}
                <span aria-hidden className="text-xs text-sand-dark">↗</span>
              </a>
            ) : (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="hover:opacity-60 transition-opacity">
                {l.label}
              </Link>
            ),
          )}
        </nav>
      )}
    </header>
  )
}
