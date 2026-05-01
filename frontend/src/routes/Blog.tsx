import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function Blog() {
  const [searchParams] = useSearchParams()
  const tag = searchParams.get('tag') ?? undefined

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', tag],
    queryFn: () => api.posts.list({ tag }),
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">Blog</h1>
      <p className="text-muted mb-10">Rust + AI deep-dives, tutorials, and updates.</p>

      {isLoading && <p className="text-muted">Loading...</p>}

      <div className="space-y-6">
        {posts?.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="block p-6 rounded-2xl bg-white border border-ink/5 hover:border-ink/15 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              {post.published_at && (
                <time className="text-xs text-muted font-mono">
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              )}
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-mono text-rust">
                  #{t}
                </span>
              ))}
            </div>
            <h2 className="text-xl font-bold">{post.title}</h2>
            {post.excerpt && (
              <p className="text-muted mt-2 text-sm leading-relaxed">{post.excerpt}</p>
            )}
          </Link>
        ))}

        {posts?.length === 0 && (
          <p className="text-muted text-center py-16">No posts yet. Check back soon!</p>
        )}
      </div>
    </div>
  )
}
