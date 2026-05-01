import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <header className="bg-bg border-b border-ink/5">
      <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight uppercase">
          rust4ai
        </Link>
        <nav className="flex items-center gap-8 text-[15px] font-medium text-ink mr-auto ml-16">
          <Link to="/tutorials" className="hover:opacity-60 transition-opacity">
            Learn
          </Link>
          <Link to="/projects" className="hover:opacity-60 transition-opacity">
            Featured
          </Link>
          <Link to="/newsletter" className="hover:opacity-60 transition-opacity">
            Newsletter
          </Link>
        </nav>
      </div>
    </header>
  )
}
