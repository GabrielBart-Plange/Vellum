"use client";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black pt-32 pb-24 px-8 text-center">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                    <p className="text-[11px] uppercase tracking-[1em] text-[var(--accent-sakura)] font-black">History</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE PROJECT</h1>
                </header>
                <div className="space-y-8 text-zinc-400 text-lg leading-relaxed font-light">
                    <p>
                        .15 Chronicles is a decentralized archive of creative storytelling.
                        We believe in the power of the written word, preserved for eternity.
                    </p>
                    <p>
                        A collaborative initiative where authors and readers meet in a premium,
                        distraction-free environment.
                    </p>
                </div>
                <div className="pt-12">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-auto" />
                </div>
            </div>
        </main>
    );
}
