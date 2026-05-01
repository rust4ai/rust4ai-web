import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import { useEffect } from 'react'

export default function Subscribers() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => api.admin.subscribers.list(),
    enabled: !!user,
  })

  async function handleExport() {
    const res = await api.admin.subscribers.exportCsv()
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/80 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card-sage rounded-xl p-5 text-center">
            <p className="text-3xl font-bold">{data.counts.confirmed}</p>
            <p className="text-sm text-ink/70 mt-1">Confirmed</p>
          </div>
          <div className="bg-card-amber rounded-xl p-5 text-center">
            <p className="text-3xl font-bold">{data.counts.pending}</p>
            <p className="text-sm text-ink/70 mt-1">Pending</p>
          </div>
          <div className="bg-card-rose rounded-xl p-5 text-center">
            <p className="text-3xl font-bold">{data.counts.unsubscribed}</p>
            <p className="text-sm text-ink/70 mt-1">Unsubscribed</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-ink/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/5">
              <th className="text-left px-4 py-3 font-medium text-muted">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {data?.subscribers.map((sub) => (
              <tr key={sub.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{sub.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      sub.status === 'confirmed'
                        ? 'bg-card-sage text-green-800'
                        : sub.status === 'pending'
                          ? 'bg-card-amber text-amber-800'
                          : 'bg-card-rose text-red-800'
                    }`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {new Date(sub.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
