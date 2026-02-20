"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
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
            router.push('/');
        } catch (error) {
            console.error('Sign out error:', error);
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

        console.log(`[Archive] Listening for: users/${user.uid}/notifications`);

        const unsubscribe = onSnapshot(q,
            (snap) => {
                const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setNotifications(results);
            },
            (error) => {
                console.error("Archive Listener Error:", error.code, error.message);
                console.error("Debug Context - UID:", user.uid, "Path:", `users/${user.uid}/notifications`);
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
        { name: "Stories", href: "/stories" },
        { name: "Novels", href: "/novels" },
        { name: "About", href: "/about" },
        { name: "Portal", href: "/portal" },
        { name: "Library", href: "/library" },
        { name: "Ranking", href: "/ranking" },
    ];

    // Hide Navbar on Creator Dashboard to prevent overlap
    if (pathname?.startsWith("/creator")) return null;

    return (
        <>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <nav className="sticky top-0 z-[100] w-full glass-panel shadow-sm">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity flex items-center gap-3">
                        <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-[#8b0000] to-[#4a0000] flex items-center justify-center text-[14px] font-serif shadow-[0_2px_10px_rgba(139,0,0,0.5)] border border-[#a52a2a]/30 before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)] overflow-hidden">
                            <span className="relative z-10 text-[#aa8e45] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">V</span>
                            <div className="absolute inset-0.5 rounded-full border border-black/10 opacity-30"></div>
                        </div>
                        VELLUM
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-zinc-400">
                        {navLinks.slice(0, 4).map((link) => (
                            <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth / Search / Menu */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/creator/dashboard"
                            className="hidden md:inline text-[12px] uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                            Archivist
                        </Link>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="text-zinc-400 hover:text-white transition-colors"
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
                                    className="text-zinc-400 hover:text-white transition-colors relative"
                                    title="Notifications"
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
                                    <div className="absolute right-0 mt-4 w-80 rounded-2xl bg-[#0b0a0f] border border-white/10 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-[150]">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Archive Transmissions</span>
                                            <button onClick={() => setIsNotificationOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                                        </div>
                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 leading-tight">
                                            {notifications.length === 0 ? (
                                                <div className="py-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest">No recent transmissions</div>
                                            ) : (
                                                notifications.map(n => (
                                                    <Link
                                                        key={n.id}
                                                        href={n.link}
                                                        onClick={() => setIsNotificationOpen(false)}
                                                        className={`block p-3 rounded-xl hover:bg-white/5 transition-all space-y-1 ${!n.read ? 'border-l-2 border-purple-500' : ''}`}
                                                    >
                                                        <p className="text-[11px] font-bold text-zinc-100 uppercase tracking-tight">{n.title}</p>
                                                        <p className="text-[10px] text-zinc-400 line-clamp-2">{n.message}</p>
                                                        <p className="text-[8px] text-zinc-600 uppercase font-black">{n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString() : 'Just now'}</p>
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
                                className="rounded-full bg-[var(--accent-lime)] px-5 py-1.5 text-[12px] font-bold text-white hover:bg-white/90 transition-all shadow-[0_0_20px_-5px_var(--glow-lime)]"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-[var(--accent-lime)] px-5 py-1.5 text-[12px] font-bold text-white hover:bg-white/90 transition-all shadow-[0_0_20px_-5px_var(--glow-lime)]"
                            >
                                Sign In
                            </Link>
                        )}

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
                        <Link
                            href="/creator/dashboard"
                            className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 transition-all text-center flex flex-col items-center gap-3"
                        >
                            <span className="text-sm font-bold tracking-widest text-zinc-300 group-hover:text-white transition-colors">Archivist</span>
                        </Link>
                    </div>

                    <div className="mt-auto mb-12 p-8 glass-panel rounded-3xl border border-white/5 text-center">
                        <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500 mb-6 font-bold">Member Access</p>
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold uppercase tracking-[0.2em] premium-glow text-center"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/signup"
                                className="block w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold uppercase tracking-[0.2em] premium-glow text-center"
                            >
                                Join the Archives
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
