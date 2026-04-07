import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: "Hall of Legends | Vellum Rankings",
  description: "Explore the most resonant souls in the Vellum digital archive. The definitive leaderboard of authors and readers.",
  openGraph: {
    title: "Hall of Legends | Vellum Rankings",
    description: "The archive remembers those who breathe life into the silence.",
    type: "website",
  }
};

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

async function getTopWorks(type: 'novel' | 'story') {
    try {
        const collectionName = type === 'novel' ? 'novels' : 'stories';
        const worksSnap = await adminDb.collection(collectionName)
            .where('published', '==', true)
            .orderBy('likes', 'desc')
            .limit(10)
            .get();
        
        return worksSnap.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            type: type
        }));
    } catch (error) {
        console.error(`Error fetching top ${type}s:`, error);
        return [];
    }
}

const getTierColor = (index: number) => {
    if (index === 0) return "from-amber-500/20";
    if (index === 1) return "from-blue-500/20";
    if (index === 2) return "from-purple-500/20";
    return "from-zinc-500/10";
};

const getTierIcon = (index: number) => {
    if (index === 0) return "💎";
    if (index === 1) return "✨";
    if (index === 2) return "🕯️";
    return "📜";
};

export default async function RankingPage({ searchParams }: PageProps) {
    const { type = 'novel' } = await searchParams;
    const activeType = type === 'story' ? 'story' : 'novel';
    const topWorks = await getTopWorks(activeType);
    
    return (
        <main className="min-h-screen text-[var(--reader-text)] pb-40 px-8 bg-[var(--reader-bg)]">
            <div className="max-w-6xl mx-auto space-y-24">
                <div className="pt-8">
                    <Breadcrumbs />
                </div>
                <header className="space-y-10 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <div className="space-y-6">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">The Rankings</p>
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">HALL OF <br />LEGENDS</h1>
                        <p className="text-zinc-500 max-w-xl text-sm leading-relaxed italic">
                            "The Library remembers those who breathe life into the silence. Here lie the records of our most resonant {activeType === 'novel' ? 'chronicles' : 'short stories'}."
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Link 
                            href="/ranking?type=novel" 
                            className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic border ${activeType === 'novel' ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                        >
                            Novels
                        </Link>
                        <Link 
                            href="/ranking?type=story" 
                            className={`px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic border ${activeType === 'story' ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                        >
                            Short Stories
                        </Link>
                    </div>
                </header>

                {topWorks.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {topWorks.slice(0, 3).map((work: any, i: number) => (
                                <Link href={work.type === 'novel' ? `/novel/${work.slug || work.id}` : `/stories/${work.alphanumericId || work.slug || work.id}`} key={work.id} className="glass-panel p-12 rounded-[2.5rem] border border-white/5 space-y-8 hover:border-[var(--reader-accent)]/30 transition-all group bg-white/[0.01] relative overflow-hidden block">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(i)} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                    
                                    <div className="relative z-10 flex justify-between items-start">
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-black italic">Legacy Tier {i + 1}</p>
                                        <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500">{getTierIcon(i)}</span>
                                    </div>

                                    <div className="relative z-10 h-24 w-24 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 shadow-2xl overflow-hidden">
                                        <div className="absolute inset-0 bg-white/5 animate-pulse-slow" />
                                        {work.coverImage ? (
                                            <img 
                                                src={work.coverImage} 
                                                alt={work.title}
                                                className="relative z-10 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <span className="relative z-10 text-white/20">📜</span>
                                        )}
                                    </div>

                                    <div className="relative z-10 space-y-2">
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none line-clamp-2">{work.title}</h3>
                                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">By {work.authorName}</p>
                                    </div>

                                    <div className="relative z-10 pt-6 border-t border-white/5 flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black italic">Resonance Score</p>
                                            <p className="text-3xl font-black text-white tracking-tighter italic">{(work.likes || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {topWorks.length > 3 && (
                            <div className="pt-24 space-y-12">
                                <h2 className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-black italic flex items-center gap-6">
                                    Rising {activeType === 'novel' ? 'Chronicles' : 'Stories'}
                                    <div className="h-px flex-1 bg-white/5" />
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {topWorks.slice(3).map((work: any, i: number) => (
                                        <Link href={work.type === 'novel' ? `/novel/${work.slug || work.id}` : `/stories/${work.alphanumericId || work.slug || work.id}`} key={work.id} className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-[var(--reader-accent)]/30 transition-all flex items-center gap-8 group bg-white/[0.01]">
                                            <span className="text-4xl font-black text-white/10 italic w-12">{i + 4}</span>
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-zinc-900 border border-white/5 flex items-center justify-center">
                                                {work.coverImage ? (
                                                    <img src={work.coverImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                                                ) : (
                                                    <span className="text-white/10">📜</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-black uppercase tracking-tight group-hover:text-[var(--reader-accent)] transition-colors">{work.title}</h4>
                                                <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold italic">By {work.authorName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-black italic tracking-tighter">{(work.likes || 0).toLocaleString()}</p>
                                                <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Resonance</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-40 text-center glass-panel rounded-[3rem] border border-white/5 bg-white/[0.01]">
                        <div className="text-4xl mb-6 opacity-20">📜</div>
                        <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black italic">The Rankings are being transcribed...</p>
                        <p className="text-zinc-600 text-xs mt-4 max-w-sm mx-auto leading-relaxed">Check back soon as more chronicles gather resonance in the digital archive.</p>
                    </div>
                )}

                <div className="pt-32 text-center border-t border-white/5">
                    <p className="text-zinc-700 text-[10px] italic uppercase tracking-[0.8em] font-black">The balance shifts with every heartbeat.</p>
                </div>
            </div>
        </main>
    );
}

