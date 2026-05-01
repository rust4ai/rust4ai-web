import { useSearchParams } from 'react-router-dom'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')

  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      {verified ? (
        <>
          <h1 className="text-3xl font-bold mb-4">You're in!</h1>
          <p className="text-muted">Your email has been confirmed. Welcome to rust4ai.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-4">Verifying...</h1>
          <p className="text-muted">Check your email for the confirmation link.</p>
        </>
      )}
    </div>
  )
}
