"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, setDoc, Timestamp, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { increment, updateDoc } from "firebase/firestore";
import LikeButton from "@/components/interactions/LikeButton";

export default function NovelLandingPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [novel, setNovel] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [readingProgress, setReadingProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showChapters, setShowChapters] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let unsubscribeNovel: () => void;

        const load = async () => {
            if (!id) return;
            try {
                // Real-time listener for novel data (engagement metrics)
                unsubscribeNovel = onSnapshot(doc(db, "novels", id), (docSnap) => {
                    if (docSnap.exists()) {
                        setNovel(docSnap.data());
                    } else {
                        // Handle not found only on initial load or if explicitly cached as null
                        // But onSnapshot might fire first with caching. 
                        // If it doesn't exist, we might want to redirect.
                        // For now, let's just handle local state update.
                    }
                }, (error) => {
                    console.error("Error listening to novel:", error);
                });

                // We still need an initial check or we can rely on onSnapshot.
                // But we need to load chapters and saved status too.

                // Let's do a static fetch for the robust initial load of ancillary data
                const docRef = doc(db, "novels", id);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    // setNovel(snap.data()); // Included in onSnapshot above

                    // Load chapters
                    const chaptersRef = collection(db, "novels", id, "chapters");
                    const q = query(
                        chaptersRef,
                        where("published", "==", true),
                        orderBy("order", "asc")
                    );
                    const chaptersSnap = await getDocs(q);
                    setChapters(chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                    if (user) {
                        const savedRef = doc(db, "users", user.uid, "savedNovels", id);
                        const savedSnap = await getDoc(savedRef);
                        setSaved(savedSnap.exists());

                        // Load Reading Progress
                        const progressRef = doc(db, "users", user.uid, "progress", id);
                        const progressSnap = await getDoc(progressRef);
                        if (progressSnap.exists()) {
                            setReadingProgress(progressSnap.data());
                        }
                    }
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Error loading novel:", error);
            } finally {
                setLoading(false);
            }
        };

        load();

        return () => {
            if (unsubscribeNovel) unsubscribeNovel();
        };
    }, [id, user]);

    useEffect(() => {
        // Increment View Count with basic deduplication
        const incrementView = async () => {
            if (!id) return;

            const storageKey = `viewed_novel_${id}`;
            const hasViewed = localStorage.getItem(storageKey);

            if (hasViewed) return;

            try {
                const novelRef = doc(db, "novels", id);
                await updateDoc(novelRef, {
                    views: increment(1)
                });
                localStorage.setItem(storageKey, "true");
            } catch (error) {
                console.error("Error incrementing view:", error);
            }
        };

        incrementView();
    }, [id]);

    const handleSaveToLibrary = async () => {
        if (!user) {
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            return;
        }

        if (!novel || !id) return;

        setSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid, "savedNovels", id), {
                title: novel.title || "Untitled",
                coverImage: novel.coverImage || "",
                authorName: novel.authorName || "Unknown Author",
                savedAt: Timestamp.now()
            }, { merge: true });
            setSaved(true);
        } catch (error) {
            console.error("Error saving novel:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 uppercase tracking-widest text-xs">
            Unrolling the scroll...
        </div>
    );

    if (!novel) return null;

    return (
        <main className="min-h-screen bg-[var(--background)] text-zinc-100 font-sans pb-40">
            {/* Header / Hero - Screenshot 2026-02-06 054856.png */}
            <div className="relative h-[90vh] overflow-hidden flex items-center justify-center">
                <img
                    src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
                    className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
                    alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/60 via-transparent to-transparent" />

                {/* Content Overlay */}
                <div className="relative z-10 max-w-4xl mx-auto px-8 text-center space-y-12">
                    {/* Top Badge Card (The little floating one in the screenshot) */}
                    <div className="inline-block glass-panel p-1 rounded-2xl mb-8 transform translate-y-[-20px]">
                        <div className="relative rounded-xl overflow-hidden group cursor-pointer">
                            <img
                                src={novel.coverImage}
                                className="w-64 h-24 object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-[12px] uppercase tracking-[0.3em] font-black text-white/80">{novel.authorName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-4 py-1.5 rounded-full glass text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-black">
                                {novel.genre}
                            </span>
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.3em] font-black italic ${novel.status === "Completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                                }`}>
                                {novel.status || "Ongoing"}
                            </span>
                        </div>
                        {/* Tags */}
                        {novel.tags && novel.tags.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                                {novel.tags.map((tag: string) => (
                                    <span key={tag} className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold px-2 py-0.5 rounded border border-white/5 bg-white/[0.02]">
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                    </span>
                                ))}
                            </div>
                        )}

                        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                            {novel.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-12 pt-8">
                        <Link href={`/authors/${novel.authorId}`} className="group space-y-2">
                            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-black">Chronicle By</p>
                            <p className="text-zinc-100 group-hover:text-purple-400 transition-colors uppercase font-black text-sm">{novel.authorName}</p>
                        </Link>

                        <div className="w-px h-12 bg-white/5" />

                        <div className="space-y-2">
                            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-black">Archive</p>
                            <p className="text-zinc-100 uppercase font-black text-sm">{chapters.length} Units</p>
                        </div>

                        <div className="w-px h-12 bg-white/5" />

                        <div className="space-y-2">
                            <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] font-black">Engagement</p>
                            <div className="flex items-center gap-6">
                                <LikeButton
                                    contentType="novel"
                                    contentId={id || ""}
                                    initialLikeCount={novel.likes || 0}
                                />
                                <div className="h-1 w-1 bg-zinc-700 rounded-full" />
                                <span className="text-zinc-100 uppercase font-black text-sm">{(novel.views || 0).toLocaleString()} Views</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-12">
                        <button
                            onClick={() => setShowChapters(true)}
                            className="px-12 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[13px] font-black uppercase tracking-[0.3em] premium-shadow hover:scale-105 active:scale-95 transition-all duration-500"
                        >
                            Open Chronicles
                        </button>
                        {readingProgress && (
                            <Link
                                href={`/novels/${id}/chapter/${readingProgress.currentChapterId}`}
                                className="px-12 py-5 rounded-2xl bg-white text-black text-[13px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                            >
                                Resume Archive
                            </Link>
                        )}
                        <button
                            onClick={handleSaveToLibrary}
                            disabled={saving}
                            className="px-12 py-5 rounded-2xl border border-white/10 glass-panel text-white text-[13px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            {saved ? "In Library" : saving ? "Saving..." : "Add to Library"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Synopsis Section */}
            <div className="max-w-4xl mx-auto px-8 pt-32 space-y-12">
                <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black">Synopsis</p>
                    <div className="h-px w-24 bg-purple-500/30" />
                </div>
                <p className="text-zinc-400 leading-relaxed text-lg font-light">
                    {novel.description || "The archives are currently being unrolled for this chronicle. Check back soon for the full synopsis."}
                </p>
            </div>

            {/* Expandable Chapters Overlay */}
            {showChapters && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setShowChapters(false)} />
                    <div className="relative w-full max-w-5xl max-h-[80vh] overflow-hidden glass rounded-3xl border border-white/5 flex flex-col scale-in-center">
                        <header className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h1 className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-black">Project Chronicles</h1>
                                <p className="text-xl font-black uppercase text-white tracking-widest">{novel.title}</p>
                            </div>
                            <button
                                onClick={() => setShowChapters(false)}
                                className="w-12 h-12 rounded-full glass flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                            >
                                ✕
                            </button>
                        </header>
                        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {chapters.map((chapter, index) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/novels/${id}/chapter/${chapter.id}`}
                                        className="group p-6 glass-panel border border-white/5 rounded-2xl hover:border-purple-500/40 hover:bg-white/[0.05] transition-all duration-500"
                                    >
                                        <div className="space-y-2">
                                            <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-black group-hover:text-purple-400 transition-colors">Unit {index + 1}</p>
                                            <h3 className="text-zinc-200 text-sm font-black group-hover:text-white transition-colors tracking-tight line-clamp-1 truncate uppercase">{chapter.title}</h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

