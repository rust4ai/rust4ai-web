import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import NewsletterForm from '../components/NewsletterForm'

export default function Newsletters() {
  const { data: newsletters, isLoading } = useQuery({
    queryKey: ['newsletters'],
    queryFn: () => api.newsletters.list(),
  })

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <div className="mb-12 rounded-2xl bg-card-sage/40 border border-ink/5 p-8">
        <p className="font-extrabold text-xl mb-2">Stay in the loop</p>
        <p className="text-sm text-muted mb-5">
          Get the latest Rust + AI tutorials, project highlights, and community news delivered to your inbox.
        </p>
        <div className="max-w-lg">
          <NewsletterForm />
        </div>
      </div>

      <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Newsletter</h1>
      <p className="text-lg text-muted mb-10">Past newsletter issues. Subscribe to get them in your inbox.</p>

      {isLoading && <p className="text-muted">Loading...</p>}

      <div className="space-y-4">
        {newsletters?.map((nl) => (
          <Link
            key={nl.id}
            to={`/newsletter/${nl.slug}`}
            className="block p-5 bg-white rounded-xl border border-ink/5 hover:border-ink/15 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg group-hover:text-rust transition-colors">
                {nl.title}
              </h2>
              {nl.published_at && (
                <span className="text-xs text-muted">
                  {new Date(nl.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {nl.excerpt && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{nl.excerpt}</p>
            )}
          </Link>
        ))}

        {!isLoading && newsletters?.length === 0 && (
          <p className="text-muted text-center py-16">No newsletters published yet.</p>
        )}
      </div>
    </div>
  )
}
