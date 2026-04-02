"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import DiscoveryFilter from "@/components/layout/DiscoveryFilter";
import { Story } from "@/types";

export default function StoriesListingPage() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "stories"),
                    where("published", "==", true),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setStories(
                    snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story))
                );
            } catch (err) {
                console.error("Error fetching stories:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredStories = stories.filter(story => {
        const matchesSearch = story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            story.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || story.genre === selectedCategory || story.category === selectedCategory || (story.tags && story.tags.includes(selectedCategory));
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-7xl mx-auto space-y-20">
                <header className="space-y-6 border-l-2 border-indigo-500/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">The Library</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-[0.8]">NEWLY <br />RELEASED</h1>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-[11px] uppercase tracking-[0.2em] font-black italic">Fresh tales and short-form stories etched into the library this cycle.</p>
                </header>

                <DiscoveryFilter
                    categories={["Action", "Mystery", "Romance", "Fantasy", "Horror"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                    placeholder="Search for titles, authors, or genres..."
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
                ) : filteredStories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
                        {filteredStories.map((story) => (
                            <StoryCard
                                key={story.id}
                                id={story.id}
                                slug={story.slug}
                                alphanumericId={story.alphanumericId}
                                title={story.title}
                                author={story.authorName || "Unknown Author"}
                                imageUrl={story.coverImage || story.imageUrl}
                                category={story.genre || "Short Story"}
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
                                        ? "No tales found in this corner of the collection. Try a different filter?"
                                        : "The archives are quiet. Seek out new stories to begin your journey."}
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
