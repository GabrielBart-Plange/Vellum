"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";
import { NovelProgressReference } from "@/types";
import Link from "next/link";
import { Play, X, BookOpen, ChevronRight } from "lucide-react";

export default function LastReadAnchor() {
    const { user } = useAuth();
    const [latestProgress, setLatestProgress] = useState<NovelProgressReference | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setHasScrolled(true);
            } else {
                setHasScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const loadProgress = async () => {
            if (!user || isDismissed) return;

            try {
                const library = await progressTracking.getUserLibrary(user.uid);
                if (library.novelsInProgress.length > 0) {
                    const sorted = [...library.novelsInProgress].sort((a, b) => {
                        const dateA = a.lastReadAt?.seconds || 0;
                        const dateB = b.lastReadAt?.seconds || 0;
                        return dateB - dateA;
                    });
                    
                    const latest = sorted[0];
                    // Only show if progress is not 100%
                    if (latest.progressPercentage < 100) {
                        setLatestProgress(latest);
                    }
                }
            } catch (error) {
                console.error("Error loading last read anchor:", error);
            }
        };

        loadProgress();
    }, [user, isDismissed]);

    if (!user || !latestProgress || isDismissed) return null;

    const showAnchor = hasScrolled;

    return (
        <div 
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl transition-all duration-700 ease-out transform ${
                showAnchor ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
            }`}
        >
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--reader-accent)] to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative flex items-center gap-4 p-3 pl-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
                    {/* Cover Thumbnail */}
                    <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
                        <img 
                            src={latestProgress.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"} 
                            alt={latestProgress.title}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--reader-accent)] italic">Resume Journey</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">•</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">{latestProgress.currentChapterTitle}</span>
                        </div>
                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate group-hover:text-[var(--reader-accent)] transition-colors">
                            {latestProgress.title}
                        </h4>
                    </div>

                    {/* Progress Ring (Simple) */}
                    <div className="flex items-center gap-4 pr-2">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[9px] font-black text-white/40 italic">{latestProgress.progressPercentage}%</span>
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                                <div 
                                    className="h-full bg-[var(--reader-accent)] shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
                                    style={{ width: `${latestProgress.progressPercentage}%` }}
                                />
                            </div>
                        </div>

                        <Link 
                            href={`/chapter/${latestProgress.numericalId || latestProgress.slug || latestProgress.id}-${latestProgress.chapterOrder}`}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:bg-[var(--reader-accent)] hover:text-white transition-all duration-300 shadow-lg group-hover:scale-105 active:scale-95"
                        >
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </Link>

                        <button 
                            onClick={() => setIsDismissed(true)}
                            className="p-1 text-zinc-600 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
