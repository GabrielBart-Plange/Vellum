import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-[var(--reader-border)] bg-[var(--reader-footer-bg)] py-20 text-center">
            <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-12">
                <div className="space-y-4 max-w-md">
                    <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-white/40 italic">The Final Word</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed italic">
                        "Stories are the threads that bind us. Join our circle and help weave the next grand saga."
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 font-black uppercase tracking-[0.2em] text-[10px] text-[var(--reader-text-subtle)]">
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
                    <a
                        href="https://discord.gg/QSmgvTwBUu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#5865F2] transition-colors flex items-center gap-2"
                    >
                        <span>Join the Discord</span>
                        <div className="w-1 h-1 rounded-full bg-[#5865F2] animate-pulse" />
                    </a>
                </div>
                
                <div className="space-y-2">
                    <div className="h-px w-12 bg-white/10 mx-auto" />
                    <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold">
                        &copy; {new Date().getFullYear()} Vellum. Preserved for the generations.
                    </p>
                </div>
            </div>
        </footer>
    );
}
