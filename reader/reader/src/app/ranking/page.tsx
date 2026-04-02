import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hall of Legends | Vellum Rankings",
  description: "Explore the most resonant souls in the Vellum digital archive. The definitive leaderboard of authors and readers.",
  openGraph: {
    title: "Hall of Legends | Vellum Rankings",
    description: "The archive remembers those who breathe life into the silence.",
    type: "website",
  }
};

export default function RankingPage() {
    const legends = [
        { name: "Nexus_Scribe", score: "12,450", rank: "Master", icon: "💎", color: "from-amber-500/20" },
        { name: "Echo_Seeker", score: "9,240", rank: "Scholar", icon: "✨", color: "from-blue-500/20" },
        { name: "Void_Walker", score: "8,110", rank: "Seeker", icon: "🕯️", color: "from-purple-500/20" }
    ];

    return (
        <main className="min-h-screen text-[var(--reader-text)] pb-40 px-8 bg-[var(--reader-bg)]">
            <div className="max-w-6xl mx-auto space-y-24">
                <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">The Rankings</p>
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">HALL OF <br />LEGENDS</h1>
                    <p className="text-zinc-500 max-w-xl text-sm leading-relaxed italic">
                        "The Library remembers those who breathe life into the silence. Here lie the records of our most resonant souls."
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {legends.map((legend, i) => (
                        <div key={i} className="glass-panel p-12 rounded-[2.5rem] border border-white/5 space-y-8 hover:border-[var(--reader-accent)]/30 transition-all group bg-white/[0.01] relative overflow-hidden">
                            <div className={`absolute inset-0 bg-gradient-to-br ${legend.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black italic">Legacy Tier {i + 1}</p>
                                <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{legend.icon}</span>
                            </div>

                            <div className="relative z-10 h-24 w-24 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 animate-pulse-slow" />
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${legend.name}`} 
                                    alt={legend.name}
                                    className="relative z-10 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            </div>

                            <div className="relative z-10 space-y-2">
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{legend.name}</h3>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">{legend.rank} Reader</p>
                            </div>

                            <div className="relative z-10 pt-6 border-t border-white/5 flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black italic">Popularity Score</p>
                                    <p className="text-3xl font-black text-white tracking-tighter italic">{legend.score}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-32 text-center border-t border-white/5">
                    <p className="text-zinc-700 text-[10px] italic uppercase tracking-[0.8em] font-black">The balance shifts with every heartbeat.</p>
                </div>
            </div>
        </main>
    );
}
