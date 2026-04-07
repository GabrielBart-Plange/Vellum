"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";
import { NovelProgressReference } from "@/types";
import Link from "next/link";
import { Play, BookOpen, Clock, ChevronRight } from "lucide-react";

export default function ContinueReading() {
    const { user } = useAuth();
    const [progressList, setProgressList] = useState<NovelProgressReference[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProgress = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const library = await progressTracking.getUserLibrary(user.uid);
                if (library.novelsInProgress.length > 0) {
                    // Sort by lastReadAt descending
                    const sorted = [...library.novelsInProgress].sort((a, b) => {
                        const dateA = a.lastReadAt?.seconds || 0;
                        const dateB = b.lastReadAt?.seconds || 0;
                        return dateB - dateA;
                    });
                    setProgressList(sorted);
                }
            } catch (error) {
                console.error("Error loading continue reading:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProgress();
    }, [user]);

    if (loading || !user || progressList.length === 0) return null;

    const latest = progressList[0];
    const others = progressList.slice(1, 4);

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Your Journey</p>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Reading History</h2>
                </div>
                <Link href="/library" className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors italic">
                    Open Vault <ChevronRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Hero Card */}
                <div className="lg:col-span-2">
                    <Link 
                        href={`/chapter/${latest.numericalId || latest.slug || latest.id}-${latest.chapterOrder}`}
                        className="group relative block w-full h-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-900/40 backdrop-blur-md transition-all hover:border-[var(--reader-accent)]/30 hover:bg-zinc-900/60 shadow-2xl"
                    >
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--reader-accent)]/10 blur-[80px] transition-opacity group-hover:opacity-20" />
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 p-8 md:p-10 h-full">
                            <div className="relative h-44 w-32 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                <img 
                                    src={latest.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"} 
                                    alt={latest.title}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                            </div>

                            <div className="flex-1 space-y-4 text-center md:text-left min-w-0">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--reader-accent)] italic">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--reader-accent)] opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--reader-accent)]"></span>
                                        </span>
                                        Continue Chronicle
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-[var(--reader-accent)] transition-colors truncate">
                                        {latest.title}
                                    </h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 italic">
                                        By {latest.authorName}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
                                    <div className="space-y-1 min-w-0 flex-1 md:flex-initial">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Current Unit</p>
                                        <p className="text-sm font-black italic text-white/80 truncate">{latest.currentChapterTitle}</p>
                                    </div>
                                    <div className="h-8 w-px bg-white/10 hidden sm:block" />
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Sync Rank</p>
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden shadow-inner">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-purple-600 to-[var(--reader-accent)] shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                                                    style={{ width: `${latest.progressPercentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black italic text-white/40">{latest.progressPercentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 pt-4 md:pt-0">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition-all duration-500 group-hover:scale-110 group-hover:bg-[var(--reader-accent)] group-hover:text-white shadow-2xl">
                                    <Play className="ml-1 h-6 w-6 fill-current" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Secondary Cards Column */}
                <div className="space-y-4">
                    {others.map((prog) => (
                        <Link 
                            key={prog.id}
                            href={`/chapter/${prog.numericalId || prog.slug || prog.id}-${prog.chapterOrder}`}
                            className="group flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-[var(--reader-accent)]/30 hover:bg-white/[0.05] transition-all"
                        >
                            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                                <img 
                                    src={prog.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"} 
                                    alt={prog.title}
                                    className="h-full w-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <h3 className="text-[11px] font-black text-white uppercase italic tracking-widest truncate group-hover:text-[var(--reader-accent)] transition-colors">
                                    {prog.title}
                                </h3>
                                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={10} className="text-[var(--reader-accent)]/40" />
                                    Unit {prog.chapterOrder}
                                </p>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                                    <div 
                                        className="h-full bg-[var(--reader-accent)]/30 group-hover:bg-[var(--reader-accent)]/60 transition-all duration-500" 
                                        style={{ width: `${prog.progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-[10px] text-zinc-800 group-hover:text-[var(--reader-accent)] transition-colors pr-2">
                                <Clock size={14} />
                            </div>
                        </Link>
                    ))}

                    {others.length === 0 && (
                        <div className="h-full flex items-center justify-center p-8 border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                            <p className="text-[9px] uppercase tracking-widest text-zinc-700 font-black italic text-center">
                                Your scrolls of the past <br /> are currently empty.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
