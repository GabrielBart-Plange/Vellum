"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "../cards/StoryCard";
import { TrendingUp, Star } from "lucide-react";

export default function RisingStars() {
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRisingStars = async () => {
            try {
                // Rising Stars: Works published in the last 14 days, ordered by likes
                const fourteenDaysAgo = new Date();
                fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
                const ts = Timestamp.fromDate(fourteenDaysAgo);

                // Query novels
                const qNovels = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    where("createdAt", ">=", ts),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );

                // Query stories
                const qStories = query(
                    collection(db, "stories"),
                    where("published", "==", true),
                    where("createdAt", ">=", ts),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );

                const [novelsSnap, storiesSnap] = await Promise.all([
                    getDocs(qNovels),
                    getDocs(qStories)
                ]);

                const combined: any[] = [
                    ...novelsSnap.docs.map(d => ({ id: d.id, type: 'novel', ...d.data() })),
                    ...storiesSnap.docs.map(d => ({ id: d.id, type: 'short', ...d.data() }))
                ];

                // Sort by likes descending
                const sorted = combined.sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
                setWorks(sorted);
            } catch (error) {
                console.error("Failed to fetch rising stars:", error);
            } finally {
                setLoading(false);
            }
        };

        loadRisingStars();
    }, []);

    if (!loading && works.length === 0) return null;

    return (
        <section className="space-y-8">
            <header className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm tracking-[0.4em] text-white uppercase font-black italic">Rising Stars</h2>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Fastest growing works this cycle</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">New Author Catalyst</span>
                </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse space-y-3">
                            <div className="aspect-[2/3] w-full rounded-2xl bg-white/5" />
                            <div className="h-3 w-3/4 rounded bg-white/5" />
                            <div className="h-2 w-1/2 rounded bg-white/5" />
                        </div>
                    ))
                ) : (
                    works.map((work) => (
                        <div key={work.id} className="relative group">
                            <StoryCard
                                id={work.id}
                                slug={work.slug}
                                title={work.title}
                                author={work.authorName}
                                imageUrl={work.coverImage}
                                category={work.genre}
                                type={work.type}
                            />
                            {/* Growth Indicator */}
                            <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 transition-transform">
                                <TrendingUp size={12} strokeWidth={3} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
