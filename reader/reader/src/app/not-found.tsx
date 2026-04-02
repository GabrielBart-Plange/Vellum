import Link from "next/link";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[#0b0a0f] flex flex-col items-center justify-center px-6 overflow-hidden relative">
            {/* Nebula Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
            <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent-sakura)]/5 blur-[100px] rounded-full -z-10" />

            {/* Error Content */}
            <div className="text-center space-y-8 max-w-lg">
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-black animate-fade-in">Transmission Interrupted</p>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-zinc-600 italic">
                        LOST
                    </h1>
                </div>

                <div className="space-y-4">
                    <p className="text-xl md:text-2xl font-light text-zinc-300 leading-relaxed italic">
                        "The archive has shifted. This chronicle is currently unreachable or has been redacted by the curators."
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">
                        Archive node not found in the collective consciousness.
                    </p>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="px-12 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95"
                    >
                        Return Home
                    </Link>
                    <Link
                        href="/stories"
                        className="px-12 py-4 rounded-2xl border border-white/10 glass-panel text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 transition-all"
                    >
                        Explore Tales
                    </Link>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-20">
                <div className="h-px w-12 bg-zinc-500" />
                <span className="brand-highlight text-[10px] uppercase tracking-[0.6em]">VELLUM ARCHIVES</span>
                <div className="h-px w-12 bg-zinc-500" />
            </div>
        </main>
    );
}
