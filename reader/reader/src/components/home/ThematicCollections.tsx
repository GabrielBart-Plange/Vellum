"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "../cards/StoryCard";
import { Sparkles, Zap, Ghost, BookOpen } from "lucide-react";

interface Collection {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    works: any[];
}

export default function ThematicCollections() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCollections = async () => {
            try {
                // 1. Hidden Gems: Just fetch published novels/stories and filter in-memory 
                // to avoid complex composite indexes (where views <= 1000 + orderBy views desc)
                const novelsQuery = query(
                    collection(db, "novels"),
                    where("published", "==", true),
                    limit(20)
                );
                const storiesQuery = query(
                    collection(db, "stories"),
                    where("published", "==", true),
                    limit(20)
                );

                const [novelsSnap, storiesSnap] = await Promise.all([
                    getDocs(novelsQuery),
                    getDocs(storiesQuery)
                ]);

                const allNovels = novelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const allStories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Helper to process results
                const processResults = (novels: any[], stories: any[], count = 5) => {
                    return [...novels, ...stories]
                        .sort((a, b) => ((b.likes || b.likeCount) || 0) - ((a.likes || a.likeCount) || 0))
                        .slice(0, count);
                };

                // In-memory processing for collections
                const loadedCollections: Collection[] = [
                    {
                        id: "hidden-gems",
                        title: "Hidden Gems",
                        subtitle: "Exceptional stories waiting to be discovered",
                        icon: Sparkles,
                        color: "text-amber-400",
                        works: processResults(
                            allNovels.filter((n: any) => (n.views || 0) <= 1000),
                            allStories.filter((s: any) => (s.viewCount || 0) <= 500)
                        )
                    },
                    {
                        id: "fast-paced",
                        title: "Fast-Paced Sagas",
                        subtitle: "Binge-worthy epics with deep lore",
                        icon: Zap,
                        color: "text-blue-400",
                        works: processResults(
                            allNovels.filter((n: any) => (n.chapterCount || 0) >= 10),
                            allStories // Take latest stories
                        )
                    },
                    {
                        id: "atmospheric-horror",
                        title: "Atmospheric Horrors",
                        subtitle: "Tales that linger in the shadows",
                        icon: Ghost,
                        color: "text-purple-400",
                        works: processResults(
                            allNovels.filter((n: any) => n.genre === "Horror"),
                            allStories.filter((s: any) => s.genre === "Horror")
                        )
                    }
                ];

                setCollections(loadedCollections.filter(c => c.works.length > 0));
            } catch (error) {
                console.error("Failed to fetch thematic collections:", error);
            } finally {
                setLoading(false);
            }
        };

        loadCollections();
    }, []);

    if (!loading && collections.length === 0) return null;

    return (
        <section className="space-y-16">
            {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-8">
                        <div className="h-8 w-1/4 rounded bg-white/5" />
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {Array.from({ length: 5 }).map((_, j) => (
                                <div key={j} className="aspect-[2/3] w-full rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                collections.map((col) => (
                    <div key={col.id} className="space-y-8 group/col">
                        <header className="flex items-end justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${col.color}`}>
                                    <col.icon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tight">{col.title}</h2>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">{col.subtitle}</p>
                                </div>
                            </div>
                            <button className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors">
                                View Collection
                            </button>
                        </header>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                            {col.works.map((work) => (
                                <StoryCard
                                    key={work.id}
                                    id={work.id}
                                    slug={work.slug}
                                    title={work.title}
                                    author={work.authorName}
                                    imageUrl={work.coverImage}
                                    category={work.genre}
                                    type={work.type}
                                />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </section>
    );
}
