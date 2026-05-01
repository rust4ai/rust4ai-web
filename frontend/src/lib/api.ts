const BASE = ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// Public API
export const api = {
  posts: {
    list: (params?: { tag?: string; page?: number }) => {
      const q = new URLSearchParams()
      if (params?.tag) q.set('tag', params.tag)
      if (params?.page) q.set('page', String(params.page))
      const qs = q.toString()
      return request<PostSummary[]>(`/api/posts${qs ? `?${qs}` : ''}`)
    },
    get: (slug: string) => request<Post>(`/api/posts/${slug}`),
    featured: () => request<PostSummary[]>('/api/posts/featured'),
  },
  tutorials: {
    list: (params?: { page?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      const qs = q.toString()
      return request<TutorialSummary[]>(`/api/tutorials${qs ? `?${qs}` : ''}`)
    },
    get: (slug: string) => request<Tutorial>(`/api/tutorials/${slug}`),
    featured: () => request<TutorialSummary[]>('/api/tutorials/featured'),
  },
  projects: {
    list: (params?: { page?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      const qs = q.toString()
      return request<ProjectSummary[]>(`/api/projects${qs ? `?${qs}` : ''}`)
    },
    get: (slug: string) => request<Project>(`/api/projects/${slug}`),
    featured: () => request<ProjectSummary[]>('/api/projects/featured'),
  },
  newsletters: {
    list: (params?: { page?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      const qs = q.toString()
      return request<NewsletterSummary[]>(`/api/newsletters${qs ? `?${qs}` : ''}`)
    },
    get: (slug: string) => request<Newsletter>(`/api/newsletters/${slug}`),
  },
  newsletter: {
    subscribe: (email: string) =>
      fetch(`${BASE}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }),
  },
  admin: {
    posts: {
      list: () => request<PostSummary[]>('/api/admin/posts'),
      create: (data: CreatePostData) =>
        request<Post>('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: CreatePostData) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      publish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}/publish`, {
          method: 'POST',
        }),
      unpublish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}/unpublish`, {
          method: 'POST',
        }),
      toggleFeatured: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}/feature`, {
          method: 'POST',
        }),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}`, {
          method: 'DELETE',
        }),
    },
    tutorials: {
      list: () => request<TutorialSummary[]>('/api/admin/tutorials'),
      create: (data: CreateTutorialData) =>
        request<Tutorial>('/api/admin/tutorials', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: CreateTutorialData) =>
        request<{ ok: boolean }>(`/api/admin/tutorials/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      publish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/tutorials/${id}/publish`, {
          method: 'POST',
        }),
      unpublish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/tutorials/${id}/unpublish`, {
          method: 'POST',
        }),
      toggleFeatured: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/tutorials/${id}/feature`, {
          method: 'POST',
        }),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/tutorials/${id}`, {
          method: 'DELETE',
        }),
    },
    projects: {
      list: () => request<ProjectSummary[]>('/api/admin/projects'),
      create: (data: CreateProjectData) =>
        request<Project>('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: CreateProjectData) =>
        request<{ ok: boolean }>(`/api/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      publish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/projects/${id}/publish`, {
          method: 'POST',
        }),
      unpublish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/projects/${id}/unpublish`, {
          method: 'POST',
        }),
      toggleFeatured: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/projects/${id}/feature`, {
          method: 'POST',
        }),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/projects/${id}`, {
          method: 'DELETE',
        }),
    },
    newsletters: {
      list: () => request<NewsletterSummary[]>('/api/admin/newsletters'),
      create: (data: CreateNewsletterData) =>
        request<Newsletter>('/api/admin/newsletters', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      update: (id: string, data: CreateNewsletterData) =>
        request<{ ok: boolean }>(`/api/admin/newsletters/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      publish: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/newsletters/${id}/publish`, {
          method: 'POST',
        }),
      send: (id: string) =>
        request<{ ok: boolean; sent: number; failed: number; total_subscribers: number }>(
          `/api/admin/newsletters/${id}/send`,
          { method: 'POST' }
        ),
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/newsletters/${id}`, {
          method: 'DELETE',
        }),
    },
    subscribers: {
      list: () => request<SubscribersResponse>('/api/admin/subscribers'),
      exportCsv: () =>
        fetch(`${BASE}/api/admin/subscribers.csv`, { credentials: 'include' }),
    },
    media: {
      list: () => request<MediaItem[]>('/api/admin/media'),
      upload: async (file: File): Promise<MediaItem> => {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`${BASE}/api/admin/media/upload`, {
          method: 'POST',
          credentials: 'include',
          body: form,
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Upload failed: ${res.status}`)
        }
        return res.json()
      },
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/media/${id}`, { method: 'DELETE' }),
      generate: (prompt: string, style: string) =>
        request<MediaItem>('/api/admin/media/generate', {
          method: 'POST',
          body: JSON.stringify({ prompt, style }),
        }),
    },
  },
}

// Types
export interface PostSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  tags: string[]
  status: string
  featured: boolean
  published_at: string | null
  created_at: string
}

export interface Post extends PostSummary {
  body_md: string
  updated_at: string
}

export interface CreatePostData {
  slug: string
  title: string
  excerpt?: string
  body_md: string
  cover_image_url?: string
  tags: string[]
  featured?: boolean
}

export interface TutorialSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  video_url: string | null
  tags: string[]
  status: string
  featured: boolean
  published_at: string | null
  created_at: string
}

export interface Tutorial extends TutorialSummary {
  body_md: string
  updated_at: string
}

export interface CreateTutorialData {
  slug: string
  title: string
  excerpt?: string
  body_md: string
  cover_image_url?: string
  video_url?: string
  tags: string[]
  featured?: boolean
}

export interface ProjectSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  repo_url: string | null
  video_url: string | null
  tags: string[]
  status: string
  featured: boolean
  published_at: string | null
  created_at: string
}

export interface Project extends ProjectSummary {
  body_md: string
  updated_at: string
}

export interface CreateProjectData {
  slug: string
  title: string
  excerpt?: string
  body_md: string
  cover_image_url?: string
  repo_url?: string
  video_url?: string
  tags: string[]
  featured?: boolean
}

export interface NewsletterSummary {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  tags: string[]
  status: string
  featured: boolean
  sent_at: string | null
  published_at: string | null
  created_at: string
}

export interface Newsletter extends NewsletterSummary {
  body_md: string
  body_html: string | null
  updated_at: string
}

export interface CreateNewsletterData {
  slug: string
  title: string
  excerpt?: string
  body_md: string
  body_html?: string
  cover_image_url?: string
  tags: string[]
  featured?: boolean
}

export interface MediaItem {
  id: string
  sha256: string
  filename: string
  content_type: string
  size_bytes: number
  url: string
  created_at: string
}

export interface SubscribersResponse {
  counts: {
    pending: number
    confirmed: number
    unsubscribed: number
  }
  subscribers: {
    id: string
    email: string
    status: string
    created_at: string
    confirmed_at: string | null
  }[]
}
