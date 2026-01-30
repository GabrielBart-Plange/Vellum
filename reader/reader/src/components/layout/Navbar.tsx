import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="text-xl font-light tracking-widest text-white hover:opacity-80 transition-opacity">
                    .15 CHRONICLES
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                    <Link href="/stories" className="hover:text-white transition-colors">
                        Stories
                    </Link>
                    <Link href="/novels" className="hover:text-white transition-colors">
                        Novels
                    </Link>
                    <Link href="/about" className="hover:text-white transition-colors">
                        About
                    </Link>
                </div>

                {/* Auth / Search Placeholder */}
                <div className="flex items-center gap-4">
                    {/* Search Icon Placeholder */}
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}
