"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

const premiumPicks = [
    {
        id: "nexus-1",
        title: "The Gilded Sovereign",
        author: "Archivist Elara",
        image: "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1000",
        type: "Novel",
        description: "A tale of power, betrayals, and the cost of eternal Gilt."
    },
    {
        id: "nexus-2",
        title: "Neon Grimoire",
        author: "Scribe 73",
        image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000",
        type: "Graphic Novel",
        description: "In the heart of the Vellum Nexus, digital magic is real."
    },
    {
        id: "nexus-3",
        title: "Ruins of Aethelgard",
        author: "The Chronicler",
        image: "https://images.unsplash.com/photo-1444464666168-49d633b867ad?q=80&w=1000",
        type: "Epic Fantasy",
        description: "Uncovering the lost history of the first ascension."
    }
];

export default function NexusPool() {
    const { monetization } = useAuth();
    const isNexus = monetization?.subscriptionTier === 'nexus';

    if (!isNexus) {
        return (
            <div className="glass-panel p-12 rounded-3xl border border-white/5 bg-zinc-900/40 text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <span className="text-2xl">🔒</span>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">The Nexus Pool</h3>
                    <p className="text-zinc-400 max-w-sm mx-auto">
                        This exclusive sanctuary is reserved for **Vellum Nexus** subscribers. Unlock to access premium picks and the Level 9 Sovereign Pool.
                    </p>
                </div>
                <Link 
                    href="/settings" 
                    className="inline-block px-8 py-3 bg-purple-600 text-white text-[12px] font-black uppercase tracking-widest rounded-full hover:bg-purple-500 transition-colors"
                >
                    Upgrade to Nexus
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <header className="flex justify-between items-end">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400 font-black">Nexus Sanctuary</p>
                    <h2 className="text-4xl font-black uppercase tracking-tight text-white italic">Premium Picks</h2>
                </div>
                <div className="hidden md:block text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-l border-white/10 pl-6 mb-1">
                    Updated Weekly • Powered by Vellum AI
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {premiumPicks.map((pick) => (
                    <div key={pick.id} className="group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                            <Image 
                                src={pick.image} 
                                alt={pick.title} 
                                fill 
                                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                <p className="text-[9px] uppercase tracking-widest text-purple-400 font-black mb-1">{pick.type}</p>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">{pick.title}</h3>
                                <p className="text-[10px] text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors">By {pick.author}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-[11px] text-zinc-500 line-clamp-2 italic leading-relaxed">
                            "{pick.description}"
                        </p>
                    </div>
                ))}
            </div>

            <footer className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-4">
                    <button className="px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white transition-all">
                        View Full Archive
                    </button>
                    <button className="px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white transition-all">
                        Nexus Discord
                    </button>
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-purple-400/60 font-black">
                    Level 9 Elder Dividend: +2.4% this week
                </div>
            </footer>
        </div>
    );
}
