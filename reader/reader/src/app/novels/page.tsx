"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";

export default function NovelsPage() {
    const [novels, setNovels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const ref = collection(db, "novels");
                const q = query(
                    ref,
                    where("published", "==", true),
                    orderBy("publishedAt", "desc")
                );
                const snap = await getDocs(q);
                setNovels(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching novels:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <main className="min-h-screen bg-black text-gray-200 px-4 py-16">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-light tracking-wide text-white uppercase">
                        Featured Novels
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Immerse yourself in long-form stories and epic chronicles.
                    </p>
                </header>

                {loading ? (
                    <div className="text-gray-500 italic tracking-widest">Waking the library...</div>
                ) : novels.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {novels.map((novel) => (
                            <StoryCard
                                key={novel.id}
                                id={novel.id}
                                title={novel.title}
                                author={novel.authorName || "Unknown Author"}
                                imageUrl={novel.coverImage}
                                category={novel.genre || "Novel"}
                                type="novel"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 py-20 text-center">
                        <p className="text-gray-600 italic">"Every epic begins with a single word. Our long-form chronicles are still being written."</p>
                        <p className="text-xs uppercase tracking-widest text-gray-700">Check back soon</p>
                    </div>
                )}
            </div>
        </main>
    );
}
