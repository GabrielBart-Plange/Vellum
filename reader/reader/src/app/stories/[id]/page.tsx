"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound, useParams } from "next/navigation";
import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";

export default function StoryPage() {
    const { id } = useParams<{ id: string }>();
    const [story, setStory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Interaction State
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // Theme Engine State
    const [theme, setTheme] = useState("void");
    const [fontSize, setFontSize] = useState(18);

    // Scroll Progress State
    const [progress, setProgress] = useState(0);

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
            if (!id) return;
            try {
                const ref = doc(db, "stories", id);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().published) {
                    const data = snap.data();
                    setStory(data);
                    setLikeCount(data.likes || 0);
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
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 uppercase tracking-[0.8em] text-[10px]">
            Unveiling the scroll...
        </div>
    );

    if (!story) return notFound();

    return (
        <main
            className="min-h-screen px-6 py-24 transition-colors duration-500 ease-in-out font-sans relative"
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

            <article className={`relative max-w-4xl mx-auto rounded-3xl overflow-hidden transition-all duration-700 ${theme === 'void' || theme === 'nebula' ? 'reader-container-glow border border-white/5' : ''} bg-[var(--reader-bg)]`}>
                {/* Immersive Header Image */}
                <div className="relative h-[400px] w-full overflow-hidden">
                    <img
                        src={story.coverImage || story.imageUrl || "https://placehold.co/1200x800/1a1a1a/666666?text=15+Chronicles"}
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
                    {/* Interaction Bar (Moescape style) - Screenshot 2026-02-06 054541.png */}
                    <div className="flex items-center gap-4 py-8 border-b border-t transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
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
                            <span className="text-xs font-bold text-zinc-400">{story.commentCount || 0}</span>
                        </div>

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

                    <div className="leading-relaxed select-text pt-16" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                        <SystemNotation content={story.content} fontSize={fontSize} />
                    </div>

                    <footer className="pt-24 text-center">
                        <div className="h-px w-16 bg-[var(--reader-accent)] mx-auto mb-10 opacity-30" />
                        <p className="text-[11px] uppercase tracking-[0.8em] opacity-40 font-bold">ARCHIVE TERMINATED</p>
                    </footer>
                </div>
            </article>

        </main>
    );
}
