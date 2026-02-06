"use client";

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-black pt-32 pb-24 px-8">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-purple-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Document</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase">TERMS OF SERVICE</h1>
                </header>
                <article className="prose prose-invert prose-zinc max-w-none text-zinc-400 space-y-8 font-light">
                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">1. Acceptable Use</h2>
                        <p>Users must not upload malicious code or bypass platform restrictions.</p>
                    </section>
                </article>
            </div>
        </main>
    );
}
