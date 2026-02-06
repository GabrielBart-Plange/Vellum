"use client";

export default function RankingPage() {
    return (
        <main className="min-h-screen bg-black pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-[var(--accent-lime)] pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Prestige</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">HALL OF FAME</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-panel p-10 rounded-3xl border border-white/5 space-y-4 hover:border-[var(--accent-lime)]/30 transition-all group">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Rank #{i}</p>
                            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/5 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Archivist_{i}</h3>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--accent-lime)] font-black">9,240 VISIONS</p>
                        </div>
                    ))}
                </div>

                <div className="pt-20 text-center">
                    <p className="text-zinc-600 text-xs italic uppercase tracking-[0.6em]">The balance shifts with every heartbeat.</p>
                </div>
            </div>
        </main>
    );
}
