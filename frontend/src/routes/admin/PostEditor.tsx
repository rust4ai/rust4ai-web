import { useState, useEffect, useRef, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useSession } from '../../lib/auth'
import { api } from '../../lib/api'
import MarkdownEditor from '../../components/MarkdownEditor'
import ImageUpload from '../../components/ImageUpload'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PostEditor() {
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
  const [tagsInput, setTagsInput] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const [insertingImage, setInsertingImage] = useState(false)
  const [generatingImages, setGeneratingImages] = useState(false)
  const insertFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login')
  }, [user, authLoading, navigate])

  const { data: existing } = useQuery({
    queryKey: ['admin-post', id],
    queryFn: async () => {
      const posts = await api.admin.posts.list()
      return posts.find((p) => p.id === id)
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
      setFeatured(existing.featured ?? false)
      setAutoSlug(false)
      // Load full post for body
      api.posts.get(existing.slug).then((p) => setBodyMd(p.body_md)).catch(() => {})
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
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      featured,
    }
    try {
      if (isNew) {
        const post = await api.admin.posts.create(data)
        await queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
        navigate(`/admin/posts/${post.id}`)
      } else {
        await api.admin.posts.update(id!, data)
        await queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
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
        await api.admin.posts.unpublish(id)
      } else {
        await api.admin.posts.publish(id)
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-post', id] })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function handleDelete() {
    if (!id || !confirm('Delete this post?')) return
    try {
      await api.admin.posts.delete(id)
      await queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      navigate('/admin/posts')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  async function handleGenerateImages() {
    // Parse :::ai-image blocks
    const blockRegex = /:::ai-image\s*\n([\s\S]*?):::/g
    const matches = [...bodyMd.matchAll(blockRegex)]
    if (matches.length === 0) {
      alert('No :::ai-image blocks found in content')
      return
    }

    setGeneratingImages(true)
    let updatedBody = bodyMd
    let firstUrl: string | null = null

    try {
      for (const match of matches) {
        const blockContent = match[1].trim()
        // Parse prompt and style from the block
        let prompt = blockContent
        let style = 'realistic'
        const lines = blockContent.split('\n')
        for (const line of lines) {
          const styleLine = line.match(/^style:\s*(.+)/i)
          if (styleLine) {
            style = styleLine[1].trim()
            prompt = lines.filter((l) => l !== line).join('\n').trim()
          }
        }

        const item = await api.admin.media.generate(prompt, style)
        if (!firstUrl) firstUrl = item.url
        updatedBody = updatedBody.replace(match[0], `![${prompt.slice(0, 60)}](${item.url})`)
      }

      setBodyMd(updatedBody)
      if (!coverUrl && firstUrl) {
        setCoverUrl(firstUrl)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image generation failed')
    } finally {
      setGeneratingImages(false)
    }
  }

  if (authLoading) return <div className="p-8 text-muted">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/admin" className="text-sm text-muted hover:text-ink transition-colors mb-4 inline-block">&larr; Dashboard</Link>
      <h1 className="text-3xl font-bold mb-8">{isNew ? 'New Post' : 'Edit Post'}</h1>

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
              onChange={(e) => {
                setSlug(e.target.value)
                setAutoSlug(false)
              }}
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
            placeholder="Brief summary for the post list..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-ink/10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rust/30"
            placeholder="burn, tutorial, agents"
          />
        </div>

        <ImageUpload value={coverUrl} onUploaded={(url) => setCoverUrl(url)} />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="rounded border-ink/20 text-rust focus:ring-rust/30"
          />
          <label htmlFor="featured" className="text-sm font-medium">
            Featured on homepage
          </label>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Content (Markdown)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => insertFileRef.current?.click()}
                  disabled={insertingImage}
                  className="text-xs px-2 py-1 bg-ink/5 rounded hover:bg-ink/10 transition-colors"
                >
                  {insertingImage ? 'Uploading...' : 'Insert Image'}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateImages}
                  disabled={generatingImages}
                  className="text-xs px-2 py-1 bg-rust/10 text-rust rounded hover:bg-rust/20 transition-colors disabled:opacity-50"
                >
                  {generatingImages ? 'Generating...' : 'Generate AI Images'}
                </button>
              </div>
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
                    setBodyMd((prev) => prev + `\n![${item.filename}](${item.url})\n`)
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Upload failed')
                  } finally {
                    setInsertingImage(false)
                    e.target.value = ''
                  }
                }}
              />
            </div>
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
