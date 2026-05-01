import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <p className="text-muted text-lg mb-8">This page doesn't exist. Klaw looked everywhere.</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-rust text-white font-semibold rounded-lg hover:bg-rust/90 transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
