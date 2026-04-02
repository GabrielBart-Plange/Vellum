import Link from "next/link";

const creatorUrl = process.env.NEXT_PUBLIC_CREATOR_URL || "http://localhost:3000";

export default function PortalPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8 bg-[var(--reader-bg)]">
            <div className="w-full max-w-5xl mx-auto space-y-16">
                <header className="text-center space-y-6">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-[var(--reader-accent)] font-black italic">Role Selection</p>
                    <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8]">CHOOSE <br />YOUR PATH</h1>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-[11px] leading-relaxed uppercase tracking-[0.2em] font-black italic">
                        "Every soul finds their story. Step into the Library to find your story, or enter the Studio to write a new one."
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Link
                        href="/"
                        className="glass-panel rounded-[2.5rem] border border-white/5 p-10 hover:border-indigo-500/40 transition-all group bg-white/[0.01] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-black italic">The Reader</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-6 italic leading-none">Enter the Library</h2>
                        <p className="text-zinc-500 mt-4 text-sm leading-relaxed italic">
                            Discover original sagas, connect with authors, and build your personal collection.
                        </p>
                        <div className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-white italic group-hover:text-indigo-400 transition-colors">
                            Begin Journey
                            <span className="transition-transform group-hover:translate-x-2">→</span>
                        </div>
                    </Link>

                    <Link
                        href="/creator/dashboard"
                        className="glass-panel rounded-[2.5rem] border border-white/5 p-10 hover:border-purple-500/40 transition-all group bg-white/[0.01] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400 font-black italic">The Creator</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-6 italic leading-none">Enter the Dashboard</h2>
                        <p className="text-zinc-500 mt-4 text-sm leading-relaxed italic">
                            Write your stories, publish your visions, and manage your visual masterpieces.
                        </p>
                        <div className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-white italic group-hover:text-purple-400 transition-colors">
                            Start Writing
                            <span className="transition-transform group-hover:translate-x-2">→</span>
                        </div>
                    </Link>

                    <a
                        href="https://discord.gg/QSmgvTwBUu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-panel rounded-[2.5rem] border border-white/5 p-10 hover:border-[#5865F2]/40 transition-all group bg-white/[0.01] relative overflow-hidden lg:col-span-1 md:col-span-2"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[#5865F2] font-black italic">The Circle</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-6 italic leading-none">Join the Nexus</h2>
                        <p className="text-zinc-500 mt-4 text-sm leading-relaxed italic">
                            Connect with fellow chroniclers and discuss the archives in real-time.
                        </p>
                        <div className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-black text-white italic group-hover:text-[#5865F2] transition-colors">
                            Join the Community
                            <span className="transition-transform group-hover:translate-x-2">→</span>
                        </div>
                    </a>
                </div>
            </div>
        </main>
    );
}
