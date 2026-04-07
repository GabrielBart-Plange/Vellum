import Link from "next/link";
import Image from "next/image";

interface HeroProps {
  championPick?: {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    authorName: string;
    genre: string;
    type: 'novel' | 'story';
    slug?: string;
    alphanumericId?: string;
  };
}

export default function Hero({ championPick }: HeroProps) {
  return (
    <section className="relative py-24 md:py-32 px-4 max-w-6xl mx-auto overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full -z-10" />

      {/* Sakura Accent Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--reader-accent)]/5 blur-[100px] rounded-full -z-10 animate-pulse" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 text-center lg:text-left space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.8em] text-[var(--reader-accent)] font-black italic animate-in fade-in slide-in-from-bottom-2 duration-700">The Archive Awaits</p>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--reader-text)] leading-[0.9] uppercase italic">
              Chronicles <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-[var(--reader-accent)]">
                for the soul.
              </span>
            </h1>
          </div>

          <p className="text-[var(--reader-text-muted)] text-xl font-light leading-relaxed max-w-2xl mx-auto lg:mx-0 italic">
            Step into a realm where every word is a heartbeat. Discover original sagas and short stories woven by a community of creators who live for the craft.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
            <Link
              href="/stories"
              className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95 text-xs italic"
            >
              Read Stories
            </Link>
            <Link
              href="/novel"
              className="w-full sm:w-auto px-12 py-5 rounded-2xl border border-white/10 glass-panel text-white font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all text-center text-xs italic"
            >
              Browse Novels
            </Link>
          </div>
        </div>

        {/* Champion Pick */}
        <div className="lg:col-span-5 relative group">
          {championPick ? (
            <Link href={championPick.type === 'novel' ? `/novel/${championPick.slug || championPick.id}` : `/stories/${championPick.alphanumericId || championPick.slug || championPick.id}`} className="block">
              <div className="relative aspect-[3/4] w-full max-w-[320px] mx-auto group">
                {/* Decorative background layers */}
                <div className="absolute inset-0 bg-[var(--reader-accent)]/20 blur-3xl group-hover:bg-[var(--reader-accent)]/30 transition-colors duration-700 -z-10" />
                <div className="absolute -inset-4 border border-white/5 rounded-[2rem] -rotate-3 group-hover:rotate-0 transition-transform duration-700" />
                
                <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-2">
                  <Image 
                    src={championPick.coverImage} 
                    alt={championPick.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-[var(--reader-accent)] text-white text-[8px] font-black uppercase tracking-widest italic">Champion Pick</span>
                      <span className="text-[8px] text-white/60 font-black uppercase tracking-widest italic">{championPick.genre}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none line-clamp-2">{championPick.title}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest italic">scribed by {championPick.authorName}</p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="aspect-[3/4] w-full max-w-[320px] mx-auto rounded-[1.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
              <div className="text-4xl">📚</div>
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500">Awaiting the next <br />Champion Chronicle</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
