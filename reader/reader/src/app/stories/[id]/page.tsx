"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound, useParams } from "next/navigation";
import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";
import LikeButton from "@/components/interactions/LikeButton";
import CommentSection from "@/components/interactions/CommentSection";
import { useTheme } from "@/contexts/ThemeContext";
import { getStoryStatus, unlockStory } from "@/lib/monetization/coinService";
import { useAuth } from "@/contexts/AuthContext";

import { DocumentData } from "firebase/firestore";

export default function StoryPage() {
    const { id } = useParams<{ id: string }>();
    const [story, setStory] = useState<DocumentData | null>(null);
    const [storyId, setStoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [unlockPrice, setUnlockPrice] = useState(0);
    const [unlocking, setUnlocking] = useState(false);
    const { user } = useAuth();

    // Theme Engine State (Global + Readers specific)
    const { theme, setTheme } = useTheme();
    const [fontSize, setFontSize] = useState(18);
    const [fontFamily, setFontFamily] = useState("sans");

    // Scroll Progress State
    const [progress, setProgress] = useState(0);

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
        localStorage.setItem("reader-font-size", fontSize.toString());
    }, [fontSize]);

    useEffect(() => {
        localStorage.setItem("reader-font-family", fontFamily);
    }, [fontFamily]);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                // 1. Try to find by ID first (Firestore ID)
                let docId = id;
                let docRef = doc(db, "stories", docId);
                let snap = await getDoc(docRef);

                // 2. If not found by ID, try collection queries (alphanumericId or slug)
                if (!snap.exists()) {
                    // Check if it's an alphanumeric ID (e.g., A1, B2)
                    const isAlphaNumeric = /^[A-Z][0-9]+$/i.test(id);
                    
                    if (isAlphaNumeric) {
                        const qAlpha = query(
                            collection(db, "stories"), 
                            where("alphanumericId", "==", id.toUpperCase()), 
                            where("published", "==", true)
                        );
                        const qSnap = await getDocs(qAlpha);
                        if (!qSnap.empty) {
                            snap = qSnap.docs[0];
                        }
                    }

                    // If still not found, try slug
                    if (!snap.exists()) {
                        const qSlug = query(
                            collection(db, "stories"), 
                            where("slug", "==", id), 
                            where("published", "==", true)
                        );
                        const qSnap = await getDocs(qSlug);
                        if (!qSnap.empty) {
                            snap = qSnap.docs[0];
                        }
                    }
                }

                if (snap.exists() && snap.data().published) {
                    const data = snap.data();
                    setStoryId(snap.id);
                    setStory(data);

                    // Check Lock Status
                    if (data.isPremium) {
                        if (user) {
                            // 1. Author Bypass
                            if (user.uid === data.authorId || user.uid === data.creatorId) {
                                setIsLocked(false);
                            } else {
                                // 2. Check for explicit unlock record in Firestore (client-side)
                                const unlockRef = doc(db, "users", user.uid, "unlockedStories", snap.id);
                                const unlockSnap = await getDoc(unlockRef);

                                if (unlockSnap.exists()) {
                                    setIsLocked(false);
                                } else {
                                    // 3. Backend status check (as fallback/primary for centralized logic)
                                    const status = await getStoryStatus(user.uid, snap.id);
                                    setIsLocked(status.locked);
                                    setUnlockPrice(status.price || data.price || 10);
                                }
                            }
                        } else {
                            setIsLocked(true);
                            setUnlockPrice(data.price || 10);
                        }
                    } else {
                        setIsLocked(false);
                    }
                }
            } catch (err) {
                console.error("Error loading story:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-[0.8em] text-[10px]">
            Unveiling the scroll...
        </div>
    );

    if (!story) return notFound();

    return (
        <main
            className="min-h-screen px-6 py-24 transition-colors duration-500 ease-in-out font-sans relative"
        >
            {/* Reading Progress Line */}
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

            <article className={`relative max-w-4xl mx-auto rounded-3xl overflow-hidden transition-all duration-700 ${theme === 'void' || theme === 'nebula' ? 'reader-container-glow border border-white/5' : ''} bg-[var(--reader-bg)]`}>
                {/* Immersive Header Image */}
                <div className="relative h-[400px] w-full overflow-hidden">
                    <img
                        src={story.coverImage || story.imageUrl || "https://placehold.co/1200x800/1a1a1a/666666?text=Vellum"}
                        className="w-full h-full object-cover opacity-30 blur-[2px] scale-105"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/40 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-12 md:p-16 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <p className="text-[11px] uppercase tracking-[0.4em] font-bold" style={{ color: 'var(--reader-accent)' }}>
                                    {story.genre || "Short Story"}
                                </p>
                                <div className="h-1 w-1 bg-zinc-600 rounded-full" />
                                <span className="text-[10px] uppercase tracking-widest font-black opacity-40">
                                    {(story.views || 0).toLocaleString()} Views
                                </span>
                            </div>
                            <div className="glass px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold opacity-60">
                                {story.category === 'non-fiction' ? 'Chronicle' : 'Fable'}
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight" style={{ color: 'var(--reader-text)' }}>
                            {story.title}
                        </h1>

                        <div className="flex items-center gap-2 text-[12px] uppercase tracking-widest opacity-80 font-bold">
                            <span className="opacity-40">by</span>
                            <Link
                                href={`/authors/${story.authorId || 'unknown'}`}
                                className="text-[var(--reader-text)] hover:text-[var(--reader-accent)] hover:underline decoration-[var(--reader-accent)]/30 underline-offset-8 transition-all"
                            >
                                {story.authorName ?? "Unknown Author"}
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="px-12 md:px-16 pb-16">
                    {/* Interaction Bar (Moescape style) */}
                    <div className="flex items-center gap-4 py-8 border-b border-t transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
                        <LikeButton
                            contentType="story"
                            contentId={storyId || ""}
                            initialLikeCount={story.likes || 0}
                        />

                        <div className="flex-grow" />

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Link copied to archives.");
                            }}
                            className="glass-panel p-2.5 rounded-2xl hover:bg-white/5 transition-all text-zinc-500 hover:text-zinc-300"
                            title="Share Link"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 scale-x-[-1]">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Zm0 12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                            </svg>
                        </button>
                    </div>

                    <div
                        className={`leading-relaxed select-text pt-16 relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                    >
                        {isLocked ? (
                            <div className="relative py-20 px-6 rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-accent)]">
                                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase tracking-widest text-white">This Chronicle is Locked</h3>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold max-w-sm mx-auto">
                                            The archivists have restricted access. Support the chronicler to reveal the ink.
                                        </p>
                                    </div>
                                    {user ? (
                                        <div className="space-y-4">
                                            <button
                                                onClick={async () => {
                                                    setUnlocking(true);
                                                    const success = await unlockStory(user.uid, storyId!);
                                                    if (success) setIsLocked(false);
                                                    else alert("Unlock failed. Check your Inklet balance.");
                                                    setUnlocking(false);
                                                }}
                                                disabled={unlocking}
                                                className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--reader-accent)] hover:text-white transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                            >
                                                {unlocking ? "Decoding Scroll..." : `Unlock for ${unlockPrice} Inklets`}
                                            </button>
                                        </div>
                                    ) : (
                                        <Link href={`/login?returnUrl=/stories/${id}`} className="inline-block bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all font-bold">
                                            Login to Unlock
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <SystemNotation content={story.content} fontSize={fontSize} />
                        )}
                    </div>

                    <CommentSection
                        contentType="story"
                        contentId={storyId || ""}
                        initialCommentCount={story.commentCount || 0}
                    />

                    <footer className="pt-24 text-center">
                        <div className="h-px w-16 bg-[var(--reader-accent)] mx-auto mb-10 opacity-30" />
                        <p className="text-[11px] uppercase tracking-[0.8em] opacity-40 font-bold">ARCHIVE TERMINATED</p>
                    </footer>
                </div>
            </article>
        </main>
    );
}
