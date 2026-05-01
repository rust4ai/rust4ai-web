import { Link } from 'react-router-dom'
import type { TutorialSummary } from '../lib/api'

interface Props {
  tutorials: TutorialSummary[]
}

export default function FeaturedTutorials({ tutorials }: Props) {
  if (tutorials.length === 0) return null

  return (
    <section className="bg-ink/[0.03] py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-10 tracking-tight">
          Level up your Rust + AI skills
        </h2>
        <div className="space-y-4">
          {tutorials.map((t) => (
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
                <h3 className="font-bold text-lg group-hover:text-rust transition-colors">
                  {t.title}
                </h3>
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
        </div>
      </div>
    </section>
  )
}
