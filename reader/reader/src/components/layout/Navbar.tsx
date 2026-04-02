"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import SearchModal from "./SearchModal";
import { useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where, doc, updateDoc, writeBatch, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const creatorUrl = process.env.NEXT_PUBLIC_CREATOR_URL || "http://localhost:3000";

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            limit(20)
        );

        const unsubscribe = onSnapshot(q,
            (snap) => {
                const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setNotifications(results);
            },
            (error) => {
                console.error("Archive Listener Error:", error.code, error.message);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const markAllRead = async () => {
        if (!user || unreadCount === 0) return;
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
            batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
        });
        await batch.commit();
    };

    const navLinks = [
        { name: "Stories", href: "/stories", tooltip: "Browse Sagas" },
        { name: "Novels", href: "/novel", tooltip: "Explore Tomes" },
        { name: "Nexus", href: "/nexus", tooltip: "Premium Picks" },
        { name: "Gallery", href: "/art", tooltip: "Visual Archives" },
        { name: "Settings", href: "/settings", tooltip: "Calibrate Persona" },
        { name: "Profile", href: user ? `/authors/${user.uid}` : "/profile", tooltip: "Your Scroll" },
        { name: "About", href: "/about", tooltip: "The Lore" },
        { name: "Portal", href: "/portal", tooltip: "Choose Calling" },
        { name: "Library", href: user ? `/authors/${user.uid}?tab=collections` : "/library", tooltip: "Reading Vault" },
        { name: "Rankings", href: "/ranking", tooltip: "Hall of Legends" },
    ];

    if (pathname?.startsWith("/creator")) return null;

    return (
        <>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <nav className="sticky top-0 z-[100] w-full glass-panel shadow-sm">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    <Link href="/" className="text-xl font-black tracking-tighter text-[var(--reader-text)] hover:opacity-80 transition-all flex items-center gap-3 italic" title="Vellum Home">
                        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center overflow-hidden hover:rotate-6 transition-transform duration-500 drop-shadow-xl">
                            <Image src="/logo.png" alt="Vellum Wax Seal" fill className="object-contain" />
                        </div>
                        VELLUM
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--reader-text-subtle)] italic">
                        {navLinks.slice(0, 4).map((link) => (
                            <Link 
                                key={link.name} 
                                href={link.href} 
                                className="hover:text-[var(--reader-accent)] transition-colors relative group"
                                title={link.tooltip}
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[var(--reader-accent)] transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    {/* Auth / Search / Menu */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/creator/dashboard"
                            className="hidden md:inline text-[12px] uppercase tracking-widest text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-colors"
                        >
                            Creator
                        </Link>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-colors"
                            title="Search"
                            aria-label="Search"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </button>

                        {user && (
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        if (!isNotificationOpen) markAllRead();
                                    }}
                                    className="text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-colors relative"
                                    title="Transmissions"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-4 w-80 rounded-2xl bg-[var(--reader-bg)] border border-[var(--reader-border)] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-[150]">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--reader-border)]">
                                            <span className="text-[10px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Transmissions</span>
                                            <button onClick={() => setIsNotificationOpen(false)} className="text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-colors">✕</button>
                                        </div>
                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 leading-tight">
                                            {notifications.length === 0 ? (
                                                <div className="py-8 text-center text-[var(--reader-text-subtle)] text-[10px] uppercase tracking-widest">No recent alerts</div>
                                            ) : (
                                                notifications.map(n => (
                                                    <Link
                                                        key={n.id}
                                                        href={n.link}
                                                        onClick={() => setIsNotificationOpen(false)}
                                                        className={`block p-3 rounded-xl hover:bg-[var(--reader-text)]/5 transition-all space-y-1 ${!n.read ? "border-l-2 border-[var(--reader-accent)]" : ""}`}
                                                    >
                                                        <p className="text-[11px] font-bold text-[var(--reader-text)] uppercase tracking-tight">{n.title}</p>
                                                        <p className="text-[10px] text-[var(--reader-text-muted)] line-clamp-2">{n.message}</p>
                                                        <p className="text-[8px] text-[var(--reader-text-subtle)] uppercase font-black">{n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString() : "Just now"}</p>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="rounded-full bg-white text-black px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] italic active:scale-95"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-white text-black px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] italic active:scale-95"
                            >
                                Sign In
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden text-[var(--reader-text)] p-1 z-[110]"
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
            <div className={`fixed inset-0 z-[90] bg-[var(--reader-bg)]/95 backdrop-blur-2xl transition-all duration-500 overflow-hidden ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"}`}>
                {/* Nebula Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                    <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
                </div>

                <div className="max-w-xl mx-auto px-6 pt-32 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-text-subtle)] font-black italic">Navigation</h2>
                        <div className="h-px flex-1 bg-white/5 mx-8" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[var(--reader-accent)]/30 transition-all text-center flex flex-col items-center gap-3 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--reader-accent)]/0 group-hover:bg-[var(--reader-accent)]/20 transition-all" />
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--reader-text-muted)] group-hover:text-white transition-colors italic">{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto mb-16 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/5" />
                            <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-black italic">Member Access</p>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="block w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] hover:bg-zinc-200 transition-all active:scale-95 italic text-center"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/signup"
                                onClick={() => setIsMenuOpen(false)}
                                className="block w-full py-5 rounded-2xl bg-[var(--reader-accent)] text-white font-black uppercase tracking-[0.3em] text-[11px] hover:opacity-90 transition-all active:scale-95 italic text-center shadow-[0_20px_40px_-10px_rgba(139,92,246,0.3)]"
                            >
                                Join Vellum
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
