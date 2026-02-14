"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { progressTracking } from "@/lib/progressTracking";
import { LibraryData } from "@/types";

export default function LibraryPage() {
    const { user, loading: authLoading, signOut } = useAuth();
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
            <main className="min-h-screen bg-black pt-40 pb-24 px-8">
                <div className="max-w-6xl mx-auto space-y-16">
                    <div className="text-center text-zinc-500">Loading authentication...</div>
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
            <main className="min-h-screen bg-black pt-40 pb-24 px-8">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                        <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Personal</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE GRAND LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-white/5 text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-white/10 mx-auto flex items-center justify-center opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 italic uppercase tracking-[0.4em] text-sm">Access your personal archive</p>
                        <Link href="/login" className="inline-block px-10 py-4 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                            Sign In to Access
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-black pt-40 pb-24 px-8">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                        <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Personal</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE GRAND LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-white/5 text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-white/10 mx-auto flex items-center justify-center opacity-20 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 italic uppercase tracking-[0.4em] text-sm">Retrieving your scrolls from the archive...</p>
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
                    <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                        <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Personal</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE GRAND LIBRARY</h1>
                    </header>

                    <div className="glass-panel p-20 rounded-[40px] border border-white/5 text-center space-y-8">
                        <div className="h-20 w-20 rounded-full border border-white/10 mx-auto flex items-center justify-center opacity-20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 italic uppercase tracking-[0.4em] text-sm">Your library is empty</p>
                        <p className="text-zinc-600 text-sm max-w-md mx-auto">Start exploring stories and novels to build your personal collection. Liked content and reading progress will appear here.</p>
                        <div className="flex gap-4 justify-center pt-4">
                            <Link href="/stories" className="px-6 py-3 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                Browse Stories
                            </Link>
                            <Link href="/novels" className="px-6 py-3 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                Browse Novels
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Personal</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE GRAND LIBRARY</h1>
                    <p className="text-zinc-500 max-w-2xl">Your personal collection of liked stories and reading progress</p>
                </header>
                <div className="flex justify-end">
                    <button
                        onClick={handleSignOut}
                        className="rounded-full bg-[var(--accent-lime)] px-5 py-2 text-[12px] font-bold text-white hover:bg-white/90 transition-all shadow-[0_0_20px_-5px_var(--glow-lime)]"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="space-y-16">
                    {/* Liked Stories Section */}
                    {libraryData?.likedStories.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight border-l-2 border-purple-500 pl-4">Liked Stories</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {libraryData.likedStories.map((story) => (
                                    <Link
                                        key={story.id}
                                        href={`/stories/${story.id}`}
                                        className="group glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                            <img
                                                src={story.coverImage || "https://placehold.co/400x300/1a1a1a/666666?text=Vellum"}
                                                alt={story.title}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
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
                        <section>
                            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight border-l-2 border-purple-500 pl-4">Saved Novels</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {libraryData.savedNovels.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/novels/${novel.id}`}
                                        className="group glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="aspect-[3/4] bg-zinc-900 relative overflow-hidden">
                                            <img
                                                src={novel.coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Vellum"}
                                                alt={novel.title}
                                                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
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
                        <section>
                            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight border-l-2 border-blue-500 pl-4">Reading Progress</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {libraryData.novelsInProgress.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        href={`/novels/${novel.id}/chapter/${novel.currentChapterId}`}
                                        className="group glass-panel rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all"
                                    >
                                        <div className="flex gap-6 p-6">
                                            <div className="flex-shrink-0">
                                                <div className="w-24 h-32 bg-zinc-900 rounded-xl overflow-hidden">
                                                    <img
                                                        src={novel.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"}
                                                        alt={novel.title}
                                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{novel.title}</h3>
                                                <p className="text-zinc-400 text-sm mb-3">by {novel.authorName}</p>
                                                <p className="text-zinc-500 text-xs mb-4 line-clamp-2">Currently reading: {novel.currentChapterTitle}</p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-400">Progress</span>
                                                        <span className="text-white font-bold">{novel.progressPercentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${novel.progressPercentage}%` }}
                                                        />
                                                    </div>
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
