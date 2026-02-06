"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";

export default function StoriesListingPage() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "stories"),
                    where("published", "==", true),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching stories:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-20">
                <header className="space-y-4 border-l-2 border-[var(--accent-sakura)] pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Collection</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">SHORT STORIES</h1>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-[3/4] bg-zinc-900/50 rounded-3xl" />
                                <div className="h-4 bg-zinc-900/50 rounded w-3/4" />
                                <div className="h-3 bg-zinc-900/50 rounded w-1/2" />
                            </div>
                        ))
                    ) : stories.length > 0 ? (
                        stories.map((story) => (
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
                        <div className="col-span-full py-20 text-center">
                            <p className="text-zinc-500 italic uppercase tracking-widest">The archives are vast but currently silent...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
