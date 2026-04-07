"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import DiscoveryFilter from "@/components/layout/DiscoveryFilter";
import { Novel } from "@/types";

export default function NovelListingPage() {
    const [novels, setNovels] = useState<Novel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "novels"),
                    where("published", "==", true)
                );
                const snap = await getDocs(q);
                const fetchedNovels = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
                
                // Sort client-side to handle missing createdAt gracefully
                fetchedNovels.sort((a, b) => {
                    const dateA = a.createdAt?.toMillis?.() || a.publishedAt?.toMillis?.() || 0;
                    const bDateB = b.createdAt?.toMillis?.() || b.publishedAt?.toMillis?.() || 0;
                    return bDateB - dateA;
                });

                setNovels(fetchedNovels);
            } catch (err) {
                console.error("Error fetching novels:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredNovels = novels.filter(novel => {
        const matchesSearch = novel.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            novel.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || novel.genre === selectedCategory || novel.category === selectedCategory || (novel.tags && novel.tags.includes(selectedCategory));
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-7xl mx-auto space-y-20">
                <header className="space-y-6 border-l-2 border-indigo-500/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">The Collection</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-[0.8]">EXPLORE <br />NOVELS</h1>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-[11px] uppercase tracking-[0.2em] font-black italic">Long-form sagas and grand stories unrolled for your immersion.</p>
                </header>

                <DiscoveryFilter
                    categories={["Epic", "Cyberpunk", "Gothic", "Chronicle", "Legend"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                    placeholder="Search for titles, series, or authors..."
                />

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="animate-pulse-slow space-y-4">
                                <div className="aspect-[2/3] bg-white/5 rounded-[1.5rem] border border-white/5" />
                                <div className="h-3 bg-white/5 rounded-full w-3/4" />
                                <div className="h-2 bg-white/5 rounded-full w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredNovels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {filteredNovels.map((novel) => (
                            <StoryCard
                                key={novel.id}
                                id={novel.id}
                                slug={novel.slug}
                                title={novel.title}
                                author={novel.authorName || "Unknown Author"}
                                imageUrl={novel.coverImage}
                                category={novel.genre || "Novel"}
                                type="novel"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full py-32 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 bg-white/[0.01]">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="text-4xl opacity-20 grayscale">📜</div>
                            <div className="space-y-2">
                                <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                    Your library is currently empty
                                </p>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
                                    {searchTerm || selectedCategory !== "All"
                                        ? "No novels match your current filters. Perhaps try a different filters?"
                                        : "The archives are quiet. Seek out new novels to begin your journey."}
                                </p>
                            </div>
                            <button 
                                onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
                                className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all italic"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
