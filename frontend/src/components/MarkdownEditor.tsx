interface Props {
  value: string
  onChange: (value: string) => void
}

export default function MarkdownEditor({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-96 p-4 font-mono text-sm bg-white border border-ink/10 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-rust/30"
      placeholder="Write your post in Markdown..."
    />
  )
}
