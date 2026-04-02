"use client";

export default function AboutPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8 text-center">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                    <p className="text-[11px] uppercase tracking-[1em] text-[var(--accent-sakura)] font-black">The Heartbeat</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic">Vellum</h1>
                </header>
                <div className="space-y-12 text-xl leading-relaxed font-light max-w-2xl mx-auto">
                    <p className="text-zinc-300">
                        Vellum isn't just a platform; it's a living archive. We believe that every story is a heartbeat, a legacy that deserves to be preserved in its purest form.
                    </p>
                    <p className="text-zinc-400">
                        In an age of endless noise, we've built a sanctuary for the craft. A place where creators weave worlds and readers find home, distraction-free and community-driven.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                    <div className="space-y-4">
                        <p className="text-3xl font-black text-white italic">01</p>
                        <p className="text-[10px] uppercase tracking-widest font-black text-purple-400">The Creator</p>
                        <p className="text-xs text-zinc-500 leading-tight">Empowering authors with tools to publish their grandest stories.</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-3xl font-black text-white italic">02</p>
                        <p className="text-[10px] uppercase tracking-widest font-black text-amber-400">The Reader</p>
                        <p className="text-xs text-zinc-500 leading-tight">Immersing readers in a world of high-fidelity storytelling.</p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-3xl font-black text-white italic">03</p>
                        <p className="text-[10px] uppercase tracking-widest font-black text-emerald-400">The Library</p>
                        <p className="text-xs text-zinc-500 leading-tight">Preserving human creativity for the generations to come.</p>
                    </div>
                    </div>
                </div>
                <div className="pt-12">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto" />
                </div>
            </div>
        </main>
    );
}
