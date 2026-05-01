import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { api } from '../lib/api'

export default function ProjectPost() {
  const { slug } = useParams<{ slug: string }>()

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => api.projects.get(slug!),
    enabled: !!slug,
  })

  if (isLoading) return <div className="p-8 text-muted">Loading...</div>
  if (error || !project) return <div className="p-8 text-muted">Project not found.</div>

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">{project.title}</h1>
        {project.excerpt && (
          <p className="text-lg text-muted">{project.excerpt}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-rust hover:underline font-medium"
            >
              View Repository
            </a>
          )}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-ink/5 text-muted rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {project.body_md}
        </ReactMarkdown>
      </div>
    </article>
  )
}
