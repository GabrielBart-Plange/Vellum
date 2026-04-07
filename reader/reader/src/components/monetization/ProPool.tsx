"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

const premiumPicks = [
    {
        id: "pro-1",
        title: "The Gilded Sovereign",
        author: "Archivist Elara",
        image: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1000",
        type: "Novel",
        description: "A tale of power, betrayals, and the cost of eternal Gilt."
    },
    {
        id: "pro-2",
        title: "Neon Grimoire",
        author: "Scribe 73",
        image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000",
        type: "Graphic Novel",
        description: "In the heart of the Vellum Pro, digital magic is real."
    },
    {
        id: "pro-3",
        title: "Ruins of Aethelgard",
        author: "The Chronicler",
        image: "https://images.unsplash.com/photo-1444464666168-49d633b867ad?q=80&w=1000",
        type: "Epic Fantasy",
        description: "Uncovering the lost history of the first ascension."
    }
];

export default function ProPool() {
    const { monetization } = useAuth();
    const isPro = monetization?.subscriptionTier === 'pro';

    if (!isPro) {
        return (
            <div className="glass-panel p-16 rounded-[2.5rem] border border-white/5 bg-white/[0.01] text-center space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div className="mx-auto w-20 h-20 rounded-full bg-[var(--reader-accent)]/10 flex items-center justify-center border border-[var(--reader-accent)]/30 shadow-[0_0_30px_rgba(139,92,246,0.2)] animate-pulse">
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">🔒</span>
                </div>
                <div className="space-y-3 relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white italic">The Pro Pool</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto text-[11px] uppercase tracking-[0.2em] font-black italic leading-relaxed">
                        This exclusive area is reserved for **Vellum Pro** members. Upgrade to access premium picks and exclusive rewards.
                    </p>
                </div>
                <Link 
                    href="/settings" 
                    className="inline-block px-12 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] italic"
                >
                    Upgrade to Pro
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end border-b border-white/5 pb-8">
                <div className="space-y-2 border-l-2 border-[var(--reader-accent)]/30 pl-8">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black italic">Pro Sanctuary</p>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white italic leading-none">Premium Picks</h2>
                </div>
                <div className="hidden md:block text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black italic border-l border-white/10 pl-8 mb-1">
                    Updated Weekly <br />Premium Collection
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {premiumPicks.map((pick) => (
                    <div key={pick.id} className="group cursor-pointer space-y-6">
                        <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl transition-all duration-700 group-hover:scale-[1.02] group-hover:border-[var(--reader-accent)]/30 group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]">
                            <Image 
                                src={pick.image} 
                                alt={pick.title} 
                                fill 
                                className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black mb-2 italic">{pick.type}</p>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{pick.title}</h3>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic group-hover:text-zinc-300 transition-colors">scribed by {pick.author}</p>
                            </div>
                        </div>
                        <p className="px-2 text-[11px] text-zinc-500 line-clamp-2 italic leading-relaxed font-medium">
                            "{pick.description}"
                        </p>
                    </div>
                ))}
            </div>

            <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex gap-6">
                    <button className="px-10 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 transition-all italic">
                        View Full Archive
                    </button>
                    <button className="px-10 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-white/5 transition-all italic">
                        Pro Discord
                    </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--reader-accent)] font-black italic">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--reader-accent)] animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    Level 9 Elder Dividend: +2.4%
                </div>
            </footer>
        </div>
    );
}
