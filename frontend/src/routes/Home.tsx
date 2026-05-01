import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import HeroSection from '../components/HeroSection'
import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const verified = searchParams.get('verified')
  const unsubscribed = searchParams.get('unsubscribed')

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.posts.list(),
  })

  return (
    <>
      {/* Status banners */}
      {verified && (
        <div className="bg-card-sage text-ink text-center py-3 text-sm font-medium">
          Email confirmed! You're subscribed.
        </div>
      )}
      {unsubscribed && (
        <div className="bg-card-rose text-ink text-center py-3 text-sm font-medium">
          You've been unsubscribed. Sorry to see you go!
        </div>
      )}

      <HeroSection
        recentPosts={
          posts?.map((p) => ({ slug: p.slug, title: p.title, tags: p.tags })) ?? []
        }
      />
    </>
  )
}
