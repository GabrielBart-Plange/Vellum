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
        <main
            className="min-h-screen py-24 transition-colors duration-500 ease-in-out"
            style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-text)' }}
        >
            <ReadingSettings
                currentTheme={theme}
                currentFontSize={fontSize}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
            />

            {/* Top Navigation Bar */}
            <div
                className="fixed top-0 inset-x-0 backdrop-blur-xl border-b z-50 transition-colors"
                style={{ backgroundColor: 'var(--reader-footer-bg)', borderColor: 'var(--reader-border)' }}
            >
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href={`/novels/${novelId}`} className="text-[10px] uppercase tracking-[0.4em] text-gray-500 hover:text-[var(--reader-accent)] transition-colors">
                        ← {novel.title}
                    </Link>
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold leading-none">Chapter {currentIndex + 1}</p>
                        <h3 className="text-xs opacity-80 truncate max-w-[200px]">{chapter.title}</h3>
                    </div>
                    <div className="w-16" /> {/* Spacer */}
                </div>
            </div>

            <article className="max-w-2xl mx-auto px-6 space-y-16">
                {/* Chapter Title Section */}
                <header className="space-y-4 pt-12 text-center">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-bold" style={{ color: 'var(--reader-accent)' }}>Chapter {currentIndex + 1}</p>
                    <h1 className="text-3xl md:text-5xl font-light tracking-wide uppercase italic" style={{ color: 'var(--reader-text)' }}>
                        {chapter.title}
                    </h1>
                    <div className="h-1 w-12 mx-auto mt-12 transition-colors" style={{ backgroundColor: 'var(--reader-border)' }} />
                </header>

                {/* Chapter Content */}
                <div className="max-w-none">
                    <div className="leading-relaxed font-serif select-text">
                        <SystemNotation content={chapter.content} fontSize={fontSize} />
                    </div>
                </div>

                {/* Footer Navigation */}
                <footer className="pt-24 space-y-12">
                    <div className="h-px w-full" style={{ backgroundColor: 'var(--reader-border)' }} />
                    <div className="grid grid-cols-2 gap-8 pb-32">
                        {prevChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${prevChapter.id}`}
                                className="group p-6 border transition-all space-y-2 text-left hover:scale-[1.02]"
                                style={{ borderColor: 'var(--reader-border)' }}
                            >
                                <p className="text-[10px] uppercase tracking-widest opacity-50">Previous</p>
                                <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">{prevChapter.title}</p>
                            </Link>
                        ) : <div />}

                        {nextChapter ? (
                            <Link
                                href={`/novels/${novelId}/chapter/${nextChapter.id}`}
                                className="group p-6 border transition-all space-y-2 text-right hover:scale-[1.02]"
                                style={{ borderColor: 'var(--reader-border)', backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[10px] uppercase tracking-widest opacity-50">Next Chapter</p>
                                <p className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">{nextChapter.title}</p>
                            </Link>
                        ) : (
                            <div className="p-6 border border-dashed text-center" style={{ borderColor: 'var(--reader-border)' }}>
                                <p className="text-[10px] uppercase tracking-widest opacity-30">The End of Current Chronicles</p>
                            </div>
                        )}
                    </div>
                </footer>
            </article>

            {/* Reading Progress Line */}
            <div className="fixed bottom-0 inset-x-0 h-1 z-50" style={{ backgroundColor: 'var(--reader-border)' }}>
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${((currentIndex + 1) / allChapters.length) * 100}%`,
                        backgroundColor: 'var(--reader-accent)'
                    }}
                />
            </div>
        </main>
    );
}
