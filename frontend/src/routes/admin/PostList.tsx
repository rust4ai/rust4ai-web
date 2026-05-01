import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { useEffect } from 'react'

export default function PostList() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => api.admin.posts.list(),
    enabled: !!user,
  })

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => api.admin.posts.toggleFeatured(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] }),
    onError: (err: Error) => alert(err.message),
  })

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  const featuredCount = posts?.filter((p) => p.featured).length ?? 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink transition-colors mb-4 inline-block">&larr; Dashboard</Link>
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
          <div
            key={post.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-ink/5 hover:border-ink/15 transition-colors"
          >
            <Link to={`/admin/posts/${post.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{post.title}</h2>
                {post.featured && (
                  <span className="text-amber-500 text-sm" title="Featured">
                    &#9733;
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-1">/{post.slug}</p>
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (!post.featured && featuredCount >= 4) {
                    alert('Maximum 4 featured posts. Unfeature one first.')
                    return
                  }
                  toggleFeatured.mutate(post.id)
                }}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  post.featured
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-ink/10 text-muted hover:border-ink/20'
                }`}
                title={post.featured ? 'Remove from featured' : 'Add to featured'}
              >
                {post.featured ? '&#9733; Featured' : '&#9734; Feature'}
              </button>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  post.status === 'published'
                    ? 'bg-card-sage text-green-800'
                    : 'bg-card-amber text-amber-800'
                }`}
              >
                {post.status}
              </span>
            </div>
          </div>
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
