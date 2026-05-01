import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../../lib/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authClient.emailOtp.sendVerificationOtp({ email })
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp: code })
      if (result.error) {
        setError(result.error.message)
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-ink/5 p-8">
        <h1 className="text-2xl font-bold mb-1">Admin Login</h1>
        <p className="text-sm text-muted mb-8">Sign in with your email.</p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rust4ai.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-ink/10 text-sm focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rust text-white font-semibold rounded-lg hover:bg-rust/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-muted">
              We sent a code to <strong>{email}</strong>
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-ink/10 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-rust text-white font-semibold rounded-lg hover:bg-rust/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-muted hover:text-ink transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
