"use client";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-black pt-32 pb-24 px-8">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-blue-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Document</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase">PRIVACY POLICY</h1>
                </header>
                <article className="prose prose-invert prose-zinc max-w-none text-zinc-400 space-y-8 font-light">
                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">1. Information We Collect</h2>
                        <p>We collect minimal information required for authentication and personalized reading experiences.</p>
                    </section>
                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">2. Security</h2>
                        <p>All data is secured via Firebase industry-standard encryption protocols.</p>
                    </section>
                </article>
            </div>
        </main>
    );
}
