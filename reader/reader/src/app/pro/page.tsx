"use client";

import ProPool from "@/components/monetization/ProPool";
import WalletCard from "@/components/monetization/WalletCard";

export default function ProPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8 bg-[var(--reader-bg)]">
            <div className="w-full max-w-6xl mx-auto space-y-24">
                <header className="space-y-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-[var(--reader-accent)] font-black italic">Premium Membership</p>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8]">THE <br />PRO</h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-[11px] leading-relaxed uppercase tracking-[0.2em] font-black italic">
                        The ultimate sanctuary for the most dedicated chroniclers. 
                        Maximize your rewards, unlock every Archive, and influence the Vellum governance.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                    <section className="lg:col-span-1 sticky top-40 space-y-8">
                        <WalletCard />
                        <div className="p-10 glass-panel rounded-[2.5rem] border border-white/5 bg-white/[0.01] space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Pro Membership</p>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Pro Perks</h3>
                            </div>
                            <ul className="space-y-6">
                                {[
                                    { text: "Ad-free exploration", icon: "✨", color: "text-blue-400" },
                                    { text: "Monthly Gilt stipend", icon: "💎", color: "text-amber-400" },
                                    { text: "Vellum Plus Access", icon: "🗝️", color: "text-purple-400" },
                                    { text: "Exclusive Pro Pool", icon: "💎", color: "text-emerald-400" },
                                    { text: "Governance Voting", icon: "🏛️", color: "text-white" }
                                ].map((perk, i) => (
                                    <li key={i} className="flex items-center gap-4 text-[11px] text-zinc-500 font-black uppercase tracking-widest italic group/item">
                                        <span className={`text-lg grayscale group-hover/item:grayscale-0 transition-all ${perk.color}`}>{perk.icon}</span>
                                        <span className="group-hover/item:text-zinc-300 transition-colors">{perk.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section className="lg:col-span-2">
                        <ProPool />
                    </section>
                </div>
            </div>
        </main>
    );
}
