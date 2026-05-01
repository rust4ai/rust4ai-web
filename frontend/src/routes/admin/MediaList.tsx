import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/auth'
import { api, MediaItem } from '../../lib/api'
import ImageUpload from '../../components/ImageUpload'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaList() {
  const { user, loading: authLoading } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-media'],
    queryFn: () => api.admin.media.list(),
    enabled: !!user,
  })

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.filename}"?`)) return
    try {
      await api.admin.media.delete(item.id)
      queryClient.invalidateQueries({ queryKey: ['admin-media'] })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  if (authLoading || isLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink transition-colors mb-4 inline-block">&larr; Dashboard</Link>
      <h1 className="text-3xl font-bold mb-8">Media Library</h1>

      <div className="mb-8 max-w-sm">
        <ImageUpload
          label="Upload new image"
          onUploaded={() => queryClient.invalidateQueries({ queryKey: ['admin-media'] })}
        />
      </div>

      {items && items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border border-ink/10 rounded-lg overflow-hidden bg-white">
              <div className="aspect-video bg-ink/5 flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.filename}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium truncate" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-xs text-muted">{formatBytes(item.size_bytes)}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="text-xs px-2 py-1 bg-ink/5 rounded hover:bg-ink/10 transition-colors"
                  >
                    {copied === item.url ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-xs px-2 py-1 text-red-600 hover:text-red-700 transition-colors ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No media uploaded yet.</p>
      )}
    </div>
  )
}
