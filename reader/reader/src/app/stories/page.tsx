"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryCard from "@/components/cards/StoryCard";

export default function ShortStoriesPage() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const ref = collection(db, "stories");
                // Combine 'published' filter with sorting. 
                // Note: This requires a composite index in Firestore.
                // If index is missing, it will throw an error with a link to create it.
                const q = query(
                    ref,
                    where("published", "==", true),
                    orderBy("publishedAt", "desc")
                );
                const snap = await getDocs(q);
                setStories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching stories:", error);
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
                        All Short Stories
                    </h1>
                    <p className="mt-2 text-gray-500">
                        Explore our complete collection of short fiction.
                    </p>
                </header>

                {loading ? (
                    <div className="text-gray-500">Loading library...</div>
                ) : stories.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {stories.map((story) => (
                            <StoryCard
                                key={story.id}
                                id={story.id}
                                title={story.title}
                                author={story.authorName || "Unknown Author"}
                                imageUrl={story.coverImage}
                                category={story.genre || "Story"}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No stories found.</p>
                )}
            </div>
        </main>
    );
}
