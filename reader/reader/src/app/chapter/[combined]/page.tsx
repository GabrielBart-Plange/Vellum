"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, onSnapshot, increment, updateDoc, DocumentData } from "firebase/firestore";
import Link from "next/link";

import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";
import LikeButton from "@/components/interactions/LikeButton";
import CommentSection from "@/components/interactions/CommentSection";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { progressTracking } from "@/lib/progressTracking";
import ManagedAd from "@/components/monetization/ManagedAd";
import TipButton from "@/components/interactions/TipButton";
import { getChapterStatus, unlockChapter } from "@/lib/monetization/coinService";

export default function UnifiedChapterPage({ params }: { params: Promise<{ combined: string }> }) {
    const { combined } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    
    const [novel, setNovel] = useState<DocumentData | null>(null);
    const [novelId, setNovelId] = useState<string | null>(null);
    const [chapter, setChapter] = useState<DocumentData | null>(null);
    const [chapterId, setChapterId] = useState<string | null>(null);
    const [allChapters, setAllChapters] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);

    const { theme, setTheme } = useTheme();
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState("sans");
    const [progress, setProgress] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [unlockPrice, setUnlockPrice] = useState(0);
    const [unlocking, setUnlocking] = useState(false);

    // Parsing combined param (e.g. angle-s-arrogance-12)
    const lastHyphenIndex = combined.lastIndexOf("-");
    const novelIdentifier = combined.substring(0, lastHyphenIndex);
    const chapterNumStr = combined.substring(lastHyphenIndex + 1);
    const chapterOrder = parseInt(chapterNumStr);

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
        const savedSize = localStorage.getItem("reader-font-size") || "18";
        const savedFont = localStorage.getItem("reader-font-family") || "sans";
        setFontSize(parseInt(savedSize));
        setFontFamily(savedFont);
    }, []);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem("reader-font-size", fontSize.toString());
            localStorage.setItem("reader-font-family", fontFamily);
        }
    }, [fontSize, fontFamily, loading]);

    useEffect(() => {
        const load = async () => {
            if (!combined || isNaN(chapterOrder)) return;
            try {
                // 1. Find Novel by Slug or ID
                let docId = novelIdentifier;
                let novelRef = doc(db, "novels", docId);
                let novelSnap = await getDoc(novelRef);

                if (!novelSnap.exists()) {
                    // 2a. Try to find by slug field
                    const qSlug = query(collection(db, "novels"), where("slug", "==", novelIdentifier), where("published", "==", true));
                    const qSlugSnap = await getDocs(qSlug);
                    if (!qSlugSnap.empty) {
                        novelSnap = qSlugSnap.docs[0];
                        docId = novelSnap.id;
                        novelRef = doc(db, "novels", docId);
                    } else {
                        // 2b. Try to find by numericalId if the identifier is a number
                        const maybeNum = parseInt(novelIdentifier);
                        if (!isNaN(maybeNum)) {
                            const qNum = query(collection(db, "novels"), where("numericalId", "==", maybeNum), where("published", "==", true));
                            const qNumSnap = await getDocs(qNum);
                            if (!qNumSnap.empty) {
                                novelSnap = qNumSnap.docs[0];
                                docId = novelSnap.id;
                                novelRef = doc(db, "novels", docId);
                            }
                        }
                    }
                }

                if (novelSnap.exists()) {
                    setNovelId(docId);
                    setNovel(novelSnap.data());

                    // 2. Find Chapter by Order
                    const chaptersRef = collection(db, "novels", docId, "chapters");
                    const chapQuery = query(chaptersRef, where("order", "==", chapterOrder), where("published", "==", true));
                    const chapSnap = await getDocs(chapQuery);

                    if (!chapSnap.empty) {
                        const targetChap = chapSnap.docs[0];
                        setChapterId(targetChap.id);
                        setChapter(targetChap.data());

                        // Real-time listener for current chapter
                        onSnapshot(targetChap.ref, (d) => {
                            if (d.exists()) setChapter(d.data());
                        });

                        // 3. Load all chapters for navigation
                        const allChapQuery = query(chaptersRef, where("published", "==", true), orderBy("order", "asc"));
                        const allChapSnap = await getDocs(allChapQuery);
                        const chaptersList = allChapSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAllChapters(chaptersList);

                        // Save progress
                        if (user) {
                            await progressTracking.saveProgress(
                                user.uid,
                                docId,
                                novelSnap.data()?.title,
                                novelSnap.data()?.coverImage,
                                novelSnap.data()?.authorName,
                                targetChap.id,
                                targetChap.data()?.title || `Unit ${chapterOrder}`,
                                chapterOrder,
                                allChapSnap.size
                            );
                        }

                        // View Increment
                        const storageKey = `viewed_chapter_${targetChap.id}`;
                        if (!localStorage.getItem(storageKey)) {
                            await updateDoc(targetChap.ref, { views: increment(1) });
                            localStorage.setItem(storageKey, "true");
                        }

                        // 4. Check Lock Status
                        if (targetChap.data()?.isPremium) {
                            if (user) {
                                // 1. Author Bypass
                                if (user.uid === novelSnap.data()?.authorId) {
                                    setIsLocked(false);
                                } else {
                                    // 2. Check for explicit unlock record in Firestore (client-side)
                                    const unlockRef = doc(db, "users", user.uid, "unlockedChapters", targetChap.id);
                                    const unlockSnap = await getDoc(unlockRef);

                                    if (unlockSnap.exists()) {
                                        setIsLocked(false);
                                    } else {
                                        // 3. Backend status check
                                        const status = await getChapterStatus(user.uid, docId, targetChap.id);
                                        setIsLocked(status.locked);
                                        setUnlockPrice(status.price || targetChap.data()?.price || 10);
                                    }
                                }
                            } else {
                                setIsLocked(true);
                                setUnlockPrice(targetChap.data()?.price || 10);
                            }
                        } else {
                            setIsLocked(false);
                        }
                    } else {
                        router.push(`/novel/${novelIdentifier}`);
                    }
                } else {
                    router.push("/novels");
                }
            } catch (err) {
                console.error("Error loading unified chapter:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [combined, user, router, novelIdentifier, chapterOrder]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-widest text-xs">
            Unrolling the chronicle...
        </div>
    );

    if (!chapter || !novel || !novelId || !chapterId) return null;

    const currentIndex = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = allChapters[currentIndex - 1];
    const nextChapter = allChapters[currentIndex + 1];

    return (
        <main className="min-h-screen pb-40 transition-colors duration-500 ease-in-out font-sans relative">
            <div className="fixed top-0 left-0 w-full h-1 z-[150] pointer-events-none">
                <div
                    className="h-full bg-[var(--reader-accent)] transition-all duration-150 ease-out shadow-[0_0_10px_var(--reader-accent)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <ReadingSettings
                currentFontSize={fontSize}
                currentFontFamily={fontFamily}
                onFontSizeChange={setFontSize}
                onFontFamilyChange={setFontFamily}
            />

            <div className="relative h-[50vh] w-full overflow-hidden flex items-end">
                <img
                    src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 pb-12 w-full text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black" style={{ color: 'var(--reader-accent)' }}>
                        Unit {chapterOrder}
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
                <div className="flex items-center gap-4 py-8 border-b border-t mb-16 transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
                    <LikeButton
                        contentType="chapter"
                        contentId={chapterId}
                        novelId={novelId}
                        initialLikeCount={chapter.likes || 0}
                    />
                    <TipButton creatorId={novel.authorId} creatorName={novel.authorName} />

                    <div className="flex-grow" />

                    <div className="hidden md:flex items-center gap-6">
                        {prevChapter && (
                            <Link href={`/chapter/${novelIdentifier}-${prevChapter.order}`} className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                                Prev Unit
                            </Link>
                        )}
                        {nextChapter && (
                            <Link href={`/chapter/${novelIdentifier}-${nextChapter.order}`} className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                                Next Unit
                            </Link>
                        )}
                    </div>
                </div>

                <div
                    className={`leading-relaxed select-text min-h-[50vh] relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
                >
                    {isLocked ? (
                        <div className="relative py-20 px-6 rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            {/* Decorative background for the lock */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                            
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-accent)]">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black uppercase tracking-widest text-white">This Chapter is Locked</h3>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold max-w-sm mx-auto">
                                        The chronicler has restricted this content. Support them to continue the unrolling.
                                    </p>
                                </div>
                                
                                {user ? (
                                    <div className="space-y-4">
                                        <button 
                                            onClick={async () => {
                                                setUnlocking(true);
                                                const success = await unlockChapter(user.uid, novelId, chapterId);
                                                if (success) {
                                                    setIsLocked(false);
                                                } else {
                                                    alert("Unlock failed. Check your Inklet balance.");
                                                }
                                                setUnlocking(false);
                                            }}
                                            disabled={unlocking}
                                            className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--reader-accent)] hover:text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            {unlocking ? "Processing Unlock..." : `Unlock for ${unlockPrice} Inklets`}
                                        </button>
                                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black">Refreshes permanently for your archive</p>
                                    </div>
                                ) : (
                                    <Link 
                                        href={`/login?returnUrl=/chapter/${combined}`} 
                                        className="inline-block bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all"
                                    >
                                        Login to Unlock
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <SystemNotation content={chapter.content} fontSize={fontSize} />
                    )}
                </div>

                <CommentSection
                    contentType="chapter"
                    contentId={chapterId}
                    novelId={novelId}
                    initialCommentCount={chapter.commentCount || 0}
                />

                <ManagedAd zone="READER_AFTER_CHAPTER" />

                <footer className="pt-32 space-y-16">
                    <div className="h-px w-full" style={{ backgroundColor: 'var(--reader-border)' }} />

                    <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                        {prevChapter ? (
                            <Link
                                href={`/chapter/${novelIdentifier}-${prevChapter.order}`}
                                className="flex-1 group p-8 glass-panel border border-[var(--reader-border)] rounded-3xl transition-all space-y-3 hover:border-[var(--reader-accent)]/30"
                                style={{ backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black">Previous Unit</p>
                                <p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase">{prevChapter.title}</p>
                            </Link>
                        ) : <div className="flex-1" />}

                        {nextChapter ? (
                            <Link
                                href={`/chapter/${novelIdentifier}-${nextChapter.order}`}
                                className="flex-1 group p-8 glass-panel border border-[var(--reader-border)] rounded-3xl transition-all space-y-3 text-right hover:border-[var(--reader-accent)]/30"
                                style={{ backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black">Next Unit</p>
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
                        <Link href={`/novel/${novelIdentifier}`} className="text-[10px] uppercase tracking-[0.6em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all">
                            Back to Shelf
                        </Link>
                    </div>
                </footer>
            </article>

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
