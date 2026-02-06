"use client";

import Link from "next/link";

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md space-y-12 relative z-10 text-center">
                <header className="space-y-4">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase italic">.15 Chronicles</Link>
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-bold">Authentication Node</p>
                </header>

                <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-8">
                    <div className="space-y-6">
                        <button className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
                            Google Entrance
                        </button>
                        <div className="flex items-center gap-4 text-zinc-700">
                            <div className="h-px flex-1 bg-zinc-900" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Or</span>
                            <div className="h-px flex-1 bg-zinc-900" />
                        </div>
                        <input
                            type="email"
                            placeholder="ARCHIVIST MAIL"
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-zinc-700"
                        />
                        <button className="w-full py-4 rounded-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
                            Request Access
                        </button>
                    </div>
                </div>

                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    New Archivist? <Link href="/signup" className="text-white hover:text-[var(--accent-sakura)] transition-colors">Join the Archives</Link>
                </p>
            </div>
        </main>
    );
}
