import { useState, useEffect, useRef, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useSession } from '../../lib/auth'
import { api, Tutorial } from '../../lib/api'
import MarkdownEditor from '../../components/MarkdownEditor'
import ImageUpload from '../../components/ImageUpload'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface PageState {
  title: string
  body_md: string
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
  const [pages, setPages] = useState<PageState[]>([{ title: 'Introduction', body_md: '' }])
  const [activePage, setActivePage] = useState(0)
  const [coverUrl, setCoverUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const [insertingImage, setInsertingImage] = useState(false)
  const insertFileRef = useRef<HTMLInputElement>(null)

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
      // Fetch full tutorial to get pages
      api.tutorials.get(existing.slug).then((t: Tutorial) => {
        if (t.pages && t.pages.length > 0) {
          setPages(t.pages.map((p) => ({ title: p.title, body_md: p.body_md })))
        } else if (t.body_md) {
          setPages([{ title: 'Introduction', body_md: t.body_md }])
        }
      }).catch(() => {})
    }
  }, [existing])

  useEffect(() => {
    if (autoSlug && isNew) setSlug(slugify(title))
  }, [title, autoSlug, isNew])

  function updatePage(index: number, field: keyof PageState, value: string) {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function addPage() {
    setPages((prev) => [...prev, { title: `Page ${prev.length + 1}`, body_md: '' }])
    setActivePage(pages.length)
  }

  function removePage(index: number) {
    if (pages.length <= 1) return
    setPages((prev) => prev.filter((_, i) => i !== index))
    if (activePage >= index && activePage > 0) setActivePage(activePage - 1)
  }

  function movePage(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= pages.length) return
    setPages((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return arr
    })
    setActivePage(newIndex)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      slug,
      title,
      excerpt: excerpt || undefined,
      pages: pages.map((p) => ({ title: p.title, body_md: p.body_md })),
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

  const isPublished = existing?.status === 'published'

  async function handleTogglePublish() {
    if (!id) return
    try {
      if (isPublished) {
        await api.admin.tutorials.unpublish(id)
      } else {
        await api.admin.tutorials.publish(id)
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-tutorials'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-tutorial', id] })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
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

  const currentPage = pages[activePage] || pages[0]

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink transition-colors mb-4 inline-block">&larr; Dashboard</Link>
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

        <div className="grid sm:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">Video URL</label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>

        <ImageUpload value={coverUrl || undefined} onUploaded={(url) => setCoverUrl(url)} />

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

        {/* Page tabs */}
        <div>
          <label className="block text-sm font-medium mb-2">Pages</label>
          <div className="flex flex-wrap items-center gap-1 mb-3 border-b border-ink/10 pb-2">
            {pages.map((page, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActivePage(i)}
                  className={`px-3 py-1.5 text-sm rounded-t-lg transition-colors ${
                    activePage === i
                      ? 'bg-ink text-white font-semibold'
                      : 'bg-ink/5 text-muted hover:bg-ink/10'
                  }`}
                >
                  {page.title || `Page ${i + 1}`}
                </button>
                {activePage === i && pages.length > 1 && (
                  <div className="flex gap-0.5 ml-0.5">
                    <button
                      type="button"
                      onClick={() => movePage(i, -1)}
                      disabled={i === 0}
                      className="text-xs px-1 py-0.5 text-muted hover:text-ink disabled:opacity-30"
                      title="Move left"
                    >&larr;</button>
                    <button
                      type="button"
                      onClick={() => movePage(i, 1)}
                      disabled={i === pages.length - 1}
                      className="text-xs px-1 py-0.5 text-muted hover:text-ink disabled:opacity-30"
                      title="Move right"
                    >&rarr;</button>
                    <button
                      type="button"
                      onClick={() => removePage(i)}
                      className="text-xs px-1 py-0.5 text-red-500 hover:text-red-700"
                      title="Remove page"
                    >&times;</button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPage}
              className="px-3 py-1.5 text-sm bg-ink/5 text-muted hover:bg-ink/10 rounded-t-lg transition-colors"
              title="Add page"
            >+</button>
          </div>

          {/* Active page title */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted mb-1">Page Title</label>
            <input
              value={currentPage.title}
              onChange={(e) => updatePage(activePage, 'title', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
              placeholder="Page title..."
            />
          </div>

          {/* Insert image button */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => insertFileRef.current?.click()}
              disabled={insertingImage}
              className="text-xs px-2 py-1 bg-ink/5 rounded hover:bg-ink/10 transition-colors"
            >
              {insertingImage ? 'Uploading...' : 'Insert Image'}
            </button>
            <input
              ref={insertFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setInsertingImage(true)
                try {
                  const item = await api.admin.media.upload(file)
                  updatePage(activePage, 'body_md', currentPage.body_md + `\n![${item.filename}](${item.url})\n`)
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Upload failed')
                } finally {
                  setInsertingImage(false)
                  e.target.value = ''
                }
              }}
            />
          </div>

          {/* Editor + Preview */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Content (Markdown)</label>
              <MarkdownEditor
                value={currentPage.body_md}
                onChange={(val) => updatePage(activePage, 'body_md', val)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preview</label>
              <div className="prose prose-sm max-w-none p-4 bg-white rounded-lg border border-ink/10 h-96 overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {currentPage.body_md}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink/5">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-ink text-white text-sm font-semibold rounded-lg hover:bg-ink/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {!isNew && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-muted">{isPublished ? 'Published' : 'Draft'}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublished}
                  onClick={handleTogglePublish}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rust/30 ${isPublished ? 'bg-rust' : 'bg-ink/20'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>
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
