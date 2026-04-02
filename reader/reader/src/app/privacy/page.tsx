"use client";

export default function PrivacyPage() {
    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8">
            <div className="max-w-3xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-blue-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Document</p>
                    <h1 className="text-5xl font-black tracking-tighter text-[var(--reader-heading)] uppercase">PRIVACY POLICY</h1>
                </header>
                <article className="prose prose-invert prose-zinc max-w-none space-y-12 font-light">
                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">1. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Information</strong>: Name, email, and password provided during registration.</li>
                            <li><strong>Reading Behavior</strong>: We track chapters read, time spent, bookmarks, and engagement to personalize your experience.</li>
                            <li><strong>Payment Data</strong>: Processed via secure third-party providers. Vellum does not store full credit card or MoMo PIN details directly.</li>
                            <li><strong>Technical Data</strong>: IP address, device type, and browser info for security and analytics.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">2. How We Use Your Data</h2>
                        <p>To provide and maintain the Vellum service, personalize recommendations, process payments, and calculate the "Creator's Cut" for authors.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">3. Data Sharing & Transparency</h2>
                        <p>We do not sell your personal data. We only share data with service providers (e.g. Paystack, Firebase) necessary for operational purposes.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">4. Your Rights</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Access, update, or delete your personal information.</li>
                            <li>Opt-out of marketing communications.</li>
                            <li><strong>Data Portability</strong>: Request a machine-readable export of your data.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-white uppercase tracking-widest text-sm font-black">5. Children's Privacy</h2>
                        <p>Vellum is not intended for users under the age of 13. If we discover data from a minor has been collected without consent, we will delete it immediately.</p>
                    </section>
                </article>
            </div>
        </main>
    );
}
