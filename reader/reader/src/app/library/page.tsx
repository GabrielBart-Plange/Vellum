"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { progressTracking } from "@/lib/progressTracking";
import { LibraryData } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

export default function LibraryPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const { theme } = useTheme();
    const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLibrary = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const data = await progressTracking.getUserLibrary(user.uid);
                setLibraryData(data);
            } catch (error) {
                console.error("Error loading library:", error);
            } finally {
                setLoading(false);
            }
        };

        loadLibrary();
    }, [user]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-[var(--reader-bg)] pt-40 pb-24 px-8 text-[var(--reader-text)]">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center text-[var(--reader-text-muted)]">Loading authentication...</div>
                </div>
            </main>
        );
    }

    const handleSignOut = async () => {
        try {
            await signOut();
            // Optional: Reload or redirect to home to reflect signed-out state immediately if not handled by AuthContext
            // window.location.href = "/"; 
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    if (!user) {
        return (
            <main className="min-h-screen bg-[var(--reader-bg)] pt-40 pb-24 px-8 text-[var(--reader-text)]">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Personal Vault</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--reader-text)] uppercase italic leading-[0.8]">MY <br />LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-[var(--reader-border)] text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-[var(--reader-border)] mx-auto flex items-center justify-center opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-[var(--reader-text)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-[var(--reader-text-muted)] italic uppercase tracking-[0.4em] text-sm">Access your personal library</p>
                        <Link href="/login" className="inline-block px-10 py-4 rounded-full border border-[var(--reader-border)] text-[var(--reader-text)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--reader-surface)] transition-all">
                            Sign In to Access
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[var(--reader-bg)] pt-40 pb-24 px-8 text-[var(--reader-text)]">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Personal Vault</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--reader-text)] uppercase italic leading-[0.8]">MY <br />LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-[var(--reader-border)] text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-[var(--reader-border)] mx-auto flex items-center justify-center opacity-20 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-[var(--reader-text)]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-[var(--reader-text-muted)] italic uppercase tracking-[0.4em] text-sm">Retrieving your collection...</p>
                    </div>
                </div>
            </main>
        );
    }

    const hasContent = libraryData && (
        libraryData.likedStories.length > 0 ||
        libraryData.savedNovels.length > 0 ||
        libraryData.novelsInProgress.length > 0
    );

    if (!hasContent) {
        return (
            <main className="min-h-screen bg-black pt-40 pb-24 px-8">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Personal Vault</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">MY <br />LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-white/5 text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-white/10 mx-auto flex items-center justify-center opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 italic uppercase tracking-[0.4em] text-sm font-black">Your shelves are collecting dust</p>
                        <p className="text-zinc-600 text-sm max-w-md mx-auto font-medium">It looks like you haven't started your collection yet. Let's find your next story in the Library.</p>
                        <div className="flex gap-4 justify-center pt-4">
                            <Link href="/stories" className="px-10 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                                Explore Tales
                            </Link>
                            <Link href="/novel" className="px-10 py-4 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                Browse Novels
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                    <div className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Account Profile</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[var(--reader-text)] uppercase italic leading-[0.8]">MY <br />LIBRARY</h1>
                        <p className="text-[var(--reader-text-muted)] max-w-2xl text-[11px] uppercase tracking-[0.2em] font-black italic">Your collection of stories and novels saved for reading</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 items-center">
                    <Link href={`/authors/${user.uid}`} className="text-[10px] uppercase tracking-widest font-black text-zinc-500 hover:text-white transition-all mr-4">
                        View Public Scroll
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="rounded-full bg-white text-black px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] italic active:scale-95"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="space-y-16">
                    {/* Liked Stories Section */}
                    {libraryData?.likedStories.length > 0 && (
                        <section className="space-y-10">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[var(--reader-text)] uppercase tracking-tight italic">Stories</h2>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {libraryData.likedStories.map((story) => (
                                    <Link
                                        key={story.id}
                                        href={`/stories/${story.alphanumericId || story.slug || story.id}`}
                                        className="group glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                            <img
                                                src={story.coverImage || "https://placehold.co/400x300/1a1a1a/666666?text=Vellum"}
                                                alt={story.title}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                                <h3 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors line-clamp-2">{story.title}</h3>
                                                <p className="text-zinc-400 text-xs mt-1">by {story.authorName}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Saved Novels Section */}
                    {libraryData?.savedNovels.length > 0 && (
                        <section className="space-y-10">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[var(--reader-text)] uppercase tracking-tight italic">Novels</h2>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {libraryData.savedNovels.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/novel/${novel.numericalId || novel.slug || novel.id}`}
                                        className="group glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="aspect-[3/4] bg-zinc-900 relative overflow-hidden">
                                            <img
                                                src={novel.coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Vellum"}
                                                alt={novel.title}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                                <h3 className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors line-clamp-2">{novel.title}</h3>
                                                <p className="text-zinc-400 text-xs mt-1">by {novel.authorName}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Novels in Progress Section */}
                    {libraryData?.novelsInProgress.length > 0 && (
                        <section className="space-y-10">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-black text-[var(--reader-text)] uppercase tracking-tight italic">Active Immersions</h2>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {libraryData.novelsInProgress.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/chapter/${novel.numericalId || novel.slug || novel.id}-${novel.chapterOrder || 1}`}
                                        className="group glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-[var(--reader-accent)]/30 transition-all relative"
                                    >
                                        <div className="flex gap-8 p-10">
                                            <div className="flex-shrink-0 relative">
                                                <div className="w-32 h-44 bg-zinc-900 rounded-[1.5rem] overflow-hidden shadow-2xl border border-white/5">
                                                    <img
                                                        src={novel.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"}
                                                        alt={novel.title}
                                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-[var(--reader-accent)] flex items-center justify-center text-white text-xs font-black shadow-lg border-4 border-[#0b0a0f] rotate-12 group-hover:rotate-0 transition-transform">
                                                    {novel.progressPercentage}%
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-white font-black text-2xl group-hover:text-[var(--reader-accent)] transition-colors italic tracking-tighter leading-none truncate">{novel.title}</h3>
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black italic">scribed by {novel.authorName}</p>
                                                </div>
                                                
                                                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-all">
                                                    <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Current Chapter</p>
                                                    <p className="text-white text-sm font-black italic truncate">{novel.currentChapterTitle || "The Beginning"}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-[var(--reader-accent)] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                                            style={{ width: `${novel.progressPercentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-black italic text-right">{novel.progressPercentage}% of the way through</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
