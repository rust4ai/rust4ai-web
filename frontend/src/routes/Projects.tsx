import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.projects.list(),
  })

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-16">
      <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Featured Projects</h1>
      <p className="text-lg text-muted mb-10">Open-source Rust projects advancing AI.</p>

      {isLoading && <p className="text-muted">Loading...</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects?.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.slug}`}
            className="group relative overflow-hidden rounded-xl border border-ink/5 hover:border-ink/15 hover:shadow-md transition-all aspect-[4/3] flex items-end"
          >
            {p.cover_image_url ? (
              <img
                src={p.cover_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-card-lilac to-card-sage" />
            )}
            <div className="relative z-10 w-full p-5 bg-gradient-to-t from-black/70 to-transparent">
              <h3 className="font-bold text-lg text-white group-hover:text-amber-200 transition-colors">
                {p.title}
              </h3>
              {p.excerpt && (
                <p className="text-sm text-white/80 mt-1 line-clamp-2">{p.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && projects?.length === 0 && (
        <p className="text-muted text-center py-16">No projects published yet.</p>
      )}
    </div>
  )
}
