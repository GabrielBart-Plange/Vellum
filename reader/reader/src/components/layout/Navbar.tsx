"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: "Stories", href: "/stories" },
        { name: "Novels", href: "/novels" },
        { name: "About", href: "/about" },
        { name: "Library", href: "/library" },
        { name: "Ranking", href: "/ranking" },
    ];

    return (
        <>
            <nav className="sticky top-0 z-[100] w-full glass-panel shadow-sm">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full border border-purple-500/50 flex items-center justify-center text-[10px]">15</div>
                        15CHRONICLES
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-zinc-400">
                        {navLinks.slice(0, 3).map((link) => (
                            <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth / Search / Menu */}
                    <div className="flex items-center gap-4">
                        <button className="text-zinc-400 hover:text-white transition-colors hidden sm:block">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </button>
                        <Link
                            href="/login"
                            className="rounded-full bg-[var(--accent-lime)] px-5 py-1.5 text-[12px] font-bold text-black hover:bg-white transition-all shadow-[0_0_20px_-5px_var(--glow-lime)]"
                        >
                            Sign In
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden text-white p-1 z-[110]"
                        >
                            {isMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 z-[90] bg-[#0b0a0f]/95 backdrop-blur-2xl transition-all duration-500 overflow-hidden ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
                {/* Nebula Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                    <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
                </div>

                <div className="max-w-xl mx-auto px-6 pt-32 h-full flex flex-col">
                    <h2 className="text-[10px] uppercase tracking-[0.6em] text-zinc-600 font-bold mb-8">Navigation Node</h2>

                    <div className="grid grid-cols-2 gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all text-center flex flex-col items-center gap-3"
                            >
                                <span className="text-sm font-bold tracking-widest text-zinc-300 group-hover:text-white transition-colors">{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto mb-12 p-8 glass-panel rounded-3xl border border-white/5 text-center">
                        <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500 mb-6 font-bold">Member Access</p>
                        <Link
                            href="/signup"
                            className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold uppercase tracking-[0.2em] premium-glow text-center"
                        >
                            Join the Archives
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
