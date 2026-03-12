"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";

export default function PublishedPage() {
    const [stories, setStories] = useState<any[]>([]);
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
            const sDocs = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), collectionName: "stories" } as any));

            // 2. Fetch novels
            const qNovels = query(
                collection(db, "novels"),
                where("authorId", "==", user.uid),
                where("published", "==", true)
            );
            const novelsSnap = await getDocs(qNovels);
            const nDocs = novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), collectionName: "novels" } as any));

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
        <main className="p-6 text-[var(--reader-text)] space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-xl tracking-widest uppercase text-[var(--foreground)]">
                    Published Works
                </h1>
            </header>

            {stories.length === 0 ? (
                <p className="text-[var(--reader-text)]">
                    You haven't published any stories yet. Go to your <Link href="/dashboard/drafts" className="text-[var(--foreground)] hover:underline">Drafts</Link> to publish one.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.map((story) => (
                        <div key={story.id} className="bg-[var(--reader-border)]/10 border border-[var(--reader-border)] p-4 rounded-md flex flex-col gap-3 group">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium text-lg text-[var(--foreground)] group-hover:text-blue-400 transition-colors">
                                    {story.title || "Untitled"}
                                </h3>
                                <div className="flex gap-3">
                                    <Link
                                        href={`/dashboard/drafts/${story.id}`}
                                        className="text-xs text-[var(--reader-text)] hover:text-[var(--foreground)]"
                                    >
                                        Edit
                                    </Link>
                                    <a
                                        href={`http://localhost:3000/${story.collectionName === "novels" ? "novels" : "stories"}/${story.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[var(--reader-text)] hover:text-blue-400"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => handleUnpublish(story.id, story.collectionName)}
                                        className="text-xs text-red-500 hover:text-red-400"
                                    >
                                        Unpublish
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--reader-text)]/80 line-clamp-3">
                                {story.type === "novel" ? "Long-form Novel" : story.content}
                            </p>

                            <div className="mt-auto pt-3 border-t border-[var(--reader-border)] flex justify-between text-xs text-[var(--reader-text)]/70">
                                <span className="uppercase tracking-widest">{story.type || "short"}</span>
                                <span>{story.genre}</span>
                                <span>
                                    {story.publishedAt?.seconds
                                        ? new Date(story.publishedAt.seconds * 1000).toLocaleDateString()
                                        : "Just now"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
