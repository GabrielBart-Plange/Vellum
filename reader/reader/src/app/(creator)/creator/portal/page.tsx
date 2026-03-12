import Link from "next/link";

const readerUrl = process.env.NEXT_PUBLIC_READER_URL || "http://localhost:3001";

export default function PortalPage() {
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-6 py-24">
            <div className="w-full max-w-4xl space-y-10">
                <header className="text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-text-subtle)] font-bold">Vellum Portal</p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Choose Your Path</h1>
                    <p className="text-[var(--reader-text)]/70 max-w-2xl mx-auto">
                        Enter the Reader realm to explore stories, or step into the Creator studio to craft new works.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <a
                        href={readerUrl}
                        className="glass-panel rounded-3xl border border-white/5 p-8 md:p-10 hover:border-[var(--accent-lime)]/40 transition-all group"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--accent-lime)] font-black">Reader</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-4">Enter the Archive</h2>
                        <p className="text-[var(--reader-text)]/70 mt-3">
                            Discover stories, follow authors, and build your personal library.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[var(--accent-lime)]">
                            Open Reader
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </a>

                    <Link
                        href="/dashboard"
                        className="glass-panel rounded-3xl border border-white/5 p-8 md:p-10 hover:border-[var(--reader-accent)]/40 transition-all group"
                    >
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black">Creator</p>
                        <h2 className="text-2xl font-black uppercase tracking-tight mt-4">Enter the Studio</h2>
                        <p className="text-[var(--reader-text)]/70 mt-3">
                            Write, publish, and manage your visual works.
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold text-[var(--reader-accent)]">
                            Open Creator
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
