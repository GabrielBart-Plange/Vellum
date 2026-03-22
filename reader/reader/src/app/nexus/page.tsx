"use client";

import NexusPool from "@/components/monetization/NexusPool";
import WalletCard from "@/components/monetization/WalletCard";

export default function NexusPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8 bg-zinc-950">
            <div className="w-full max-w-6xl mx-auto space-y-24">
                <header className="space-y-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-purple-500 font-bold">Vellum Chronicles</p>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">The Nexus Hub</h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-sm leading-relaxed uppercase tracking-widest font-medium">
                        Your central command for wealth, wisdom, and exclusive chronicles. 
                        Manage your Gilt and explore the high-fidelity archives.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    <section className="lg:col-span-1 sticky top-40">
                        <WalletCard />
                        <div className="mt-8 p-8 glass-panel rounded-3xl border border-white/5 bg-zinc-900/10 space-y-4">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Subscription Perks</p>
                            <ul className="space-y-3">
                                {[
                                    { text: "Ad-free exploration", icon: "✨" },
                                    { text: "Weekly Gilt stipend (Nexus only)", icon: "💎" },
                                    { text: "Early Access to Vellum Prime", icon: "🗝️" },
                                    { text: "Sovereign Pool Voting", icon: "🏛️" }
                                ].map((perk, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                                        <span>{perk.icon}</span>
                                        {perk.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section className="lg:col-span-2">
                        <NexusPool />
                    </section>
                </div>
            </div>
        </main>
    );
}
