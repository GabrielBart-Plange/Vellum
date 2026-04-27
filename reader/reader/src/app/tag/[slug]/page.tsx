"use client";

import { useEffect, useState, use } from "react";
import { collection, getDocs, query, where, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Novel, Story } from "@/types";
import { deslugify } from "@/lib/utils";

export default function TagPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [results, setResults] = useState<(Novel | Story)[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'novel' | 'story'>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'likes' | 'views'>('createdAt');
    const [lastNovelDoc, setLastNovelDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [lastStoryDoc, setLastStoryDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const tagName = deslugify(slug);

    const loadWorks = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else {
            setLoading(true);
            setLastNovelDoc(null);
            setLastStoryDoc(null);
            setHasMore(true);
        }

        try {
            const batchSize = 12;
            const novelQuery = query(
                collection(db, "novels"),
                where("published", "==", true),
                where("tags", "array-contains", tagName),
                orderBy(sortBy, "desc"),
                limit(batchSize)
            );

            const storyQuery = query(
                collection(db, "stories"),
                where("published", "==", true),
                where("tags", "array-contains", tagName),
                orderBy(sortBy === 'views' ? 'viewCount' : sortBy, "desc"),
                limit(batchSize)
            );

            const [novelsSnap, storiesSnap] = await Promise.all([
                getDocs(isMore && lastNovelDoc ? query(novelQuery, startAfter(lastNovelDoc)) : novelQuery),
                getDocs(isMore && lastStoryDoc ? query(storyQuery, startAfter(lastStoryDoc)) : storyQuery)
            ]);

            const newNovels = novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'novel' } as any));
            const newStories = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'story' } as any));
            
            const combined = [...newNovels, ...newStories];
            
            if (isMore) {
                setResults(prev => {
                    const merged = [...prev, ...combined].sort((a, b) => {
                        const valB = b[sortBy]?.seconds || b[sortBy] || (sortBy === 'views' ? b.viewCount : 0) || 0;
                        const valA = a[sortBy]?.seconds || a[sortBy] || (sortBy === 'views' ? a.viewCount : 0) || 0;
                        return valB - valA;
                    });
                    return merged;
                });
            } else {
                setResults(combined.sort((a, b) => {
                    const valB = b[sortBy]?.seconds || b[sortBy] || (sortBy === 'views' ? b.viewCount : 0) || 0;
                    const valA = a[sortBy]?.seconds || a[sortBy] || (sortBy === 'views' ? a.viewCount : 0) || 0;
                    return valB - valA;
                }));
            }

            setLastNovelDoc(novelsSnap.docs[novelsSnap.docs.length - 1] || null);
            setLastStoryDoc(storiesSnap.docs[storiesSnap.docs.length - 1] || null);
            setHasMore(novelsSnap.docs.length === batchSize || storiesSnap.docs.length === batchSize);

        } catch (err) {
            console.error("Error fetching works by tag:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadWorks();
    }, [slug, tagName, sortBy]);

    const filteredResults = results.filter(item => {
        if (activeTab === 'all') return true;
        return (item as any).type === activeTab;
    });

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-7xl mx-auto space-y-20">
                <Breadcrumbs />
                <header className="space-y-8 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Tag Archive</p>
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white italic uppercase leading-none">#{tagName}</h1>
                    </div>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-sm leading-relaxed italic">
                        "The archive filters itself through the resonance of #{tagName}. Explore the chronicles that align with this vibration."
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4 items-center">
                        <div className="flex gap-2">
                            {(['all', 'novel', 'story'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic border ${
                                        activeTab === tab 
                                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                                        : 'text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-px bg-white/10 hidden md:block mx-2" />

                        <div className="flex items-center gap-3">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black italic">Sort By</p>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2 text-[9px] uppercase font-black tracking-widest text-zinc-400 focus:outline-none focus:border-[var(--reader-accent)]/50 transition-all appearance-none cursor-pointer italic"
                            >
                                <option value="createdAt" className="bg-[#0b0a0f]">Newest Arrivals</option>
                                <option value="likes" className="bg-[#0b0a0f]">Most Resonant</option>
                                <option value="views" className="bg-[#0b0a0f]">Highest Echoes</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-12">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-[2/3] bg-zinc-900/50 rounded-lg" />
                                <div className="h-3 bg-zinc-900/50 rounded w-3/4" />
                                <div className="h-2 bg-zinc-900/50 rounded w-1/2" />
                            </div>
                        ))
                    ) : filteredResults.length > 0 ? (
                        filteredResults.map((item: any) => (
                            <StoryCard
                                key={item.id}
                                id={item.id}
                                slug={item.slug}
                                alphanumericId={item.alphanumericId}
                                title={item.title}
                                author={item.authorName || "Unknown Author"}
                                imageUrl={item.coverImage || item.imageUrl}
                                category={item.genre || item.category || (item.type === 'novel' ? 'Novel' : 'Story')}
                                type={item.type}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 bg-white/[0.01]">
                            <div className="max-w-md mx-auto space-y-4">
                                <div className="text-4xl opacity-20 grayscale">�</div>
                                <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                    No results found
                                </p>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
                                    No {activeTab === 'all' ? 'works' : activeTab + 's'} match the resonance of #{tagName} yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {hasMore && (
                    <div className="pt-12 flex justify-center">
                        <button
                            onClick={() => loadWorks(true)}
                            disabled={loadingMore}
                            className="px-12 py-4 rounded-2xl border border-white/5 bg-white/[0.02] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all disabled:opacity-50 italic"
                        >
                            {loadingMore ? "Unrolling More..." : "Load More Chronicles"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
