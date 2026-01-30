"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";

export default function ChapterReaderPage() {
    const { id: novelId, chapterId } = useParams<{ id: string, chapterId: string }>();
    const [novel, setNovel] = useState<any>(null);
    const [chapter, setChapter] = useState<any>(null);
    const [allChapters, setAllChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const load = async () => {
            if (!novelId || !chapterId) return;
            try {
                // Load Novel Metadata
                const novelSnap = await getDoc(doc(db, "novels", novelId));
                if (novelSnap.exists()) setNovel(novelSnap.data());

                // Load Chapter
                const chapterSnap = await getDoc(doc(db, "novels", novelId, "chapters", chapterId));
                if (chapterSnap.exists()) {
                    setChapter(chapterSnap.data());
                } else {
                    router.push(`/novels/${novelId}`);
                }

                // Load all chapters for navigation
                const chaptersRef = collection(db, "novels", novelId, "chapters");
                const q = query(
                    chaptersRef,
                    where("published", "==", true),
                    orderBy("order", "asc")
                );
                const chaptersSnap = await getDocs(q);
                setAllChapters(chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            } catch (error) {
                console.error("Error loading chapter:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [novelId, chapterId, router]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 uppercase tracking-widest text-xs">
            Summoning the ink...
        </div>
    );

    if (!chapter || !novel) return null;

    const currentIndex = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = allChapters[currentIndex - 1];
    const nextChapter = allChapters[currentIndex + 1];

    return (
        <main className="min-h-screen bg-black text-gray-300 py-24 selection:bg-indigo-500/30">
            {/* Top Navigation Bar */}
            <div className="fixed top-0 inset-x-0 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/novels/${novelId}`} className="text-[10px] uppercase tracking-[0.4em] text-gray-500 hover:text-white transition-colors">
                        ← {novel.title}
                    </Link>
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none">Chapter {currentIndex + 1}</p>
                        <h3 className="text-xs text-gray-600 truncate max-w-[200px]">{chapter.title}</h3>
                    </div>
                    <div className="w-16" /> {/* Spacer */}
                </div>
            </div>

            <article className="max-w-2xl mx-auto px-6 space-y-16">
                {/* Chapter Title Section */}
                <header className="space-y-4 pt-12 text-center">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-indigo-400 font-bold">Chapter {currentIndex + 1}</p>
                    <h1 className="text-3xl md:text-5xl font-light tracking-wide text-white uppercase italic">
                        {chapter.title}
                    </h1>
                    <div className="h-1 w-12 bg-white/10 mx-auto mt-12" />
                </header>

                {/* Chapter Content */}
                <div className="prose prose-invert prose-zinc max-w-none">
                    <p className="text-lg md:text-xl leading-relaxed text-gray-300 font-serif whitespace-pre-wrap">
                        {chapter.content}
                    </p>
                </div>

                {/* Footer Navigation */}
                <footer className="pt-24 space-y-12">
                    <div className="h-1 w-full bg-white/5" />
                    <div className="grid grid-cols-2 gap-8 pb-32">
                        {prevChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${prevChapter.id}`}
                                className="group p-6 border border-white/5 hover:bg-white/5 transition-all space-y-2 text-left"
                            >
                                <p className="text-[10px] uppercase tracking-widest text-gray-600">Previous</p>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors">{prevChapter.title}</p>
                            </Link>
                        ) : <div />}

                        {nextChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${nextChapter.id}`}
                                className="group p-6 border border-white/5 hover:bg-white/5 transition-all space-y-2 text-right"
                            >
                                <p className="text-[10px] uppercase tracking-widest text-gray-600">Next Chapter</p>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors">{nextChapter.title}</p>
                            </Link>
                        ) : (
                            <div className="p-6 border border-dashed border-white/5 text-center">
                                <p className="text-[10px] uppercase tracking-widest text-gray-700">The End of Current Chronicles</p>
                            </div>
                        )}
                    </div>
                </footer>
            </article>

            {/* Reading Progress Line */}
            <div className="fixed bottom-0 inset-x-0 h-1 bg-zinc-900 z-50">
                <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / allChapters.length) * 100}%` }}
                />
            </div>
        </main>
    );
}
