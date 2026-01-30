"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "../cards/StoryCard";

export default function StoriesSection() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "stories"),
                    where("published", "==", true),
                    limit(6)
                );

                const snap = await getDocs(q);
                setStories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Failed to fetch stories:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <section className="py-16 px-4 max-w-6xl mx-auto">
            <header className="mb-8 flex items-baseline justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl tracking-widest text-gray-200 uppercase font-light">
                    Short Stories
                </h2>

                <a
                    href="/stories"
                    className="text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-white transition-colors"
                >
                    View all
                </a>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {loading ? (
                    /* Loading Skeletons */
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex flex-col gap-3">
                            <div className="aspect-[2/3] w-full rounded-md bg-zinc-900/50" />
                            <div className="h-4 w-3/4 rounded bg-zinc-900/50" />
                            <div className="h-3 w-1/2 rounded bg-zinc-900/50" />
                        </div>
                    ))
                ) : stories.length > 0 ? (
                    stories.map((story) => (
                        <StoryCard
                            key={story.id}
                            id={story.id}
                            title={story.title}
                            author={story.authorName || "Unknown Author"}
                            imageUrl={story.coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Cover"}
                            category={story.genre || "Story"}
                        />
                    ))
                ) : (
                    /* Fallback if no stories found (or while developing without data) */
                    <>
                        <StoryCard title="Example Story" author="Waiting for Data" category="System" />
                        <p className="col-span-full text-center text-gray-500 py-10">
                            (Connect your Firebase to see real stories here)
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
