"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";

interface PublishedWork {
    id: string;
    title?: string;
    authorName?: string;
    views?: number;
    likes?: number;
    type?: string;
    genre?: string;
    publishedAt?: { seconds: number };
    collectionName: "stories" | "novels";
}

export default function PublishedPage() {
    const [stories, setStories] = useState<PublishedWork[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) return;

            // 1. Fetch stories
            const qStories = query(
                collection(db, "stories"),
                where("authorId", "==", user.uid),
                where("published", "==", true)
            );
            const storiesSnap = await getDocs(qStories);
            const sDocs = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), collectionName: "stories" } as PublishedWork));

            // 2. Fetch novels
            const qNovels = query(
                collection(db, "novels"),
                where("authorId", "==", user.uid),
                where("published", "==", true)
            );
            const novelsSnap = await getDocs(qNovels);
            const nDocs = novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), collectionName: "novels" } as PublishedWork));

            setStories([...sDocs, ...nDocs].sort((a, b) => {
                const dateA = a.publishedAt?.seconds || 0;
                const dateB = b.publishedAt?.seconds || 0;
                return dateB - dateA;
            }));
            setLoading(false);
        };

        load();
    }, []);

    const handleUnpublish = async (id: string, coll: string) => {
        if (!confirm("Are you sure you want to unpublish/delete this work?")) return;
        await updateDoc(doc(db, coll, id), {
            published: false,
        });
        setStories(stories.filter(s => s.id !== id));
    };

    if (loading) return <div className="p-6 text-[var(--reader-text)]">Loading published works...</div>;
    return (
        <section className="space-y-12 transition-all duration-500">
            <header className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">
                        Published Works
                    </h1>
                    <p className="text-[var(--reader-text-muted)] text-[10px] uppercase tracking-[0.2em]">Live in the eternal archives</p>
                </div>
            </header>

            {stories.length === 0 ? (
                <div className="py-20 text-center glass-panel border-dashed border-[var(--reader-border)] rounded-3xl">
                    <p className="text-[var(--reader-text-muted)] italic tracking-wide">
                        "Your chronicles await their first entry. Visit your <Link href="/creator/dashboard/drafts" className="text-[var(--reader-accent)] hover:underline">Drafts</Link> to begin."
                    </p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Aggregated Insights Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-[var(--reader-surface)] border border-[var(--reader-border)] space-y-1">
                            <p className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Total Reach</p>
                            <p className="text-2xl font-light text-[var(--foreground)]">{stories.reduce((acc, s) => acc + (s.views || 0), 0).toLocaleString()} Views</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[var(--reader-surface)] border border-[var(--reader-border)] space-y-1">
                            <p className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Community Approval</p>
                            <p className="text-2xl font-light text-[var(--foreground)]">{stories.reduce((acc, s) => acc + (s.likes || 0), 0).toLocaleString()} Likes</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[var(--reader-surface)] border border-[var(--reader-border)] space-y-1">
                            <p className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Active Works</p>
                            <p className="text-2xl font-light text-[var(--foreground)]">{stories.length} Units</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stories.map((story) => (
                            <div key={story.id} className="glass-panel p-8 rounded-3xl flex flex-col gap-6 group hover:border-[var(--reader-accent)] transition-all">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-light text-[var(--foreground)] group-hover:text-[var(--reader-accent)] transition-colors leading-tight">
                                        {story.title || "Untitled"}
                                    </h3>
                                    <div className="flex gap-4">
                                        <Link
                                            href={`/creator/dashboard/drafts/${story.id}`}
                                            className="text-[10px] uppercase tracking-widest text-[var(--reader-text-muted)] hover:text-[var(--foreground)] transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleUnpublish(story.id, story.collectionName)}
                                            className="text-[10px] uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors"
                                        >
                                            Unpublish
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[8px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Views</p>
                                        <p className="text-sm font-light text-[var(--foreground)]">{(story.views || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black">Likes</p>
                                        <p className="text-sm font-light text-[var(--foreground)]">{(story.likes || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-6 border-t border-[var(--reader-border)] flex justify-between items-center">
                                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[var(--reader-accent)] bg-[var(--reader-accent)]/5 px-3 py-1 rounded-full">
                                        {story.type || "Short"}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--reader-text-subtle)] font-medium">
                                            {story.genre || "Chronicle"}
                                        </span>
                                        <div className="h-1 w-1 rounded-full bg-[var(--reader-border)]" />
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--reader-text-subtle)]">
                                            {story.publishedAt?.seconds
                                                ? new Date(story.publishedAt.seconds * 1000).toLocaleDateString()
                                                : "Just now"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
