export default function Footer() {
  return (
    <footer className="border-t border-ink/5 py-10 mt-20">
      <div className="max-w-[1400px] mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <span className="font-mono tracking-tight">&copy; {new Date().getFullYear()} rust4ai</span>
        <div className="flex gap-8">
          <a href="https://github.com/rust4ai" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
            GitHub
          </a>
          <a href="https://twitter.com/rust4ai" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  )
}
