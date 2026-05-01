import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { useEffect } from 'react'

export default function NewsletterList() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: newsletters, isLoading } = useQuery({
    queryKey: ['admin-newsletters'],
    queryFn: () => api.admin.newsletters.list(),
    enabled: !!user,
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.admin.newsletters.send(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] })
      alert(`Sent to ${data.sent} subscribers! (${data.failed} failed)`)
    },
    onError: (err: Error) => alert(err.message),
  })

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Newsletters</h1>
        <Link
          to="/admin/newsletters/new"
          className="px-4 py-2 bg-rust text-white text-sm font-semibold rounded-lg hover:bg-rust/90 transition-colors"
        >
          New newsletter
        </Link>
      </div>

      <div className="space-y-3">
        {newsletters?.map((nl) => (
          <div
            key={nl.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-ink/5 hover:border-ink/15 transition-colors"
          >
            <Link to={`/admin/newsletters/${nl.id}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{nl.title}</h2>
                {nl.sent_at && (
                  <span className="text-green-600 text-xs font-medium" title={`Sent ${nl.sent_at}`}>
                    Sent
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-1">/{nl.slug}</p>
            </Link>
            <div className="flex items-center gap-2 ml-4">
              {nl.status === 'published' && !nl.sent_at && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    if (!confirm('Send this newsletter to ALL subscribers? This can only be done once!')) return
                    sendMutation.mutate(nl.id)
                  }}
                  disabled={sendMutation.isPending}
                  className="text-xs px-3 py-1 rounded-full bg-rust text-white font-semibold hover:bg-rust/90 transition-colors disabled:opacity-50"
                >
                  Send to all
                </button>
              )}
              {nl.sent_at && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                  Sent {new Date(nl.sent_at).toLocaleDateString()}
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  nl.status === 'published'
                    ? 'bg-card-sage text-green-800'
                    : 'bg-card-amber text-amber-800'
                }`}
              >
                {nl.status}
              </span>
            </div>
          </div>
        ))}

        {newsletters?.length === 0 && (
          <p className="text-muted text-center py-16">
            No newsletters yet.{' '}
            <Link to="/admin/newsletters/new" className="text-rust underline">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
