import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { useEffect } from 'react'

export default function PostList() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => api.admin.posts.list(),
    enabled: !!user,
  })

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="px-4 py-2 bg-rust text-white text-sm font-semibold rounded-lg hover:bg-rust/90 transition-colors"
        >
          New post
        </Link>
      </div>

      <div className="space-y-3">
        {posts?.map((post) => (
          <Link
            key={post.id}
            to={`/admin/posts/${post.id}`}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-ink/5 hover:border-ink/15 transition-colors"
          >
            <div>
              <h2 className="font-semibold">{post.title}</h2>
              <p className="text-xs text-muted font-mono mt-1">/{post.slug}</p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                post.status === 'published'
                  ? 'bg-card-sage text-green-800'
                  : 'bg-card-amber text-amber-800'
              }`}
            >
              {post.status}
            </span>
          </Link>
        ))}

        {posts?.length === 0 && (
          <p className="text-muted text-center py-16">
            No posts yet.{' '}
            <Link to="/admin/posts/new" className="text-rust underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
