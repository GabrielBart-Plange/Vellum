import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-[var(--reader-border)] bg-[var(--reader-footer-bg)] py-12 text-center text-sm text-[var(--reader-text-muted)]">
            <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-6">
                <div className="flex items-center gap-6 font-medium">
                    <Link href="/privacy" className="hover:text-[var(--reader-text)] transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-[var(--reader-text)] transition-colors">Terms</Link>
                    <Link href="/contact" className="hover:text-[var(--reader-text)] transition-colors">Contact</Link>
                    <a
                        href="https://discord.gg/QSmgvTwBUu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#5865F2] transition-colors"
                    >
                        Discord
                    </a>
                </div>
                <p>&copy; {new Date().getFullYear()} Vellum. All rights reserved.</p>
            </div>
        </footer>
    );
}
