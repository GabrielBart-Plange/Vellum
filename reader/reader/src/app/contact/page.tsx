"use client";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-black pt-32 pb-24 px-8">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-[var(--accent-lime)] pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Support</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase">COMMUNICATIONS</h1>
                </header>
                <div className="glass-panel p-12 rounded-3xl border border-white/5 space-y-8">
                    <p className="text-zinc-400 text-lg font-light">
                        For inquiries regarding the archives, please reach out via our community nexus.
                    </p>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Community Nexus</p>
                            <a
                                href="https://discord.gg/DWrHwZRvNq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-8 py-3 rounded-xl bg-[#5865F2] text-white font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-[0_0_20px_-5px_#5865F2]"
                            >
                                Join the Discord
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
