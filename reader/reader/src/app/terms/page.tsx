"use client";

export default function TermsPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-purple-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Document</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase">TERMS OF SERVICE</h1>
                </header>
                <article className="prose prose-invert prose-zinc max-w-none space-y-12 font-light">
                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">1. The Archivist's Creed</h2>
                        <p>Vellum is a platform dedicated to the preservation and promotion of serialized fiction. We aim to provide a fair, transparent, and rewarding environment for both Readers ("Archivists") and Creators ("Authors").</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">2. User Accounts & Privacy</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Users must be at least 13 years old.</li>
                            <li>You are responsible for the security of your account and all activities under your credentials.</li>
                            <li>Your data and privacy are governed by our Privacy Policy.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">3. Content Ownership & Creator Rights</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Copyright Protection</strong>: Authors retain 100% copyright ownership of their original works.</li>
                            <li><strong>Licensing</strong>: You grant Vellum a non-exclusive, worldwide, royalty-free license to host, display, and promote your work. We do not claim ownership of your intellectual property.</li>
                            <li><strong>Termination</strong>: Authors may remove their content from the platform at any time. However, to protect Readers who have already purchased access, a 30-day "unwinding" period applies.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">4. Digital Currencies & Economy</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Gilt (Hard Currency)</strong>: Purchased via real-world currency (MoMo/Card). Valued at 10 Gilt = GHS 2.00. Non-refundable.</li>
                            <li><strong>Inklets (Soft Currency)</strong>: Daily reward currency earned through engagement. Used for temporary chapter unlocks. No cash value.</li>
                            <li><strong>Vellux (Support Tokens)</strong>: Granted based on activity or subscription tiers. Used to boost story rankings.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">5. Subscription Levels</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-white font-bold text-xs uppercase mb-2">Vellum Prime (GHS 5/week)</h3>
                                <p className="text-sm">Includes Ad-Free reading, 24h Early Access, and 50 Inklets credited weekly.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xs uppercase mb-2">Vellum Nexus (GHS 20/month)</h3>
                                <p className="text-sm">Includes all Prime perks plus 3 monthly Premium Picks, 1 Gold Vellux token, and an exclusive Profile Aura.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">6. The Archivist's Cut</h2>
                        <p>Creators receive 70% of net revenue from Gilt transactions after fees. Vellum retains 25% for maintenance, and 5% is allocated to the Level 9 Elder Pool for top community contributors.</p>
                    </section>
                </article>
            </div>
        </main>
    );
}
