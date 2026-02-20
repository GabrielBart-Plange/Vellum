import Link from "next/link";

const creatorUrl = process.env.NEXT_PUBLIC_CREATOR_URL || "http://localhost:3000";

export default function PortalPage() {
    return (
        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-24">
            <div className="w-full max-w-4xl space-y-10">
                <header className="text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-bold">Chronicles Portal</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Choose Your Path</h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        Enter the Reader realm to explore stories, or step into the Creator studio to craft new chronicles.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/"
                        className="glass-panel rounded-3xl border border-white/5 p-8 md:p-10 hover:border-[var(--accent-lime)]/40 transition-all group"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--accent-lime)] font-black">Reader</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-4">Enter the Archive</h2>
                        <p className="text-zinc-400 mt-3">
                            Discover stories, follow authors, and build your personal library.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[var(--accent-lime)]">
                            Open Reader
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </Link>

                    <a
                        href={creatorUrl}
                        className="glass-panel rounded-3xl border border-white/5 p-8 md:p-10 hover:border-purple-500/40 transition-all group"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400 font-black">Creator</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-4">Enter the Studio</h2>
                        <p className="text-zinc-400 mt-3">
                            Write, publish, and manage your visual chronicles.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-purple-400">
                            Open Creator
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </a>

                    <a
                        href="https://discord.gg/DWrHwZRvNq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-panel rounded-3xl border border-white/5 p-8 md:p-10 hover:border-[#5865F2]/40 transition-all group"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[#5865F2] font-black">Community</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-4">Join the Nexus</h2>
                        <p className="text-zinc-400 mt-3">
                            Connect with fellow chronicles and discuss the archives in real-time.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[#5865F2]">
                            Join Discord
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </a>
                </div>
            </div>
        </main>
    );
}
