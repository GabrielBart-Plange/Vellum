"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";

export default function NovelsListingPage() {
    const [novels, setNovels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const q = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setNovels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching novels:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-20">
                <header className="space-y-4 border-l-2 border-purple-500 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Archives</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">NOVELS</h1>
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
                    ) : novels.length > 0 ? (
                        novels.map((novel) => (
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
                        <div className="col-span-full py-20 text-center">
                            <p className="text-zinc-500 italic uppercase tracking-widest">Great sagas await their readers in the coming cycle...</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
