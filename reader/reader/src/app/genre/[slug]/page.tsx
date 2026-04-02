"use client";

import { useEffect, useState, use } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";
import { Novel } from "@/types";
import { deslugify } from "@/lib/utils";

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [loading, setLoading] = useState(true);
    const genreName = deslugify(slug);

    useEffect(() => {
        const load = async () => {
            try {
                // We handle special cases like Sci-Fi manually if needed
                let searchGenre = genreName;
                if (slug === 'sci-fi') searchGenre = 'Sci-Fi';

                const q = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    where("genre", "==", searchGenre),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setNovels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel)));
            } catch (err) {
                console.error("Error fetching novels by genre:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug, genreName]);

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-7xl mx-auto space-y-20">
                <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Genre Discovery</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none leading-[0.8]">{genreName}</h1>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-sm leading-relaxed italic">All stories resonating within the {genreName} theme.</p>
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
                        <div className="col-span-full py-32 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 bg-white/[0.01]">
                            <div className="max-w-md mx-auto space-y-4">
                                <div className="text-4xl opacity-20 grayscale">📜</div>
                                <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                    This genre is currently silent
                                </p>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
                                    No stories have been published in the {genreName} Library yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
