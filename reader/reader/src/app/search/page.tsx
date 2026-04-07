"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where, limit, orderBy, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { Novel, Story } from "@/types";

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const q = searchParams.get("q") || "";
    const genre = searchParams.get("genre") || "All";
    const status = searchParams.get("status") || "All";

    const [searchTerm, setSearchTerm] = useState(q);
    const [selectedGenre, setSelectedGenre] = useState(genre);
    const [selectedStatus, setSelectedStatus] = useState(status);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastNovelDoc, setLastNovelDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [lastStoryDoc, setLastStoryDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setSearchTerm(q);
        setSelectedGenre(genre);
        setSelectedStatus(status);
    }, [q, genre, status]);

    const performSearch = async (isMore = false) => {
        if (!q.trim() && genre === "All" && status === "All") {
            setResults([]);
            return;
        }

        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const batchSize = 24;
            // Fetch from multiple collections
            const novelQuery = query(collection(db, "novels"), where("published", "==", true), limit(batchSize));
            const storyQuery = query(collection(db, "stories"), where("published", "==", true), limit(batchSize));

            const [novelsSnap, storiesSnap] = await Promise.all([
                getDocs(isMore && lastNovelDoc ? query(novelQuery, startAfter(lastNovelDoc)) : novelQuery),
                getDocs(isMore && lastStoryDoc ? query(storyQuery, startAfter(lastStoryDoc)) : storyQuery)
            ]);

            const novels = novelsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'novel' } as any));
            const stories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'story' } as any));

            let combined = [...novels, ...stories];

            // Client-side filtering for more complex queries
            combined = combined.filter(n => {
                const title = n.title || "";
                const description = n.description || "";
                const author = n.authorName || "";
                const term = q.toLowerCase();

                const matchesTerm = !term || 
                    title.toLowerCase().includes(term) ||
                    description.toLowerCase().includes(term) ||
                    author.toLowerCase().includes(term);

                const matchesGenre = genre === "All" ||
                    n.genre === genre ||
                    n.category === genre ||
                    (n.tags && n.tags.includes(genre));
                    
                const matchesStatus = status === "All" ||
                    (status === "Ongoing" && n.status !== "Completed") ||
                    (status === "Completed" && n.status === "Completed");

                return matchesTerm && matchesGenre && matchesStatus;
            });

            if (isMore) {
                setResults(prev => {
                    const merged = [...prev, ...combined].sort((a, b) => 
                        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                    );
                    return merged;
                });
            } else {
                setResults(combined.sort((a, b) => 
                    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                ));
            }

            setLastNovelDoc(novelsSnap.docs[novelsSnap.docs.length - 1] || lastNovelDoc);
            setLastStoryDoc(storiesSnap.docs[storiesSnap.docs.length - 1] || lastStoryDoc);
            setHasMore(novelsSnap.docs.length === batchSize || storiesSnap.docs.length === batchSize);

        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => performSearch(false), 300);
        return () => clearTimeout(timeout);
    }, [q, genre, status]);

    const updateFilters = (newFilters: { q?: string, genre?: string, status?: string }) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newFilters.q !== undefined) {
            if (newFilters.q) params.set("q", newFilters.q);
            else params.delete("q");
        }
        if (newFilters.genre !== undefined) {
            if (newFilters.genre !== "All") params.set("genre", newFilters.genre);
            else params.delete("genre");
        }
        if (newFilters.status !== undefined) {
            if (newFilters.status !== "All") params.set("status", newFilters.status);
            else params.delete("status");
        }
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="space-y-12">
            <Breadcrumbs />
            <header className="space-y-8 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Library Search</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">
                        {q ? `"${q}"` : "The Archives"}
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateFilters({ q: searchTerm })}
                            placeholder="Search titles, authors, themes..."
                            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-zinc-700 focus:outline-none focus:border-[var(--reader-accent)]/50 transition-all italic"
                        />
                        <button 
                            onClick={() => updateFilters({ q: searchTerm })}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--reader-accent)] opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <select 
                            value={selectedGenre}
                            onChange={(e) => updateFilters({ genre: e.target.value })}
                            className="bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-[10px] uppercase font-black tracking-widest text-zinc-400 focus:outline-none focus:border-[var(--reader-accent)]/50 transition-all appearance-none cursor-pointer"
                        >
                            {["All", "Fantasy", "Action", "Romance", "Sci-Fi", "Mystery", "Horror"].map(g => (
                                <option key={g} value={g} className="bg-[#0b0a0f] text-white">{g} Genres</option>
                            ))}
                        </select>

                        <select 
                            value={selectedStatus}
                            onChange={(e) => updateFilters({ status: e.target.value })}
                            className="bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-[10px] uppercase font-black tracking-widest text-zinc-400 focus:outline-none focus:border-[var(--reader-accent)]/50 transition-all appearance-none cursor-pointer"
                        >
                            {["All", "Ongoing", "Completed"].map(s => (
                                <option key={s} value={s} className="bg-[#0b0a0f] text-white">{s}</option>
                            ))}
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
                ) : results.length > 0 ? (
                    results.map((item: any) => (
                        <StoryCard
                            key={`${item.type}-${item.id}`}
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
                            <div className="text-4xl opacity-20 grayscale">🕯️</div>
                            <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                {q || genre !== "All" || status !== "All" ? "No results found" : "Enter a search term"}
                            </p>
                            <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
                                {q ? `The archive is silent on your query.` : "Discover chronicles, sagas, and artifacts in the Vellum archives."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {hasMore && results.length > 0 && (
                <div className="pt-12 flex justify-center">
                    <button
                        onClick={() => performSearch(true)}
                        disabled={loadingMore}
                        className="px-12 py-4 rounded-2xl border border-white/5 bg-white/[0.02] text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all disabled:opacity-50 italic"
                    >
                        {loadingMore ? "Searching Deeper..." : "Load More Results"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={
                    <div className="animate-pulse space-y-12">
                        <div className="h-20 w-3/4 bg-zinc-900 rounded-lg" />
                        <div className="grid grid-cols-6 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-lg" />
                            ))}
                        </div>
                    </div>
                }>
                    <SearchResults />
                </Suspense>
            </div>
        </main>
    );
}
