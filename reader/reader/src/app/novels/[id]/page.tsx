"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";

export default function NovelLandingPage() {
    const { id } = useParams<{ id: string }>();
    const [novel, setNovel] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "novels", id);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setNovel(snap.data());

                    // Load chapters
                    const chaptersRef = collection(db, "novels", id, "chapters");
                    const q = query(
                        chaptersRef,
                        where("published", "==", true),
                        orderBy("order", "asc")
                    );
                    const chaptersSnap = await getDocs(q);
                    setChapters(chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } else {
                    router.push("/404");
                }
            } catch (error) {
                console.error("Error loading novel:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, router]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 uppercase tracking-widest text-xs">
            Unrolling the scroll...
        </div>
    );

    if (!novel) return null;

    return (
        <main className="min-h-screen bg-black text-gray-200">
            {/* Header / Hero */}
            <div className="relative h-[50vh] overflow-hidden">
                <img
                    src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=The+Chronicles"}
                    className="w-full h-full object-cover opacity-40 blur-sm"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                <div className="absolute inset-0 flex items-end">
                    <div className="max-w-6xl mx-auto px-8 md:px-16 pb-12 w-full flex flex-col md:flex-row gap-8 items-end">
                        <div className="w-48 aspect-[2/3] bg-zinc-900 rounded-sm shadow-2xl overflow-hidden border border-white/10 flex-shrink-0">
                            <img
                                src={novel.coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Under+Construction"}
                                className="w-full h-full object-cover"
                                alt={novel.title}
                            />
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-bold">{novel.genre}</span>
                                <h1 className="text-4xl md:text-5xl font-light tracking-widest text-white uppercase">{novel.title}</h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link
                                    href={`/authors/${novel.authorId}`}
                                    className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide"
                                >
                                    by {novel.authorName}
                                </Link>
                                <span className="h-1 w-1 bg-gray-700 rounded-full" />
                                <span className="text-gray-500 text-xs uppercase tracking-widest">{chapters.length} Chapters</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-8 md:px-16 py-16 grid grid-cols-1 md:grid-cols-3 gap-16">
                {/* Right / Main: Chapters */}
                <div className="md:col-span-2 space-y-12">
                    <section className="space-y-6">
                        <h2 className="text-xs uppercase tracking-[0.4em] text-gray-600 font-bold border-b border-white/5 pb-4">Table of Contents</h2>
                        <div className="grid gap-2">
                            {chapters.map((chapter, index) => (
                                <Link
                                    key={chapter.id}
                                    href={`/novels/${id}/chapter/${chapter.id}`}
                                    className="group flex items-center justify-between p-4 bg-zinc-900/10 border border-white/5 hover:bg-white/5 transition-all"
                                >
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Chapter {index + 1}</p>
                                        <h3 className="text-gray-200 group-hover:text-white transition-colors tracking-wide">{chapter.title}</h3>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest text-gray-700 group-hover:text-gray-400 transition-colors">Read →</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Left / Secondary: Stats/Details */}
                <div className="space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xs uppercase tracking-[0.4em] text-gray-600 font-bold border-b border-white/10 pb-4">Chronicle Details</h2>
                        <div className="space-y-6 text-sm">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-gray-700">Published</p>
                                <p className="text-gray-400">Jan 29, 2026</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-gray-700">Status</p>
                                <p className="text-emerald-500 uppercase tracking-widest text-xs">Ongoing</p>
                            </div>
                            <button className="w-full bg-white text-black py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-gray-200 transition-colors">
                                Add to Library
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
