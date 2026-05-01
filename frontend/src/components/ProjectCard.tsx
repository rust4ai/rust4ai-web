import { Link } from 'react-router-dom'

interface Props {
  slug: string
  title: string
  tags: string[]
  color: string
  label: string
}

export default function ProjectCard({ slug, title, tags, color, label }: Props) {
  const Wrapper = slug === '#' ? 'div' : Link
  const props = slug === '#' ? {} : { to: `/blog/${slug}` }

  return (
    <Wrapper
      {...(props as Record<string, string>)}
      className={`block ${color} rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-pointer`}
    >
      {/* Status label like Huddle: dot + uppercase text */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-ink/50" />
        <span className="text-xs font-semibold tracking-wider uppercase text-ink/60">
          {label}
        </span>
      </div>

      {/* Card title — large, bold, multi-line like Huddle */}
      <h3 className="font-bold text-xl leading-snug mb-4">{title}</h3>

      {/* Tag chips at the bottom */}
      <div className="flex gap-2 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-mono px-3 py-1 rounded-full bg-ink/10 text-ink/80"
          >
            #{tag}
          </span>
        ))}
      </div>
    </Wrapper>
  )
}
