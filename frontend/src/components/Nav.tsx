import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="bg-bg border-b border-ink/5">
      <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight uppercase">
          rust4ai
        </Link>
        <nav className="flex items-center gap-8 text-[15px] font-medium text-ink">
          <Link to="/blog" className="hover:opacity-60 transition-opacity">
            Blog
          </Link>
          <a
            href="https://youtube.com/@rust4ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-60 transition-opacity"
          >
            YouTube
          </a>
        </nav>
      </div>
    </header>
  )
}
