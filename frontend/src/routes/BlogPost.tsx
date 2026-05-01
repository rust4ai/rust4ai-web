import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { api } from '../lib/api'

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => api.posts.get(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link to="/blog" className="text-rust underline">
          Back to blog
        </Link>
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/blog" className="text-sm text-muted hover:text-ink transition-colors mb-8 inline-block">
        &larr; Back to blog
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          {post.published_at && (
            <time className="text-sm text-muted font-mono">
              {new Date(post.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
          {post.tags.map((t) => (
            <span key={t} className="text-xs font-mono px-2 py-0.5 rounded-full bg-sand/10 text-rust">
              #{t}
            </span>
          ))}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-muted mt-4 leading-relaxed">{post.excerpt}</p>
        )}
      </header>

      {post.cover_image_url && (
        <div className="mb-10 -mx-6 sm:mx-0">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full rounded-xl shadow-md object-cover max-h-[400px]"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.body_md}
        </ReactMarkdown>
      </div>
    </article>
  )
}
