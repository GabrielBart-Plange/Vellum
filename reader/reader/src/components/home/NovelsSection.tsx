"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "../cards/StoryCard";
import ManagedAd from "../monetization/ManagedAd";

export default function NovelsSection() {
    const [novels, setNovels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    limit(6)
                );

                const snap = await getDocs(q);
                setNovels(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Failed to fetch novels:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <section className="py-16 px-4 max-w-7xl mx-auto">
            <header className="mb-8 flex items-baseline justify-between border-b border-white/5 pb-4">
                <h2 className="text-sm tracking-[0.4em] text-[var(--reader-text-subtle)] uppercase font-bold">
                    Featured Novels
                </h2>

                <a
                    href="/novels"
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--reader-text-muted)] hover:text-[var(--reader-text)] transition-colors"
                >
                    View all
                </a>
            </header>

            <ManagedAd zone="HOME_DISCOVERY" />

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                {loading ? (
                    /* Loading Skeletons */
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex flex-col gap-3">
                            <div className="aspect-[2/3] w-full rounded-md bg-[var(--reader-surface)]" />
                            <div className="h-4 w-3/4 rounded bg-[var(--reader-surface)]" />
                            <div className="h-3 w-1/2 rounded bg-[var(--reader-surface)]" />
                        </div>
                    ))
                ) : novels.length > 0 ? (
                    novels.map((novel) => (
                        <StoryCard
                            key={novel.id}
                            id={novel.id}
                            title={novel.title}
                            author={novel.authorName || "Unknown Author"}
                            imageUrl={novel.coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Cover"}
                            category={novel.genre || "Novel"}
                            type="novel"
                        />
                    ))
                ) : (
                    /* Fallback if no novels found */
                    <>
                        <StoryCard title="Example Novel" author="Waiting for Data" category="Fantasy" />
                        <p className="col-span-full text-center text-gray-500 py-10">
                            (Connect your Firebase to see real novels here)
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
