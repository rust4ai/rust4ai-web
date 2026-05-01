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
      delete: (id: string) =>
        request<{ ok: boolean }>(`/api/admin/posts/${id}`, {
          method: 'DELETE',
        }),
    },
    subscribers: {
      list: () => request<SubscribersResponse>('/api/admin/subscribers'),
      exportCsv: () =>
        fetch(`${BASE}/api/admin/subscribers.csv`, { credentials: 'include' }),
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
