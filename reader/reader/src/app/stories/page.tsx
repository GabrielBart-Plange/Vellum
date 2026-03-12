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
                <header className="space-y-4 border-l-2 border-[var(--accent-sakura)] pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Collection</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">SHORT STORIES</h1>
                </header>

                <DiscoveryFilter
                    categories={["Action", "Mystery", "Romance", "Fantasy", "Horror"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                    placeholder="Search for lore, myths, or weavers..."
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-12">
                    {loading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-[2/3] bg-zinc-900/50 rounded-lg" />
                                <div className="h-3 bg-zinc-900/50 rounded w-3/4" />
                                <div className="h-2 bg-zinc-900/50 rounded w-1/2" />
                            </div>
                        ))
                    ) : filteredStories.length > 0 ? (
                        filteredStories.map((story) => (
                            <StoryCard
                                key={story.id}
                                id={story.id}
                                title={story.title}
                                author={story.authorName || "Unknown Author"}
                                imageUrl={story.coverImage || story.imageUrl}
                                category={story.genre || "Short Story"}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-white/5">
                            <p className="text-zinc-500 italic uppercase tracking-widest text-xs">
                                {searchTerm || selectedCategory !== "All"
                                    ? "No tales match your current pursuit in the archives."
                                    : "The archives are vast but currently silent..."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
