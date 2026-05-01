import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Tutorials() {
  const { data: tutorials, isLoading } = useQuery({
    queryKey: ['tutorials'],
    queryFn: () => api.tutorials.list(),
  })

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <a
        href="https://www.youtube.com/channel/UCT5iK89Xx-q6-GWcj2VGCHg"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-6 p-6 mb-12 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1a1008] to-[#2a1a0a] border border-amber-900/30 hover:border-amber-700/50 hover:shadow-lg hover:shadow-amber-900/20 transition-all group"
      >
        <img
          src="/youtube-banner.png"
          alt=""
          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <p className="font-extrabold text-xl text-amber-100 group-hover:text-amber-50 transition-colors">
            Also learn on YouTube
          </p>
          <p className="text-sm text-amber-200/60 mt-1">
            Watch video tutorials, walkthroughs, and deep dives on our channel.
          </p>
        </div>
        <span className="text-amber-400/60 group-hover:text-amber-300 transition-colors text-2xl">&rarr;</span>
      </a>

      <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Learn</h1>
      <p className="text-lg text-muted mb-10">Tutorials and guides for building AI with Rust.</p>

      {isLoading && <p className="text-muted">Loading...</p>}

      <div className="space-y-4">
        {tutorials?.map((t) => (
          <Link
            key={t.id}
            to={`/tutorials/${t.slug}`}
            className="flex items-start gap-5 p-5 bg-white rounded-xl border border-ink/5 hover:border-ink/15 hover:shadow-sm transition-all group"
          >
            {t.cover_image_url && (
              <img
                src={t.cover_image_url}
                alt=""
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg group-hover:text-rust transition-colors">
                {t.title}
              </h2>
              {t.excerpt && (
                <p className="text-sm text-muted mt-1 line-clamp-2">{t.excerpt}</p>
              )}
              {t.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-ink/5 text-muted rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}

        {!isLoading && tutorials?.length === 0 && (
          <p className="text-muted text-center py-16">No tutorials published yet.</p>
        )}
      </div>
    </div>
  )
}
