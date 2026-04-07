"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, onSnapshot, increment, updateDoc, DocumentData } from "firebase/firestore";
import Link from "next/link";
import { Menu, X, ChevronLeft, ChevronRight, Book, Share2, Bookmark, Heart, Coins, Flag } from "lucide-react";

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
import { analyticsService } from "@/lib/analyticsService";
import ReportModal from "@/components/modals/ReportModal";

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
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showIndex, setShowIndex] = useState(false);
    const [maxChapterOrderRead, setMaxChapterOrderRead] = useState<number>(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isViralUnlock, setIsViralUnlock] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

                            // Check and set saved status
                            const savedRef = doc(db, "users", user.uid, "savedNovels", docId);
                            const savedSnap = await getDoc(savedRef);
                            setSaved(savedSnap.exists());

                            // Check and set max chapter read (using progress document after save)
                            const progressRef = doc(db, "users", user.uid, "progress", docId);
                            const progressSnap = await getDoc(progressRef);
                            if (progressSnap.exists()) {
                                setMaxChapterOrderRead(Math.max(progressSnap.data().chapterOrder, chapterOrder));
                            } else {
                                setMaxChapterOrderRead(chapterOrder);
                            }
                        } else {
                            setMaxChapterOrderRead(chapterOrder);
                        }

                        // View Increment
                        const storageKey = `viewed_chapter_${targetChap.id}`;
                        if (!localStorage.getItem(storageKey)) {
                            await updateDoc(targetChap.ref, { views: increment(1) });
                            localStorage.setItem(storageKey, "true");
                            
                            // Analytics tracking
                            analyticsService.trackChapterView({
                                novelId: docId,
                                chapterId: targetChap.id,
                                authorId: novelSnap.data()?.authorId,
                                userId: user?.uid
                            });
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

        // Check for session-based viral unlock
        const viralKey = `viral_unlock_chapter_${chapterId}`;
        if (localStorage.getItem(viralKey)) {
            setIsLocked(false);
            setIsViralUnlock(true);
        }
    }, [combined, user, router, novelIdentifier, chapterOrder, chapterId]);

    const handleShareToUnlock = () => {
        const referralId = (user as any)?.referralId || "VELLUM";
        const shareUrl = `${window.location.origin}/novel/${novel?.slug || novelIdentifier}?ref=${referralId}`;
        const shareText = `I'm reading "${novel?.title}" on Vellum! It's incredible. Use my archival link to get 50 bonus Inklets: ${shareUrl}`;
        
        // Use Web Share API for "Easy" sharing if available
        if (navigator.share) {
            navigator.share({
                title: novel?.title,
                text: shareText,
                url: shareUrl,
            }).catch(err => console.log("Share failed:", err));
        } else {
            // Fallback to WhatsApp Share Intent
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }

        // Grant temporary unlock
        if (chapterId) {
            localStorage.setItem(`viral_unlock_chapter_${chapterId}`, "true");
            setIsLocked(false);
            setIsViralUnlock(true);
        }
    };

    const handleToggleBookmark = async () => {
        if (!user) {
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }
        if (!novel || !novelId) return;

        setSaving(true);
        try {
            if (saved) {
                await progressTracking.unsaveNovel(user.uid, novelId);
                setSaved(false);
            } else {
                await progressTracking.saveNovel(
                    user.uid,novelId,novel.title || "Untitled",novel.coverImage || "",novel.authorName || "Unknown Author",novel.authorId || novel.creatorId,novel.numericalId,novel.slug
                );
                setSaved(true);
            }
        } catch (error) {
            console.error("Error toggling novel save:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-[0.8em] text-[10px] font-black">
            Accessing Chapter...
        </div>
    );

    if (!chapter || !novel || !novelId || !chapterId) return null;

    const currentIndex = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = allChapters[currentIndex - 1];
    const nextChapter = allChapters[currentIndex + 1];

    return (
        <main className={`min-h-screen pb-40 transition-all duration-500 ease-in-out font-sans relative ${isSidebarOpen ? 'pl-0 lg:pl-80' : 'pl-0'}`}>
            {/* Sidebar ToC */}
            <aside 
                className={`fixed top-0 left-0 z-[200] h-full w-80 bg-[var(--reader-bg)] border-r border-[var(--reader-border)] transition-transform duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto custom-scrollbar`}
            >
                <div className="sticky top-0 z-20 bg-[var(--reader-bg)]/80 backdrop-blur-xl border-b border-[var(--reader-border)] p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Table of Contents</p>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors lg:hidden">
                            <X size={18} />
                        </button>
                    </div>
                    <h2 className="text-lg font-black uppercase text-[var(--reader-text)] tracking-tight italic line-clamp-1">{novel.title}</h2>
                </div>

                <div className="p-4 space-y-2">
                    {allChapters.map((chap, index) => {
                        const isCurrent = chap.id === chapterId;
                        const isRead = chap.order <= maxChapterOrderRead && !isCurrent;
                        
                        return (
                            <Link
                                key={chap.id}
                                href={`/chapter/${novelIdentifier}-${chap.order}`}
                                onClick={() => {
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                }}
                                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                    isCurrent 
                                    ? 'border-[var(--reader-accent)]/50 bg-[var(--reader-accent)]/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                                    : 'border-transparent hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className={`text-[10px] font-black tabular-nums ${isCurrent ? 'text-[var(--reader-accent)]' : 'opacity-20'}`}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    <span className={`text-xs font-bold truncate uppercase italic ${isCurrent ? 'text-white' : ''}`}>
                                        {chap.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isRead && <div className="w-1 h-1 rounded-full bg-zinc-700" />}
                                    {chap.isPremium && <Coins size={12} className={isCurrent ? 'text-[var(--reader-accent)]' : 'opacity-20'} />}
                                </div>
                            </Link>
                        );
                    })}

                    {/* Sidebar Ad Placement */}
                    <div className="pt-8 mt-8 border-t border-[var(--reader-border)]">
                        <ManagedAd zone="SIDEBAR_FOOTER" />
                    </div>
                </div>
            </aside>

            {/* Floating Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`fixed bottom-8 left-8 z-[210] w-14 h-14 rounded-full bg-white text-black shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90 ${isSidebarOpen ? 'lg:translate-x-0' : ''}`}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

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

            {/* Top Ad Placement */}
            <div className="max-w-3xl mx-auto px-6 pt-8">
                <ManagedAd zone="READER_TOP" />
            </div>

            <div className="relative h-[50vh] w-full overflow-hidden flex items-end">
                <img
                    src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 pb-12 w-full text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black italic" style={{ color: 'var(--reader-accent)' }}>
                        Chapter {chapterOrder}
                    </p>
                    
                    {/* Content Warnings */}
                    {novel.contentWarnings && novel.contentWarnings.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                            <span className="text-[8px] uppercase tracking-[0.4em] text-red-500/60 font-black italic mr-2">Warnings:</span>
                            {novel.contentWarnings.map((warning: string) => (
                                <span 
                                    key={warning}
                                    className="text-[9px] uppercase tracking-widest text-red-400/80 font-bold px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                >
                                    {warning}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight italic" style={{ color: 'var(--reader-text)' }}>
                        {chapter.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-widest opacity-60 font-black italic">
                        {novel.rating && (
                            <span className={`px-3 py-0.5 rounded-full border text-[9px] font-black italic tracking-widest ${
                                novel.rating === 'Explicit' || novel.rating === 'Mature' 
                                ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                                : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                            }`}>
                                {novel.rating}
                            </span>
                        )}
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

                    <button 
                        onClick={handleToggleBookmark} 
                        disabled={saving}
                        className={`glass-panel p-2.5 rounded-2xl transition-all ${saved ? 'text-[var(--reader-accent)] border-[var(--reader-accent)]/30 bg-[var(--reader-accent)]/5 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-50'}`}
                        title={saved ? "Remove from Library" : "Save to Library"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                    </button>
                    
                    <button 
                        onClick={() => setShowIndex(true)} 
                        className="glass-panel p-2.5 rounded-2xl transition-all text-zinc-500 hover:text-[var(--reader-accent)] hover:border-[var(--reader-accent)]/30 hover:bg-[var(--reader-accent)]/5"
                        title="Chapter Index"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="glass-panel p-2.5 rounded-2xl text-zinc-500 hover:text-red-400 transition-all hover:bg-red-500/5 hover:border-red-500/20"
                        title="Report Chapter"
                    >
                        <Flag size={18} />
                    </button>

                    <div className="flex-grow" />

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert("Link copied to clipboard.");
                        }}
                        className="glass-panel p-2.5 rounded-2xl hover:bg-white/5 transition-all text-zinc-500 hover:text-zinc-300 mr-4"
                        title="Copy link to this chapter"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 scale-x-[-1]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Zm0 12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                        </svg>
                    </button>

                    <div className="hidden md:flex items-center gap-6 italic">
                        {prevChapter && (
                            <Link 
                                href={`/chapter/${novelIdentifier}-${prevChapter.order}`} 
                                className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all"
                                title="Go to previous chapter"
                            >
                                Last Chapter
                            </Link>
                        )}
                        {nextChapter && (
                            <Link 
                                href={`/chapter/${novelIdentifier}-${nextChapter.order}`} 
                                className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all"
                                title="Go to next chapter"
                            >
                                Next Chapter
                            </Link>
                        )}
                    </div>
                </div>

                <div
                    className={`leading-relaxed select-text min-h-[50vh] relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}
                >
                    {isViralUnlock && !isLocked && (
                        <div className="mb-8 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                            <p className="text-[10px] uppercase font-black text-purple-400 tracking-widest italic animate-pulse">
                                Viral Grace Period Active — Thank you for spreading the word!
                            </p>
                        </div>
                    )}
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
                                    <h3 className="text-xl font-black uppercase tracking-widest text-white italic">This Chapter is Locked</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black max-w-sm mx-auto italic">
                                    The author has restricted this portion of the story. Support them to continue reading.
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
                                            {unlocking ? "Unlocking..." : `Unlock for ${unlockPrice} Inklets`}
                                        </button>
                                        
                                        <div className="pt-4 border-t border-white/5 space-y-4">
                                            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic">Or spread the word for a grace period</p>
                                            <button 
                                                onClick={handleShareToUnlock}
                                                className="w-full flex items-center justify-center gap-3 px-8 py-3 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all italic text-white/40 hover:text-white"
                                            >
                                                <Share2 size={14} className="text-purple-500" />
                                                Spread the Word
                                            </button>
                                        </div>
                                        
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
                        <>
                            {chapter.authorNoteBefore && (
                                <div className="mb-12 p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] italic text-sm text-[var(--reader-text-muted)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20" />
                                    <p className="text-[9px] uppercase tracking-[0.4em] font-black mb-4 text-purple-400/60 not-italic">Scribe's Prelude</p>
                                    {chapter.authorNoteBefore}
                                </div>
                            )}
                            <SystemNotation 
                            content={chapter.content} 
                            fontSize={fontSize} 
                            chapterId={chapterId}
                            novelId={novelId}
                        />
                            {chapter.authorNoteAfter && (
                                <div className="mt-12 p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] italic text-sm text-[var(--reader-text-muted)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20" />
                                    <p className="text-[9px] uppercase tracking-[0.4em] font-black mb-4 text-amber-400/60 not-italic">Scribe's Postscript</p>
                                    {chapter.authorNoteAfter}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <CommentSection
                    contentType="chapter"
                    contentId={chapterId}
                    novelId={novelId}
                    initialCommentCount={chapter.commentCount || 0}
                />

                {/* Author Shoutout / Cross-Promotion */}
                {novel.shoutoutId && (
                    <div className="mt-16 p-8 rounded-3xl border border-[var(--reader-border)] bg-gradient-to-br from-purple-900/10 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg>
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400 font-black italic">Similar Stories</p>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Shining a Spotlight</h3>
                            </div>

                            <Link href={`/novel/${novel.shoutoutId}`} className="flex gap-6 items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-purple-500/30">
                                <div className="w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={novel.shoutoutCover || "https://placehold.co/200x300/1a1a1a/666666?text=Novel"} 
                                        alt="Recommended Novel"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-white font-bold uppercase tracking-wide group-hover:text-purple-400 transition-colors">{novel.shoutoutTitle || "Next Great Read"}</h4>
                                    <p className="text-xs text-zinc-500 line-clamp-2">{novel.shoutoutDescription || "The author recommends this saga for fans of this chronicle."}</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Community & Support CTAs */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-purple-500/20 transition-all">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">The Circle</h4>
                            <p className="text-[9px] text-zinc-500 uppercase font-black italic">Resonate with other seekers on Discord</p>
                        </div>
                        <a href="https://discord.gg/vellum" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                            Join Discord
                        </a>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-pink-500/20 transition-all">
                        <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21l-8.228-9.96a5 5 0 1 1 7.228-6.96 5 5 0 1 1 7.228 6.96l-8.228 9.96z" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Support the Scribe</h4>
                            <p className="text-[9px] text-zinc-500 uppercase font-black italic">Offer Gilt to show your appreciation</p>
                        </div>
                        <TipButton creatorId={novel.authorId} creatorName={novel.authorName} />
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col items-center text-center space-y-4 hover:border-amber-500/20 transition-all">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-white italic">Rate the Chapter</h4>
                            <p className="text-[9px] text-zinc-500 uppercase font-black italic">Help others discover this chapter</p>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} className="text-zinc-600 hover:text-amber-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

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
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black italic">Last Chapter</p>
                                <p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase italic">{prevChapter.title}</p>
                            </Link>
                        ) : <div className="flex-1" />}

                        {nextChapter ? (
                            <Link
                                href={`/chapter/${novelIdentifier}-${nextChapter.order}`}
                                className="flex-1 group p-8 glass-panel border border-[var(--reader-border)] rounded-3xl transition-all space-y-3 text-right hover:border-[var(--reader-accent)]/30"
                                style={{ backgroundColor: 'var(--reader-footer-bg)' }}
                            >
                                <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black italic">Next Chapter</p>
                                <p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase italic">{nextChapter.title}</p>
                            </Link>
                        ) : (
                            <div className="flex-1 p-8 glass-panel border border-dashed border-purple-500/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-purple-500/5 animate-pulse-slow" style={{ backgroundColor: 'var(--reader-footer-bg)' }}>
                                <div className="space-y-1">
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-purple-400 font-black">End of Chapter</p>
                                    <p className="text-lg font-black uppercase text-white">Caught Up</p>
                                </div>
                                <p className="text-[10px] text-zinc-500 max-w-[200px] font-medium leading-tight">
                                    You've reached the end of the available chapters. Stay tuned for the next release!
                                </p>
                                <div className="flex gap-2">
                                    <Link href="/novel" className="px-4 py-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white">
                                        Browse Novels
                                    </Link>
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-2 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all">
                                        Back to Top
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center pt-16">
                        <Link href={`/novel/${novelIdentifier}`} className="text-[10px] uppercase tracking-[0.6em] font-black opacity-40 hover:opacity-100 hover:text-[var(--reader-accent)] transition-all italic" title="Back to the novel overview">
                            Return to Novel
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

            {/* Chapter Index Modal */}
            {showIndex && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-[var(--reader-bg)]/90 backdrop-blur-3xl" onClick={() => setShowIndex(false)} />
                    <div className="relative w-full max-w-5xl max-h-[80vh] overflow-hidden glass rounded-3xl border border-[var(--reader-border)] flex flex-col scale-in-center">
                        <header className="p-8 border-b border-[var(--reader-border)] flex items-center justify-between shadow-sm">
                            <div>
                                <h1 className="text-[10px] uppercase tracking-[0.5em] text-[var(--reader-text-subtle)] font-black italic">Project Vellum</h1>
                                <p className="text-xl font-black uppercase text-[var(--reader-text)] tracking-widest italic">{novel?.title}</p>
                            </div>
                            <button
                                onClick={() => setShowIndex(false)}
                                className="w-12 h-12 rounded-full glass flex items-center justify-center text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-all"
                            >
                                ✕
                            </button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allChapters.map((chap, index) => {
                                    const isCurrent = chap.id === chapterId;
                                    const isRead = chap.order <= maxChapterOrderRead && !isCurrent;
                                    
                                    return (
                                        <Link
                                            key={chap.id}
                                            href={`/chapter/${novelIdentifier}-${chap.order}`}
                                            className={`group p-6 glass-panel border rounded-2xl transition-all duration-500 flex items-center justify-between ${
                                                isCurrent 
                                                ? 'border-[var(--reader-accent)]/50 bg-[var(--reader-accent)]/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                                                : isRead
                                                    ? 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-100 hover:border-white/20'
                                                    : 'border-white/5 hover:border-[var(--reader-accent)]/40 hover:bg-white/[0.05]'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-[9px] uppercase tracking-widest font-black italic ${isCurrent ? 'text-[var(--reader-accent)]' : 'text-[var(--reader-text-subtle)] group-hover:text-[var(--reader-accent)] transition-colors'}`}>
                                                        Chapter {index + 1}
                                                    </p>
                                                    {isRead && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-zinc-500">
                                                            <title>Read</title>
                                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <h3 className={`text-sm font-black tracking-tight line-clamp-1 truncate uppercase italic ${isCurrent ? 'text-white' : 'text-[var(--reader-text-muted)] group-hover:text-[var(--reader-text)] transition-colors'}`}>
                                                    {chap.title}
                                                </h3>
                                            </div>
                                            {chap.isPremium && !isCurrent && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[var(--reader-accent)]/50">
                                                    <title>Premium Chapter</title>
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                contentType="chapter"
                contentId={chapterId}
                contentTitle={`${novel.title} - ${chapter.title}`}
                authorId={novel.authorId}
            />
        </main>
    );
}
