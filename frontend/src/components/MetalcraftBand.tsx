// Feature band promoting metalcraftai.com — the graph-orchestration framework
// from the rust4ai ecosystem. Dark panel echoes the Metalcraft brand; the
// black rules match rust4ai's editorial section styling.

const NODES: [number, number, number, string, boolean][] = [
  [24, 184, 72, 'entry', true],
  [150, 104, 92, 'agent', true],
  [150, 249, 92, 'tool', false],
  [285, 59, 92, 'research', false],
  [285, 174, 92, 'code', true],
  [420, 119, 92, 'merge', true],
  [446, 184, 88, 'END', false],
]

function CompiledGraph() {
  return (
    <svg width="100%" viewBox="0 0 560 400" fill="none" className="block">
      <g stroke="#3a4657" strokeWidth="1.6">
        <path d="M96 200 L150 135" />
        <path d="M96 200 L150 265" />
        <path d="M242 250 L285 190" />
        <path d="M285 75 L420 135" />
        <path d="M420 265 L474 200" />
      </g>
      <g stroke="#4d6a9c" strokeWidth="2">
        <path d="M242 120 L285 75" />
        <path d="M242 120 L285 190" />
        <path d="M377 75 L420 135" />
        <path d="M377 190 L420 135" />
        <path d="M420 135 L474 200" />
      </g>
      <g fontFamily="'JetBrains Mono',ui-monospace,monospace" fontSize="13">
        {NODES.map(([x, y, w, label, active]) => (
          <g key={label}>
            <rect
              x={x}
              y={y}
              width={w}
              height="32"
              rx="7"
              fill={active ? '#26344a' : '#232c3a'}
              stroke={active ? '#4d6a9c' : '#3a4657'}
              strokeWidth="1.5"
            />
            <text
              x={x + w / 2}
              y={y + 20}
              fill={active ? '#e6ebf0' : '#aab4c0'}
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

export default function MetalcraftBand() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="h-[3px] w-full bg-ink mb-12" />

        <div className="rounded-2xl bg-night text-moon overflow-hidden border border-ink/10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center p-8 sm:p-12 lg:p-16">
            {/* Left: copy + CTA */}
            <div>
              <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-sand mb-5">
                From the rust4ai ecosystem
              </div>
              <h2 className="text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                Metalcraft — the orchestration layer for reliable agents.
              </h2>
              <p className="mt-5 text-lg text-moon/70 leading-relaxed max-w-xl">
                A stateful, graph-based orchestrator for AI agents in Rust — typed
                state, cyclic graphs, human-in-the-loop, and full observability,
                with compile-time safety. The framework and the agent, one platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://metalcraftai.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-sand px-6 py-3.5 text-[15px] font-bold text-ink hover:bg-sand-light transition-colors"
                >
                  Explore Metalcraft →
                </a>
                <a
                  href="https://github.com/rust4ai/metalcraft"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-moon/80 hover:text-white transition-colors"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Right: compiled-graph panel (shared Metalcraft signature) */}
            <div className="rounded-xl bg-gradient-to-br from-[#2a3340] via-[#20272f] to-[#161c24] border border-[#323b48] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-[#7f8b98]">
                  compiled graph
                </span>
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3a4657]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3a4657]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#4d6a9c]" />
                </div>
              </div>
              <CompiledGraph />
              <div className="flex gap-6 mt-3.5 font-mono text-[11px] text-[#7f8b98]">
                <span>
                  <span className="text-[#4d6a9c]">━</span> conditional
                </span>
                <span>
                  <span className="text-[#3a4657]">━</span> static
                </span>
                <span className="ml-auto">cyclic · resumable</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[3px] w-full bg-ink mt-12" />
      </div>
    </section>
  )
}
