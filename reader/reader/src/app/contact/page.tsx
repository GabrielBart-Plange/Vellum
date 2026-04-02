"use client";

export default function ContactPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8 bg-[var(--reader-bg)]">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black italic">The Connection</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">CONTACT <br />US</h1>
                </header>
                <div className="glass-panel p-12 rounded-[2.5rem] border border-white/5 space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <p className="text-zinc-400 text-lg font-light italic leading-relaxed relative z-10">
                        "We're always listening. Join the Discord to connect with the community and the team."
                    </p>
                    <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black italic">Community Nexus</p>
                            <a
                                href="https://discord.gg/QSmgvTwBUu"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-4 px-10 py-4 rounded-2xl bg-[#5865F2] text-white font-black uppercase tracking-[0.3em] text-[10px] hover:scale-105 transition-all shadow-[0_20px_40px_-10px_rgba(88,101,242,0.4)] italic"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.074 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/></svg>
                                Enter the Circle
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
