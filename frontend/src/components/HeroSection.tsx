import NewsletterForm from './NewsletterForm'
import ProjectCard from './ProjectCard'

const CARD_COLORS = ['bg-card-sage', 'bg-card-lilac', 'bg-card-rose', 'bg-card-amber'] as const
const LABELS = ['TUTORIAL', 'DEEP DIVE', 'NEW', 'SPICE'] as const

interface HeroProps {
  recentPosts: { slug: string; title: string; tags: string[] }[]
}

export default function HeroSection({ recentPosts }: HeroProps) {
  const cards = recentPosts.length > 0
    ? recentPosts.slice(0, 4)
    : [
        { slug: '#', title: 'Getting started with Burn', tags: ['burn', 'tutorial'] },
        { slug: '#', title: 'Building an AI agent in Rust', tags: ['agents', 'rig'] },
        { slug: '#', title: 'Candle vs Burn benchmark', tags: ['candle', 'burn'] },
        { slug: '#', title: 'Deploying ML models with Rust', tags: ['deploy', 'inference'] },
      ]

  return (
    <>
      {/* Spice desert banner */}
      <div className="desert-banner h-[280px] sm:h-[320px] flex items-center justify-center">
        <div className="moon" />
        <div className="dune-layer dune-1" />
        <div className="dune-layer dune-2" />
        <div className="relative z-10 text-center px-6">
          <p className="text-moon/80 text-sm font-mono tracking-widest uppercase">
            Rust + AI deep-dives, weekly
          </p>
        </div>
      </div>

      {/* Huddle-style hero: large headline left, card stack right */}
      <section className="max-w-[1400px] mx-auto px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-start">
          {/* Left: headline, subtext, newsletter CTA */}
          <div className="space-y-10">
            {/* Divider line like Huddle */}
            <div className="h-[3px] w-full bg-ink" />

            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight">
              Rust + AI,
              <br />
              from the trenches.
            </h1>

            <p className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed">
              Deep-dives on building AI systems in Rust. Burn, Rig, Candle, agents,
              inference engines — no fluff, just code.
            </p>

            <div className="max-w-md space-y-4">
              <NewsletterForm />
            </div>
          </div>

          {/* Right: card stack (like Huddle's project cards) */}
          <div className="space-y-4">
            {cards.map((post, i) => (
              <ProjectCard
                key={post.slug + i}
                slug={post.slug}
                title={post.title}
                tags={post.tags}
                color={CARD_COLORS[i % CARD_COLORS.length]}
                label={LABELS[i % LABELS.length]}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
