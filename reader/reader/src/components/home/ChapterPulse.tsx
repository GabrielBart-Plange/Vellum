"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, where, limit, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Zap, Clock, ChevronRight, Sparkles } from "lucide-react";

interface PulseChapter {
    id: string;
    title: string;
    order: number;
    publishedAt: Timestamp;
    novelId: string;
    novelTitle?: string;
    authorName?: string;
    coverImage?: string;
    slug?: string;
}

interface Manifestation {
    id: string;
    type: 'purchase' | 'vellux' | 'unlock';
    amount: number;
    novelTitle: string;
    location: string;
    timestamp: Timestamp;
    tier?: 'gold' | 'diamond' | 'platinum';
}

export default function ChapterPulse() {
    const [chapters, setChapters] = useState<PulseChapter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPulse = async () => {
            try {
                // 1. Fetch latest chapters
                const q = query(
                    collectionGroup(db, "chapters"),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc"),
                    limit(5)
                );

                const snap = await getDocs(q);
                const results: PulseChapter[] = [];
                const novelCache: Record<string, any> = {};

                for (const docSnap of snap.docs) {
                    const data = docSnap.data();
                    let novelTitle = data.novelTitle;
                    let authorName = data.authorName;
                    let coverImage = data.coverImage;

                    // Fallback for missing denormalized data
                    if ((!novelTitle || !authorName) && data.novelId) {
                        if (novelCache[data.novelId]) {
                            novelTitle = novelTitle || novelCache[data.novelId].title;
                            authorName = authorName || novelCache[data.novelId].authorName;
                            coverImage = coverImage || novelCache[data.novelId].coverImage;
                        } else {
                            const novelRef = doc(db, "novels", data.novelId);
                            const novelSnap = await getDoc(novelRef);
                            if (novelSnap.exists()) {
                                const nData = novelSnap.data();
                                novelCache[data.novelId] = nData;
                                novelTitle = novelTitle || nData.title;
                                authorName = authorName || nData.authorName;
                                coverImage = coverImage || nData.coverImage;
                            }
                        }
                    }

                    results.push({
                        id: docSnap.id,
                        title: data.title,
                        order: data.order,
                        publishedAt: data.publishedAt,
                        novelId: data.novelId,
                        novelTitle: novelTitle || "Unknown Chronicle",
                        authorName: authorName || "Unknown Author",
                        coverImage: coverImage,
                        slug: data.slug
                    });
                }

                setChapters(results);
            } catch (error) {
                console.error("Failed to fetch chapter pulse:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPulse();
    }, []);

    if (!loading && chapters.length === 0) return null;

    return (
        <section className="space-y-8">
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Zap size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm tracking-[0.4em] text-white uppercase font-black italic">Chapter Pulse</h2>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Latest archival expansions</p>
                    </div>
                </div>
                <Link 
                    href="/updates" 
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors flex items-center gap-1 group"
                >
                    Live Feed
                    <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="h-16 w-12 rounded-lg bg-white/5 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/2 rounded bg-white/5" />
                                <div className="h-2 w-1/4 rounded bg-white/5" />
                            </div>
                        </div>
                    ))
                ) : (
                    chapters.map((chapter) => (
                        <Link 
                            key={`${chapter.novelId}-${chapter.id}`}
                            href={`/chapter/${chapter.novelId}-${chapter.order}`}
                            className="group flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all"
                        >
                            {/* Novel Mini-Cover */}
                            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg shadow-xl border border-white/5">
                                <img 
                                    src={chapter.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"} 
                                    alt={chapter.novelTitle}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-400 italic truncate">
                                        {chapter.novelTitle}
                                    </span>
                                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={8} />
                                        {chapter.publishedAt ? new Date(chapter.publishedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                    </span>
                                </div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate group-hover:text-purple-300 transition-colors">
                                    Unit {chapter.order + 1}: {chapter.title}
                                </h4>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                    By {chapter.authorName}
                                </p>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                                <ChevronRight size={16} className="text-purple-500" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
}
