export default function VisionSection() {
  return (
    <section className="bg-card-amber/30 py-20 lg:py-28">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="h-[3px] w-full bg-ink mb-12" />
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] font-extrabold leading-tight tracking-tight">
            Deploy your AI to metal
          </h2>
          <p className="text-lg sm:text-xl text-ink/70 leading-relaxed">
            We believe the next generation of production AI systems will be built on
            memory safety, type safety, and fearless concurrency. Rust gives us all three.
            From deep learning frameworks to autonomous agents, we're building the
            ecosystem that makes Rust the default choice for AI that ships.
          </p>
        </div>
        <div className="h-[3px] w-full bg-ink mt-12" />
      </div>
    </section>
  )
}
