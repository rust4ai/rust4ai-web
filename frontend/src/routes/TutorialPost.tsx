import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { api } from '../lib/api'

export default function TutorialPost() {
  const { slug } = useParams<{ slug: string }>()

  const { data: tutorial, isLoading, error } = useQuery({
    queryKey: ['tutorial', slug],
    queryFn: () => api.tutorials.get(slug!),
    enabled: !!slug,
  })

  if (isLoading) return <div className="p-8 text-muted">Loading...</div>
  if (error || !tutorial) return <div className="p-8 text-muted">Tutorial not found.</div>

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">{tutorial.title}</h1>
        {tutorial.excerpt && (
          <p className="text-lg text-muted">{tutorial.excerpt}</p>
        )}
        {tutorial.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tutorial.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 bg-ink/5 text-muted rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {tutorial.body_md}
        </ReactMarkdown>
      </div>
    </article>
  )
}
