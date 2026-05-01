import { useState, FormEvent } from 'react'
import { api } from '../lib/api'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      await api.newsletter.subscribe(email)
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-card-sage/60 rounded-xl p-5 text-sm">
        <p className="font-semibold text-ink">Check your inbox!</p>
        <p className="text-muted mt-1">We sent you a confirmation link.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="flex-1 px-5 py-3.5 rounded-full bg-white border border-ink/10 text-sm font-mono placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-sand/40"
      />
      {/* Honeypot */}
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-8 py-3.5 bg-ink text-white font-semibold text-sm rounded-full hover:bg-ink/80 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p className="text-red-600 text-xs mt-1">Something went wrong. Try again.</p>
      )}
    </form>
  )
}
