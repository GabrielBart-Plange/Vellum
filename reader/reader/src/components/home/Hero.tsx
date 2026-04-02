import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative py-32 px-4 max-w-5xl mx-auto text-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />

      {/* Sakura Accent Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--reader-accent)]/5 blur-[100px] rounded-full -z-10 animate-pulse" />

      <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--reader-text)] leading-[0.9] uppercase italic">
        Chronicles <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-[var(--reader-accent)]">
          for the soul.
        </span>
      </h1>

      <p className="mt-10 text-[var(--reader-text-muted)] text-xl font-light leading-relaxed max-w-2xl mx-auto italic">
        Step into a realm where every word is a heartbeat. Discover original sagas and short stories woven by a community of creators who live for the craft.
      </p>

      <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-6">
        <Link
          href="/stories"
          className="w-full md:w-auto px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95 text-xs"
        >
          Read Stories
        </Link>
        <Link
          href="/novel"
          className="w-full md:w-auto px-12 py-5 rounded-2xl border border-white/10 glass-panel text-white font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all text-center text-xs"
        >
          Browse Novels
        </Link>
      </div>
    </section>
  );
}
