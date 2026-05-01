import { useNavigate, Link } from 'react-router-dom'
import { useSession, signOut } from '../../lib/auth'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user, loading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
  }, [user, loading, navigate])

  if (loading) return <div className="p-8 text-muted">Loading...</div>
  if (!user) return null

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Signed in as <span className="font-mono">{user.email}</span>
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut()
            navigate('/admin/login')
          }}
          className="text-sm text-muted hover:text-ink transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/posts"
          className="block p-6 bg-card-lilac rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Posts</h2>
          <p className="text-sm text-ink/70">Create, edit, and publish blog posts.</p>
        </Link>
        <Link
          to="/admin/tutorials"
          className="block p-6 bg-card-sage rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Tutorials</h2>
          <p className="text-sm text-ink/70">Create and manage Rust + AI tutorials.</p>
        </Link>
        <Link
          to="/admin/projects"
          className="block p-6 bg-card-amber rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Projects</h2>
          <p className="text-sm text-ink/70">Showcase featured Rust AI projects.</p>
        </Link>
        <Link
          to="/admin/newsletters"
          className="block p-6 bg-card-rose rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Newsletters</h2>
          <p className="text-sm text-ink/70">Write and blast newsletters to subscribers.</p>
        </Link>
        <Link
          to="/admin/subscribers"
          className="block p-6 bg-white border border-ink/10 rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Subscribers</h2>
          <p className="text-sm text-ink/70">View and export newsletter subscribers.</p>
        </Link>
        <Link
          to="/admin/media"
          className="block p-6 bg-white border border-ink/10 rounded-2xl hover:scale-[1.02] transition-transform"
        >
          <h2 className="font-bold text-lg mb-1">Media</h2>
          <p className="text-sm text-ink/70">Upload and manage images for content.</p>
        </Link>
      </div>
    </div>
  )
}
