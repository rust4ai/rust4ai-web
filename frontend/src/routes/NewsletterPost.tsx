import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { api } from '../lib/api'

export default function NewsletterPost() {
  const { slug } = useParams<{ slug: string }>()

  const { data: newsletter, isLoading, error } = useQuery({
    queryKey: ['newsletter', slug],
    queryFn: () => api.newsletters.get(slug!),
    enabled: !!slug,
  })

  if (isLoading) return <div className="p-8 text-muted">Loading...</div>
  if (error || !newsletter) return <div className="p-8 text-muted">Newsletter not found.</div>

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">{newsletter.title}</h1>
        {newsletter.published_at && (
          <p className="text-sm text-muted">
            {new Date(newsletter.published_at).toLocaleDateString()}
          </p>
        )}
      </header>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {newsletter.body_md}
        </ReactMarkdown>
      </div>
    </article>
  )
}
