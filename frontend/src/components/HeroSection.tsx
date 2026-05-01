import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import NewsletterForm from './NewsletterForm'
import ProjectCard from './ProjectCard'

const CARD_COLORS = ['bg-card-sage', 'bg-card-lilac', 'bg-card-rose', 'bg-card-amber'] as const
const LABELS = ['TUTORIAL', 'DEEP DIVE', 'NEW', 'SPICE'] as const

const ROTATING_WORDS = [
  { word: 'scale', color: '#0E0E10' },
  { word: 'blog', color: '#C8D4C5' },
  { word: 'assist', color: '#D4CBE0' },
  { word: 'chat', color: '#E5BFC0' },
  { word: 'code', color: '#E5C896' },
  { word: 'clip', color: '#CE422B' },
  { word: 'think', color: '#D4A547' },
] as const

interface HeroProps {
  recentPosts: { slug: string; title: string; tags: string[] }[]
}

export default function HeroSection({ recentPosts }: HeroProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [charCount, setCharCount] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length)
      setCharCount(1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fullLen = ROTATING_WORDS[wordIndex].word.length
    if (charCount >= fullLen) return
    const timer = setTimeout(() => setCharCount((c) => c + 1), 60)
    return () => clearTimeout(timer)
  }, [charCount, wordIndex])

  const cards = recentPosts.length > 0
    ? recentPosts.slice(0, 4)
    : [
        { slug: '#', title: 'Getting started with Burn', tags: ['burn', 'tutorial'] },
        { slug: '#', title: 'Building an AI agent in Rust', tags: ['agents', 'rig'] },
        { slug: '#', title: 'Candle vs Burn benchmark', tags: ['candle', 'burn'] },
        { slug: '#', title: 'Deploying ML models with Rust', tags: ['deploy', 'inference'] },
      ]

  const { word: fullWord, color } = ROTATING_WORDS[wordIndex]
  const word = fullWord.slice(0, charCount)

  return (
    <>
      {/* Spice desert banner */}
      <div className="desert-banner h-8" />

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
              agents that{' '}
              <span
                key={word}
                style={{ color }}
                className="inline-block transition-colors duration-500"
              >
                {word}
              </span>
              .
            </h1>

            <p className="text-lg sm:text-xl text-muted max-w-xl leading-relaxed">
              Our mission is to advance and popularize rust for ai agents.
              Burn, Rig, Candle, Spice, and more.
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
            <Link
              to="/blog"
              className="inline-block mt-2 text-sm font-semibold text-ink hover:opacity-60 transition-opacity"
            >
              Read all blogs &rarr;
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
