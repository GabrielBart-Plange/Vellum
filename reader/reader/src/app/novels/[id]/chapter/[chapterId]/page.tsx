"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, onSnapshot, increment, updateDoc } from "firebase/firestore";
import Link from "next/link";

import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";
import LikeButton from "@/components/interactions/LikeButton";
import CommentSection from "@/components/interactions/CommentSection";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";

export default function ChapterReaderPage() {
    const { id: novelId, chapterId } = useParams<{ id: string, chapterId: string }>();
    const { user } = useAuth();
    const [novel, setNovel] = useState<any>(null);
    const [chapter, setChapter] = useState<any>(null);
    const [allChapters, setAllChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Reading Transformation State
    const [theme, setTheme] = useState("void");
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState("sans");
    const [progress, setProgress] = useState(0);

    // Removed local interaction state - now handled by LikeButton component

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY;
            if (totalScroll <= 0) {
                setProgress(0);
                return;
            }
            setProgress((currentScroll / totalScroll) * 100);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const savedTheme = localStorage.getItem("reader-theme") || "void";
        const savedSize = localStorage.getItem("reader-font-size") || "18";
        const savedFont = localStorage.getItem("reader-font-family") || "sans";
        setTheme(savedTheme);
        setFontSize(parseInt(savedSize));
        setFontFamily(savedFont);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("reader-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("reader-font-size", fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem("reader-font-family", fontFamily);
    }, [fontFamily]);

    useEffect(() => {
        // Increment View Count for Chapter with basic deduplication
        const incrementView = async () => {
            if (!chapterId || !novelId) return;

            const storageKey = `viewed_chapter_${chapterId}`;
            if (localStorage.getItem(storageKey)) return;

            try {
                const chapterRef = doc(db, "novels", novelId, "chapters", chapterId);
                await updateDoc(chapterRef, {
                    views: increment(1)
                });
                localStorage.setItem(storageKey, "true");
            } catch (error) {
                console.error("Error incrementing view:", error);
            }
        };
        incrementView();
    }, [chapterId, novelId]);

    useEffect(() => {
        let unsubscribeChapter: () => void;

        const load = async () => {
            if (!novelId || !chapterId) return;
            try {
                // Load Novel Metadata (Static is fine for metadata, but we might want real-time later. For now keep static to minimize reads if not needed, but consistency suggested real-time)
                // Actually user said "engagement to record real-time", specifically for metrics. 
                const novelSnap = await getDoc(doc(db, "novels", novelId));
                if (novelSnap.exists()) {
                    const novelData = novelSnap.data();
                    setNovel(novelData);
                }

                // Load Chapter Real-time
                unsubscribeChapter = onSnapshot(doc(db, "novels", novelId, "chapters", chapterId), (doc) => {
                    if (doc.exists()) {
                        setChapter(doc.data());
                    } else {
                        router.push(`/novels/${novelId}`);
                    }
                }, (error) => {
                    console.error("Error listening to chapter:", error);
                });

                // Load all chapters for navigation
                const chaptersRef = collection(db, "novels", novelId, "chapters");
                const q = query(
                    chaptersRef,
                    where("published", "==", true),
                    orderBy("order", "asc")
                );
                // Keeping navigation static for now to avoid flickering, unless requested.
                const chaptersSnap = await getDocs(q);
                setAllChapters(chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // Save progress if user is authenticated
                // We only do this once on mount/load, not on every snapshot update
                if (user && novelSnap.exists()) { // Check novelSnap existence from the static fetch above
                    // We need the chapter data for 'order'. We can get it from the snapshot listener but that's async. 
                    // For progress saving complexity, let's fetch it once or assume access.
                    // A cleaner way is to separate the progress saving.

                    // Let's do a single fetch for progress saving purposes or wait for the first snapshot.
                    const chapterSnap = await getDoc(doc(db, "novels", novelId, "chapters", chapterId));
                    if (chapterSnap.exists()) {
                        const chapterData = chapterSnap.data();
                        const chapterOrder = typeof chapterData?.order === "number" ? chapterData.order : 0;
                        await progressTracking.saveProgress(
                            user.uid,
                            novelId,
                            chapterId,
                            chapterOrder,
                            chaptersSnap.size
                        );
                    }
                }

            } catch (error) {
                console.error("Error loading chapter:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
        return () => {
            if (unsubscribeChapter) unsubscribeChapter();
        };
    }, [novelId, chapterId, router, user]);

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
                currentFontFamily={fontFamily}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
                onFontFamilyChange={setFontFamily}
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
                    <LikeButton
                        contentType="chapter"
                        contentId={chapterId}
                        novelId={novelId}
                        initialLikeCount={chapter.likes || 0}
                    />

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
                <div
                    className={`leading-relaxed select-text min-h-[50vh] ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
                >
                    <SystemNotation content={chapter.content} fontSize={fontSize} />
                </div>

                <CommentSection
                    contentType="chapter"
                    contentId={chapterId}
                    novelId={novelId}
                    initialCommentCount={chapter.commentCount || 0}
                />

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
                            Back to Shelf
                        </Link>
                    </div>
                </footer>
            </article>

            {/* Reading Progress Line */}
            <div className="fixed bottom-0 inset-x-0 h-1 z-50 bg-black/20">
                <div
                    className="h-full transition-all duration-300 shadow-[0_0_10px_var(--reader-accent)]"
                    style={{
                        width: `${allChapters.length ? ((currentIndex + 1) / allChapters.length) * 100 : 0}%`,
                        backgroundColor: 'var(--reader-accent)'
                    }}
                />
            </div>
        </main>
    );
}
