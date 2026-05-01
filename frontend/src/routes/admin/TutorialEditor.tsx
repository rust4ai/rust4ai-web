import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import MarkdownEditor from '../../components/MarkdownEditor'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function TutorialEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, loading: authLoading } = useSession()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [bodyMd, setBodyMd] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: existing } = useQuery({
    queryKey: ['admin-tutorial', id],
    queryFn: async () => {
      const items = await api.admin.tutorials.list()
      return items.find((t) => t.id === id)
    },
    enabled: !!id && !!user,
  })

  useEffect(() => {
    if (existing) {
      setTitle(existing.title)
      setSlug(existing.slug)
      setExcerpt(existing.excerpt ?? '')
      setTagsInput(existing.tags.join(', '))
      setCoverUrl(existing.cover_image_url ?? '')
      setVideoUrl(existing.video_url ?? '')
      setFeatured(existing.featured ?? false)
      setAutoSlug(false)
      api.tutorials.get(existing.slug).then((t) => setBodyMd(t.body_md)).catch(() => {})
    }
  }, [existing])

  useEffect(() => {
    if (autoSlug && isNew) setSlug(slugify(title))
  }, [title, autoSlug, isNew])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      slug,
      title,
      excerpt: excerpt || undefined,
      body_md: bodyMd,
      cover_image_url: coverUrl || undefined,
      video_url: videoUrl || undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      featured,
    }
    try {
      if (isNew) {
        const tutorial = await api.admin.tutorials.create(data)
        await queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] })
        navigate(`/admin/tutorials/${tutorial.id}`)
      } else {
        await api.admin.tutorials.update(id!, data)
        await queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!id) return
    try {
      await api.admin.tutorials.publish(id)
      await queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] })
      alert('Published!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Publish failed')
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this tutorial?')) return
    try {
      await api.admin.tutorials.delete(id)
      await queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] })
      navigate('/admin/tutorials')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (authLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">{isNew ? 'New Tutorial' : 'Edit Tutorial'}</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAutoSlug(false) }}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Excerpt</label>
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
            placeholder="Brief summary..."
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rust/30"
              placeholder="burn, tutorial"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover image URL</label>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Video URL</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-ink/20 text-rust focus:ring-rust/30"
          />
          <label htmlFor="featured" className="text-sm font-medium">Featured on homepage</label>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
            <MarkdownEditor value={bodyMd} onChange={setBodyMd} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preview</label>
            <div className="prose prose-sm max-w-none p-4 bg-white rounded-lg border border-ink/10 h-96 overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {bodyMd}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink/5">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          {!isNew && (
            <>
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-2.5 bg-rust text-white text-sm font-semibold rounded-lg hover:bg-rust/90 transition-colors"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2.5 text-sm text-red-600 hover:text-red-700 transition-colors ml-auto"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
