"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";

import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";

export default function ChapterReaderPage() {
    const { id: novelId, chapterId } = useParams<{ id: string, chapterId: string }>();
    const [novel, setNovel] = useState<any>(null);
    const [chapter, setChapter] = useState<any>(null);
    const [allChapters, setAllChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Reading Transformation State
    const [theme, setTheme] = useState("void");
    const [fontSize, setFontSize] = useState(18);
    const [progress, setProgress] = useState(0);

    // Interaction State
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(novel?.likes || 42); // Placeholder

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            setProgress((currentScroll / totalScroll) * 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem("reader-theme") || "void";
        const savedSize = localStorage.getItem("reader-font-size") || "18";
        setTheme(savedTheme);
        setFontSize(parseInt(savedSize));
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("reader-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("reader-font-size", fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        const load = async () => {
            if (!novelId || !chapterId) return;
            try {
                // Load Novel Metadata
                const novelSnap = await getDoc(doc(db, "novels", novelId));
                if (novelSnap.exists()) {
                    const novelData = novelSnap.data();
                    setNovel(novelData);
                    setLikeCount(novelData.likes || 42);
                }

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

                // Increment View (Optional, but good for "real" feel)
                // updateDoc(doc(db, "novels", novelId), { views: increment(1) });

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
        <main
            className="min-h-screen pb-40 transition-colors duration-500 ease-in-out font-sans relative"
            style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-text)' }}
        >
            {/* Reading Progress Line */}
            <div className="fixed top-0 left-0 w-full h-1 z-[150] pointer-events-none">
                <div
                    className="h-full bg-[var(--reader-accent)] transition-all duration-150 ease-out shadow-[0_0_10px_var(--reader-accent)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <ReadingSettings
                currentTheme={theme}
                currentFontSize={fontSize}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
            />

            {/* Premium Header - Inspired by CHAMPION design */}
            <div className="relative h-[50vh] w-full overflow-hidden flex items-end">
                <img
                    src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 pb-12 w-full text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black" style={{ color: 'var(--reader-accent)' }}>
                        Unit {currentIndex + 1}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight" style={{ color: 'var(--reader-text)' }}>
                        {chapter.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-widest opacity-60 font-black">
                        <span>{novel.title}</span>
                        <div className="h-1 w-1 bg-zinc-600 rounded-full" />
                        <Link href={`/authors/${novel.authorId}`} className="hover:text-[var(--reader-accent)] transition-colors">
                            {novel.authorName}
                        </Link>
                    </div>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 md:px-12">
                {/* Interaction Bar - Moescape style */}
                <div className="flex items-center gap-4 py-8 border-b border-t mb-16 transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
                    <div className="flex items-center gap-1.5 glass-panel px-4 py-2 rounded-2xl">
                        <button
                            onClick={() => { setLiked(!liked); setLikeCount(liked ? likeCount - 1 : likeCount + 1); }}
                            className={`transition-all ${liked ? 'text-pink-500 scale-110' : 'text-zinc-500 hover:text-pink-400'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                        </button>
                        <span className="text-xs font-bold text-zinc-400">{likeCount}</span>
                    </div>

                    <div className="flex items-center gap-1.5 glass-panel px-4 py-2 rounded-2xl group cursor-pointer hover:bg-white/5 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785c-.442.483.087 1.228.639.986 1.123-.494 2.454-.973 3.348-1.15a3.15 3.15 0 0 1 1.066.023c.337.062.671.139 1.011.139Z" />
                        </svg>
                        <span className="text-xs font-bold text-zinc-400">{novel.commentCount || 0}</span>
                    </div>

                    <div className="flex-grow" />

                    <div className="hidden md:flex items-center gap-6">
                        {prevChapter && (
                            <Link href={`/novels/${novelId}/chapter/${prevChapter.id}`} className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                                Prev Unit
                            </Link>
                        )}
                        {nextChapter && (
                            <Link href={`/novels/${novelId}/chapter/${nextChapter.id}`} className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                                Next Unit
                            </Link>
                        )}
                    </div>
                </div>

                {/* Chapter Content */}
                <div className="leading-relaxed select-text min-h-[50vh]" style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}>
                    <SystemNotation content={chapter.content} fontSize={fontSize} />
                </div>

                {/* Footer Navigation */}
                <footer className="pt-32 space-y-16">
                    <div className="h-px w-full" style={{ backgroundColor: 'var(--reader-border)' }} />

                    <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                        {prevChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${prevChapter.id}`}
                                className="flex-1 group p-8 glass-panel border border-white/5 rounded-3xl transition-all space-y-3 hover:border-purple-500/30"
                                style={{ backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black">Previous Unit</p>
                                <p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase">{prevChapter.title}</p>
                            </Link>
                        ) : <div className="flex-1" />}

                        {nextChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${nextChapter.id}`}
                                className="flex-1 group p-8 glass-panel border border-white/5 rounded-3xl transition-all space-y-3 text-right hover:border-purple-500/30"
                                style={{ backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black">Next Unit</p>
                                <p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase">{nextChapter.title}</p>
                            </Link>
                        ) : (
                            <div className="flex-1 p-8 border border-dashed rounded-3xl flex flex-col items-center justify-center space-y-2 opacity-30" style={{ borderColor: 'var(--reader-border)' }}>
                                <p className="text-[9px] uppercase tracking-[0.4em] font-black">End of Volume</p>
                                <p className="text-lg font-black uppercase">Archive Complete</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-16">
                        <Link href={`/novels/${novelId}`} className="text-[10px] uppercase tracking-[0.6em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                            Back to Index
                        </Link>
                    </div>
                </footer>
            </article>

            {/* Reading Progress Line */}
            <div className="fixed bottom-0 inset-x-0 h-1 z-50 bg-black/20">
                <div
                    className="h-full transition-all duration-300 shadow-[0_0_10px_var(--reader-accent)]"
                    style={{
                        width: `${((currentIndex + 1) / allChapters.length) * 100}%`,
                        backgroundColor: 'var(--reader-accent)'
                    }}
                />
            </div>
        </main>
    );
}
