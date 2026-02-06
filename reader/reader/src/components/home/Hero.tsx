import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative py-32 px-4 max-w-5xl mx-auto text-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />

      {/* Sakura Accent Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent-sakura)]/5 blur-[100px] rounded-full -z-10 animate-pulse" />

      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-tight">
        Read the next <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-[var(--accent-sakura)]">
          great chronicle.
        </span>
      </h1>

      <p className="mt-8 text-zinc-400 text-xl font-light leading-relaxed max-w-2xl mx-auto">
        Discover original stories and novels crafted with care.
        Immerse yourself in <span className="text-[var(--accent-sakura)] italic font-medium opacity-80 underline decoration-purple-500/30 underline-offset-4">new worlds</span>, one chapter at a time.
      </p>

      <div className="mt-12 flex items-center justify-center gap-6">
        <Link
          href="/stories"
          className="px-10 py-4 rounded-full bg-[var(--accent-lime)] text-black font-bold uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_30px_-5px_var(--glow-lime)] hover:-translate-y-1 active:scale-95"
        >
          Explore Stories
        </Link>
        <Link
          href="/about"
          className="px-10 py-4 rounded-full border border-white/10 glass-panel text-white font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all text-center"
        >
          Learn More
        </Link>
      </div>
    </section>
  );
}
