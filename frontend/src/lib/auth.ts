import { useState, useEffect } from 'react'

const BASE_URL = window.location.origin

export const authClient = {
  emailOtp: {
    async sendVerificationOtp({ email }: { email: string }) {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send OTP')
      }
      return res.json()
    },
    async verifyEmail({ email, otp }: { email: string; otp: string }) {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: otp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { error: { message: data.error || 'Verification failed' } }
      }
      return { data, error: null }
    },
  },
}

export async function signOut() {
  await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  })
}

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
}

export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/session`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { user, loading, setUser }
}
