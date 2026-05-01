import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { api } from '../lib/api'

export default function TutorialPost() {
  const { slug, page } = useParams<{ slug: string; page?: string }>()
  const navigate = useNavigate()
  const currentPage = Math.max(1, parseInt(page || '1', 10))

  const { data: tutorial, isLoading, error } = useQuery({
    queryKey: ['tutorial', slug],
    queryFn: () => api.tutorials.get(slug!),
    enabled: !!slug,
  })

  if (isLoading) return <div className="p-8 text-muted">Loading...</div>
  if (error || !tutorial) return <div className="p-8 text-muted">Tutorial not found.</div>

  const hasPages = tutorial.pages && tutorial.pages.length > 0
  const totalPages = hasPages ? tutorial.pages.length : 1
  const pageData = hasPages
    ? tutorial.pages.find((p) => p.page_number === currentPage) || tutorial.pages[0]
    : null
  const content = pageData ? pageData.body_md : tutorial.body_md

  function goToPage(n: number) {
    if (n === 1) {
      navigate(`/tutorials/${slug}`)
    } else {
      navigate(`/tutorials/${slug}/${n}`)
    }
  }

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

        {/* Page navigation links */}
        {hasPages && totalPages > 1 && (
          <nav className="mt-6 p-4 bg-ink/[0.02] rounded-lg border border-ink/5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Contents</p>
            <ol className="space-y-1">
              {tutorial.pages.map((p) => (
                <li key={p.page_number}>
                  <button
                    onClick={() => goToPage(p.page_number)}
                    className={`text-sm hover:text-rust transition-colors ${
                      p.page_number === currentPage ? 'font-semibold text-rust' : 'text-muted'
                    }`}
                  >
                    {p.page_number}. {p.title || `Page ${p.page_number}`}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </header>

      {/* Page title */}
      {pageData && pageData.title && totalPages > 1 && (
        <h2 className="text-2xl font-bold mb-6">{pageData.title}</h2>
      )}

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>

      {/* Prev/Next navigation */}
      {hasPages && totalPages > 1 && (
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-ink/10">
          <div>
            {currentPage > 1 ? (
              <button
                onClick={() => goToPage(currentPage - 1)}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                <span>&larr;</span>
                <span>{tutorial.pages[currentPage - 2]?.title || `Page ${currentPage - 1}`}</span>
              </button>
            ) : (
              <span />
            )}
          </div>
          <span className="text-xs text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <div>
            {currentPage < totalPages ? (
              <button
                onClick={() => goToPage(currentPage + 1)}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                <span>{tutorial.pages[currentPage]?.title || `Page ${currentPage + 1}`}</span>
                <span>&rarr;</span>
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </article>
  )
}
