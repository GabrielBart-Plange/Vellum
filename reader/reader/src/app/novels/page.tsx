"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import DiscoveryFilter from "@/components/layout/DiscoveryFilter";
import { Novel } from "@/types";

export default function NovelsListingPage() {
    const [novels, setNovels] = useState<Novel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setNovels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel)));
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
                <header className="space-y-4 border-l-2 border-purple-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Archives</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">NOVELS</h1>
                </header>

                <DiscoveryFilter
                    categories={["Epic", "Cyberpunk", "Gothic", "Chronicle", "Legend"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                    placeholder="Search for works, sagas, or authors..."
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
                    ) : filteredNovels.length > 0 ? (
                        filteredNovels.map((novel) => (
                            <StoryCard
                                key={novel.id}
                                id={novel.id}
                                title={novel.title}
                                author={novel.authorName || "Unknown Author"}
                                imageUrl={novel.coverImage}
                                category={novel.genre || "Novel"}
                                type="novel"
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-white/5">
                            <p className="text-zinc-500 italic uppercase tracking-widest text-xs">
                                {searchTerm || selectedCategory !== "All"
                                    ? "No works match your current pursuit in the archives."
                                    : "Great sagas await their readers in the coming cycle..."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
