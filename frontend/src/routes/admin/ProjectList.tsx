import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { useEffect } from 'react'

export default function ProjectList() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => api.admin.projects.list(),
    enabled: !!user,
  })

  const toggleFeatured = useMutation({
    mutationFn: (id: string) => api.admin.projects.toggleFeatured(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-projects'] }),
    onError: (err: Error) => alert(err.message),
  })

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link
          to="/admin/projects/new"
          className="px-4 py-2 bg-rust text-white text-sm font-semibold rounded-lg hover:bg-rust/90 transition-colors"
        >
          New project
        </Link>
      </div>

      <div className="space-y-3">
        {projects?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-ink/5 hover:border-ink/15 transition-colors"
          >
            <Link to={`/admin/projects/${p.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{p.title}</h2>
                {p.featured && (
                  <span className="text-amber-500 text-sm" title="Featured">&#9733;</span>
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-1">/{p.slug}</p>
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleFeatured.mutate(p.id)
                }}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  p.featured
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-ink/10 text-muted hover:border-ink/20'
                }`}
                title={p.featured ? 'Remove from featured' : 'Add to featured'}
              >
                {p.featured ? '★ Featured' : '☆ Feature'}
              </button>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  p.status === 'published'
                    ? 'bg-card-sage text-green-800'
                    : 'bg-card-amber text-amber-800'
                }`}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}

        {projects?.length === 0 && (
          <p className="text-muted text-center py-16">
            No projects yet.{' '}
            <Link to="/admin/projects/new" className="text-rust underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
