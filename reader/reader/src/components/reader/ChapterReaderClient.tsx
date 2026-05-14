"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, onSnapshot, DocumentData } from "firebase/firestore";
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
import { applyWatermark } from "@/lib/security/watermark";
import { useMemo } from "react";

const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3000/api");

interface ChapterReaderClientProps {
    combined: string;
    initialNovel?: DocumentData;
    initialChapter?: DocumentData;
    initialNovelId?: string;
    initialChapterId?: string;
}

export default function ChapterReaderClient({ 
    combined, 
    initialNovel, 
    initialChapter, 
    initialNovelId, 
    initialChapterId 
}: ChapterReaderClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    
    const [novel, setNovel] = useState<DocumentData | null>(initialNovel || null);
    const [novelId, setNovelId] = useState<string | null>(initialNovelId || null);
    const [chapter, setChapter] = useState<DocumentData | null>(initialChapter || null);
    const [chapterId, setChapterId] = useState<string | null>(initialChapterId || null);
    const [allChapters, setAllChapters] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(!initialChapter);

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
        return () => window.removeOH(window.removeEventListener("scroll", handleScroll));
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
            
            // If we have initial data, we skip the main fetch but still need secondary data
            if (initialNovel && initialChapter && initialNovelId && initialChapterId) {
                const chaptersRef = collection(db, "novels", initialNovelId, "chapters");
                const allChapQuery = query(chaptersRef, where("published", "==", true), orderBy("order", "asc"));
                const allChapSnap = await getDocs(allChapQuery);
                const chaptersList = allChapSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setAllChapters(chaptersList);
                
                // Set up snapshot for live updates
                const targetChapRef = doc(db, "novels", initialNovelId, "chapters", initialChapterId);
                onSnapshot(targetChapRef, (d) => {
                    if (d.exists()) setChapter(d.data());
                });

                // Progress Tracking
                if (user) {
                   await progressTracking.saveProgress(user.uid, initialNovelId, initialNovel.title, initialNovel.coverImage, initialNovel.authorName, initialChapterId, initialChapter.title || `Unit ${chapterOrder}`, chapterOrder, allChapSnap.size);
                   const savedRef = doc(db, "users", user.uid, "savedNovels", initialNovelId);
                   const savedSnap = await getDoc(savedRef);
                   setSaved(savedSnap.exists());
                   const progressRef = doc(db, "users", user.uid, "progress", initialNovelId);
                   const progressSnap = await getDoc(progressRef);
                   if (progressSnap.exists()) setMaxChapterOrderRead(Math.max(progressSnap.data().chapterOrder, chapterOrder));
                   else setMaxChapterOrderRead(chapterOrder);
                } else {
                   setMaxChapterOrderRead(chapterOrder);
                }

                // Check Lock Status
                if (initialChapter.isPremium) {
                    if (user) {
                        if (user.uid === initialNovel.authorId) setIsLocked(false);
                        else {
                            const unlockRef = doc(db, "users", user.uid, "unlockedChapters", initialChapterId);
                            const unlockSnap = await getDoc(unlockRef);
                            if (unlockSnap.exists()) setIsLocked(false);
                            else {
                                const status = await getChapterStatus(user.uid, initialNovelId, initialChapterId);
                                setIsLocked(status.locked);
                                setUnlockPrice(status.price || initialChapter.price || 10);
                            }
                        }
                    } else {
                        setIsLocked(true);
                        setUnlockPrice(initialChapter.price || 10);
                    }
                }

                setLoading(false);
                return;
            }

            // Full fallback load (same as original logic)
            try {
                let docId = novelIdentifier;
                let novelRef = doc(db, "novels", docId);
                let novelSnap = await getDoc(novelRef);

                if (!novelSnap.exists()) {
                    const qSlug = query(collection(db, "novels"), where("slug", "==", novelIdentifier), where("published", "==", true));
                    const qSlugSnap = await getDocs(qSlug);
                    if (!qSlugSnap.empty) {
                        novelSnap = qSlugSnap.docs[0];
                        docId = novelSnap.id;
                    }
                }

                if (novelSnap.exists()) {
                    setNovelId(docId);
                    const nData = novelSnap.data();
                    setNovel(nData);

                    const chaptersRef = collection(db, "novels", docId, "chapters");
                    const chapQuery = query(chaptersRef, where("order", "==", chapterOrder), where("published", "==", true));
                    const chapSnap = await getDocs(chapQuery);

                    if (!chapSnap.empty) {
                        const targetChap = chapSnap.docs[0];
                        const cId = targetChap.id;
                        const cData = targetChap.data();
                        setChapterId(cId);
                        setChapter(cData);

                        onSnapshot(targetChap.ref, (d) => {
                            if (d.exists()) setChapter(d.data());
                        });

                        const allChapQuery = query(chaptersRef, where("published", "==", true), orderBy("order", "asc"));
                        const allChapSnap = await getDocs(allChapQuery);
                        setAllChapters(allChapSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                        if (user) {
                            await progressTracking.saveProgress(user.uid, docId, nData?.title, nData?.coverImage, nData?.authorName, cId, cData?.title || `Unit ${chapterOrder}`, chapterOrder, allChapSnap.size);
                            const savedRef = doc(db, "users", user.uid, "savedNovels", docId);
                            const savedSnap = await getDoc(savedRef);
                            setSaved(savedSnap.exists());
                            const progressRef = doc(db, "users", user.uid, "progress", docId);
                            const progressSnap = await getDoc(progressRef);
                            if (progressSnap.exists()) setMaxChapterOrderRead(Math.max(progressSnap.data().chapterOrder, chapterOrder));
                            else setMaxChapterOrderRead(chapterOrder);
                        } else {
                            setMaxChapterOrderRead(chapterOrder);
                        }

                        if (cData?.isPremium) {
                            if (user) {
                                if (user.uid === nData?.authorId) setIsLocked(false);
                                else {
                                    const unlockRef = doc(db, "users", user.uid, "unlockedChapters", cId);
                                    const unlockSnap = await getDoc(unlockRef);
                                    if (unlockSnap.exists()) setIsLocked(false);
                                    else {
                                        const status = await getChapterStatus(user.uid, docId, cId);
                                        setIsLocked(status.locked);
                                        setUnlockPrice(status.price || cData?.price || 10);
                                    }
                                }
                            } else {
                                setIsLocked(true);
                                setUnlockPrice(cData?.price || 10);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading chapter:", err);
            } finally {
                setLoading(false);
            }
        };

        load();

        // Check for session-based viral unlock
        if (chapterId) {
            const viralKey = `viral_unlock_chapter_${chapterId}`;
            if (localStorage.getItem(viralKey)) {
                setIsLocked(false);
                setIsViralUnlock(true);
            }
        }
    }, [combined, user, novelIdentifier, chapterOrder, chapterId, initialChapter, initialNovel, initialNovelId, initialChapterId]);

    const protectedContent = useMemo(() => {
        if (!chapter?.content) return "";
        return applyWatermark(chapter.content, user?.uid || "GUEST");
    }, [chapter?.content, user?.uid]);

    const handleShareToUnlock = () => {
        const referralId = (user as any)?.referralId || "VELLUM";
        const shareUrl = `${window.location.origin}/novel/${novel?.slug || novelIdentifier}?ref=${referralId}`;
        const shareText = `I'm reading "${novel?.title}" on Vellum! It's incredible. Use my archival link to get 50 bonus Inklets: ${shareUrl}`;
        
        if (navigator.share) {
            navigator.share({ title: novel?.title, text: shareText, url: shareUrl }).catch(err => console.log("Share failed:", err));
        } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
        }

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
            if (saved) { await progressTracking.unsaveNovel(user.uid, novelId); setSaved(false); }
            else { await progressTracking.saveNovel(user.uid, novelId, novel.title || "Untitled", novel.coverImage || "", novel.authorName || "Unknown Author", novel.authorId || novel.creatorId, novel.numericalId, novel.slug); setSaved(true); }
        } catch (error) { console.error("Error toggling bookmark:", error); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-[0.8em] text-[10px] font-black">
            Accessing Chapter...
        </div>
    );

    if (!chapter || !novel || !novelId || !chapterId) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-[0.8em] text-[10px] font-black">
            Chapter Not Found
        </div>
    );

    const currentIndex = allChapters.findIndex(c => c.id === chapterId);
    const prevChapter = allChapters[currentIndex - 1];
    const nextChapter = allChapters[currentIndex + 1];

    return (
        <main className={`min-h-screen pb-40 transition-all duration-500 ease-in-out font-sans relative ${isSidebarOpen ? 'pl-0 lg:pl-80' : 'pl-0'}`}>
            {/* Sidebar ToC */}
            <aside className={`fixed top-0 left-0 z-[200] h-full w-80 bg-[var(--reader-bg)] border-r border-[var(--reader-border)] transition-transform duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto custom-scrollbar`}>
                <div className="sticky top-0 z-20 bg-[var(--reader-bg)]/80 backdrop-blur-xl border-b border-[var(--reader-border)] p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Table of Contents</p>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors lg:hidden"><X size={18} /></button>
                    </div>
                    <h2 className="text-lg font-black uppercase text-[var(--reader-text)] tracking-tight italic line-clamp-1">{novel.title}</h2>
                </div>
                <div className="p-4 space-y-2">
                    {allChapters.map((chap, index) => (
                        <Link key={chap.id} href={`/chapter/${novelIdentifier}-${chap.order}`} onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                            className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${chap.id === chapterId ? 'border-[var(--reader-accent)]/50 bg-[var(--reader-accent)]/10 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'border-transparent hover:bg-white/[0.03] text-zinc-500 hover:text-zinc-300'}`}>
                            <div className="flex items-center gap-4 min-w-0">
                                <span className={`text-[10px] font-black tabular-nums ${chap.id === chapterId ? 'text-[var(--reader-accent)]' : 'opacity-20'}`}>{(index + 1).toString().padStart(2, '0')}</span>
                                <span className={`text-xs font-bold truncate uppercase italic ${chap.id === chapterId ? 'text-white' : ''}`}>{chap.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {chap.order <= maxChapterOrderRead && chap.id !== chapterId && <div className="w-1 h-1 rounded-full bg-zinc-700" />}
                                {chap.isPremium && <Coins size={12} className={chap.id === chapterId ? 'text-[var(--reader-accent)]' : 'opacity-20'} />}
                            </div>
                        </Link>
                    ))}
                    <div className="pt-8 mt-8 border-t border-[var(--reader-border)]"><ManagedAd zone="SIDEBAR_FOOTER" /></div>
                </div>
            </aside>

            {/* Floating Sidebar Toggle */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`fixed bottom-8 left-8 z-[210] w-14 h-14 rounded-full bg-white text-black shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90`}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="fixed top-0 left-0 w-full h-1 z-[150] pointer-events-none">
                <div className="h-full bg-[var(--reader-accent)] transition-all duration-150 ease-out shadow-[0_0_10px_var(--reader-accent)]" style={{ width: `${progress}%` }} />
            </div>

            <ReadingSettings currentFontSize={fontSize} currentFontFamily={fontFamily} onFontSizeChange={setFontSize} onFontFamilyChange={setFontFamily} />

            <div className="max-w-3xl mx-auto px-6 pt-8"><ManagedAd zone="READER_TOP" /></div>

            <div className="relative h-[50vh] w-full overflow-hidden flex items-end">
                <img src={novel.coverImage || ""} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] scale-105" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent" />
                <div className="relative z-10 max-w-3xl mx-auto px-6 pb-12 w-full text-center space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black italic text-[var(--reader-accent)]">Chapter {chapterOrder}</p>
                    {novel.contentWarnings?.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                            <span className="text-[8px] uppercase tracking-[0.4em] text-red-500/60 font-black italic mr-2">Warnings:</span>
                            {novel.contentWarnings.map((warning: string) => <span key={warning} className="text-[9px] uppercase tracking-widest text-red-400/80 font-bold px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]">{warning}</span>)}
                        </div>
                    )}
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight italic text-[var(--reader-text)]">{chapter.title}</h1>
                    <div className="flex items-center justify-center gap-4 text-[11px] uppercase tracking-widest opacity-60 font-black italic">
                        {novel.rating && <span className={`px-3 py-0.5 rounded-full border text-[9px] font-black italic tracking-widest ${novel.rating === 'Explicit' || novel.rating === 'Mature' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'}`}>{novel.rating}</span>}
                        <span>{novel.title}</span><div className="h-1 w-1 bg-zinc-600 rounded-full" />
                        <Link href={`/authors/${novel.authorId}`} className="hover:text-[var(--reader-accent)] transition-colors">{novel.authorName}</Link>
                    </div>
                </div>
            </div>

            <article className="max-w-3xl mx-auto px-6 md:px-12">
                <div className="flex items-center gap-4 py-8 border-b border-t mb-16 transition-colors border-[var(--reader-border)]">
                    <LikeButton contentType="chapter" contentId={chapterId} novelId={novelId} initialLikeCount={chapter.likes || 0} />
                    <TipButton creatorId={novel.authorId} creatorName={novel.authorName} />
                    <button onClick={handleToggleBookmark} disabled={saving} className={`glass-panel p-2.5 rounded-2xl transition-all ${saved ? 'text-[var(--reader-accent)] border-[var(--reader-accent)]/30 bg-[var(--reader-accent)]/5 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-50'}`}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /></button>
                    <button onClick={() => setShowIndex(true)} className="glass-panel p-2.5 rounded-2xl transition-all text-zinc-500 hover:text-[var(--reader-accent)] hover:border-[var(--reader-accent)]/30 hover:bg-[var(--reader-accent)]/5"><Menu size={18} /></button>
                    <button onClick={() => setIsReportModalOpen(true)} className="glass-panel p-2.5 rounded-2xl text-zinc-500 hover:text-red-400 transition-all hover:bg-red-500/5 hover:border-red-500/20"><Flag size={18} /></button>
                    <div className="flex-grow" />
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied."); }} className="glass-panel p-2.5 rounded-2xl hover:bg-white/5 transition-all text-zinc-500 hover:text-zinc-300 mr-4"><Share2 size={18} /></button>
                </div>

                <div className={`leading-relaxed select-text min-h-[50vh] relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`} style={{ fontSize: `${fontSize}px`, lineHeight: '1.9' }}>
                    {isViralUnlock && !isLocked && <div className="mb-8 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center"><p className="text-[10px] uppercase font-black text-purple-400 tracking-widest italic animate-pulse">Viral Grace Period Active</p></div>}
                    {isLocked ? (
                        <div className="relative py-20 px-6 rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                            <div className="relative z-10 space-y-6">
                                <div className="flex justify-center"><div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse text-[var(--reader-accent)]"><Coins size={24} /></div></div>
                                <div className="space-y-2"><h3 className="text-xl font-black uppercase tracking-widest text-white italic">This Chapter is Locked</h3></div>
                                {user ? (
                                    <div className="space-y-4">
                                        <button onClick={async () => { setUnlocking(true); const success = await unlockChapter(user.uid, novelId, chapterId); if (success) setIsLocked(false); else alert("Check your balance."); setUnlocking(false); }}
                                            disabled={unlocking} className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--reader-accent)] hover:text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50">
                                            {unlocking ? "Unlocking..." : `Unlock for ${unlockPrice} Inklets`}
                                        </button>
                                        <div className="pt-4 border-t border-white/5 space-y-4">
                                            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest italic">Or spread the word for a grace period</p>
                                            <button onClick={handleShareToUnlock} className="w-full flex items-center justify-center gap-3 px-8 py-3 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all italic text-white/40 hover:text-white"><Share2 size={14} className="text-purple-500" />Spread the Word</button>
                                        </div>
                                    </div>
                                ) : <Link href={`/login?returnUrl=/chapter/${combined}`} className="inline-block bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all">Login to Unlock</Link>}
                            </div>
                        </div>
                    ) : (
                        <>
                            {chapter.authorNoteBefore && <div className="mb-12 p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] italic text-sm text-[var(--reader-text-muted)]"><p className="text-[9px] uppercase tracking-[0.4em] font-black mb-4 text-purple-400/60 not-italic">Scribe's Prelude</p>{chapter.authorNoteBefore}</div>}
                            <SystemNotation content={protectedContent} fontSize={fontSize} chapterId={chapterId} novelId={novelId} />
                            {chapter.authorNoteAfter && <div className="mt-12 p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] italic text-sm text-[var(--reader-text-muted)]"><p className="text-[9px] uppercase tracking-[0.4em] font-black mb-4 text-amber-400/60 not-italic">Scribe's Postscript</p>{chapter.authorNoteAfter}</div>}
                        </>
                    )}
                </div>

                <CommentSection contentType="chapter" contentId={chapterId} novelId={novelId} initialCommentCount={chapter.commentCount || 0} />

                {novel.shoutoutId && (
                    <div className="mt-16 p-8 rounded-3xl border border-[var(--reader-border)] bg-gradient-to-br from-purple-900/10 to-transparent relative overflow-hidden group">
                        <Link href={`/novel/${novel.shoutoutId}`} className="flex gap-6 items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-purple-500/30">
                            <div className="w-16 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0"><img src={novel.shoutoutCover || ""} alt="" className="w-full h-full object-cover" /></div>
                            <div className="space-y-1"><h4 className="text-white font-bold uppercase tracking-wide group-hover:text-purple-400 transition-colors">{novel.shoutoutTitle}</h4><p className="text-xs text-zinc-500 line-clamp-2">{novel.shoutoutDescription}</p></div>
                        </Link>
                    </div>
                )}

                <ManagedAd zone="READER_AFTER_CHAPTER" />

                <footer className="pt-32 space-y-16">
                    <div className="h-px w-full bg-[var(--reader-border)]" />
                    <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
                        {prevChapter ? <Link href={`/chapter/${novelIdentifier}-${prevChapter.order}`} className="flex-1 group p-8 glass-panel border border-[var(--reader-border)] rounded-3xl transition-all space-y-3 hover:border-[var(--reader-accent)]/30"><p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black italic">Last Chapter</p><p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase italic">{prevChapter.title}</p></Link> : <div className="flex-1" />}
                        {nextChapter ? <Link href={`/chapter/${novelIdentifier}-${nextChapter.order}`} className="flex-1 group p-8 glass-panel border border-[var(--reader-border)] rounded-3xl transition-all space-y-3 text-right hover:border-[var(--reader-accent)]/30"><p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-black italic">Next Chapter</p><p className="text-lg font-black group-hover:text-[var(--reader-accent)] transition-colors uppercase italic">{nextChapter.title}</p></Link> : <div className="flex-1 p-8 glass-panel border border-dashed border-purple-500/30 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-purple-500/5 animate-pulse-slow"><p className="text-[9px] uppercase tracking-[0.4em] text-purple-400 font-black">End of Chapter</p><p className="text-lg font-black uppercase text-white">Caught Up</p></div>}
                    </div>
                </footer>
            </article>

            {/* Chapter Index Modal */}
            {showIndex && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-[var(--reader-bg)]/90 backdrop-blur-3xl" onClick={() => setShowIndex(false)} />
                    <div className="relative w-full max-w-5xl max-h-[80vh] overflow-hidden glass rounded-3xl border border-[var(--reader-border)] flex flex-col">
                        <header className="p-8 border-b border-[var(--reader-border)] flex items-center justify-between shadow-sm">
                            <div><h1 className="text-[10px] uppercase tracking-[0.5em] text-[var(--reader-text-subtle)] font-black italic">Project Vellum</h1><p className="text-xl font-black uppercase text-[var(--reader-text)] tracking-widest italic">{novel?.title}</p></div>
                            <button onClick={() => setShowIndex(false)} className="w-12 h-12 rounded-full glass flex items-center justify-center text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-all">✕</button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allChapters.map((chap, index) => (
                                    <Link key={chap.id} href={`/chapter/${novelIdentifier}-${chap.order}`} className={`group p-6 glass-panel border rounded-2xl transition-all duration-500 flex items-center justify-between ${chap.id === chapterId ? 'border-[var(--reader-accent)]/50 bg-[var(--reader-accent)]/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/5 hover:border-[var(--reader-accent)]/40 hover:bg-white/[0.05]'}`}>
                                        <div className="space-y-2">
                                            <p className={`text-[9px] uppercase tracking-widest font-black italic ${chap.id === chapterId ? 'text-[var(--reader-accent)]' : 'text-[var(--reader-text-subtle)] group-hover:text-[var(--reader-accent)] transition-colors'}`}>Chapter {(index + 1).toString().padStart(2, '0')}</p>
                                            <p className="text-sm font-black uppercase tracking-tight italic group-hover:text-white transition-colors">{chap.title}</p>
                                        </div>
                                        {chap.isPremium && <Coins size={14} className={chap.id === chapterId ? 'text-[var(--reader-accent)]' : 'opacity-20'} />}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} contentId={chapterId} contentType="chapter" novelId={novelId} />
        </main>
    );
}
