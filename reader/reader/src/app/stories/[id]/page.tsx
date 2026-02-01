"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notFound, useParams } from "next/navigation";
import ReadingSettings from "@/components/reader/ReadingSettings";

export default function StoryPage() {
    const { id } = useParams<{ id: string }>();
    const [story, setStory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Theme Engine State
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
            if (!id) return;
            try {
                const ref = doc(db, "stories", id);
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().published) {
                    setStory(snap.data());
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
        <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 uppercase tracking-widest text-xs">
            Unrolling the scroll...
        </div>
    );

    if (!story) return notFound();

    return (
        <main
            className="min-h-screen px-6 py-24 transition-colors duration-500 ease-in-out font-serif"
            style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-text)' }}
        >
            <ReadingSettings
                currentTheme={theme}
                currentFontSize={fontSize}
                onThemeChange={setTheme}
                onFontSizeChange={setFontSize}
            />

            <article className="max-w-2xl mx-auto space-y-12">
                <header className="space-y-4 border-b pb-12 transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
                    <p className="text-[10px] uppercase tracking-[0.6em] font-bold" style={{ color: 'var(--reader-accent)' }}>
                        {story.genre || "Short Story"}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-light tracking-wide italic" style={{ color: 'var(--reader-text)' }}>
                        {story.title}
                    </h1>

                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest opacity-60">
                        <p>by <span className="font-bold">{story.authorName ?? "Unknown Author"}</span></p>
                        <p>{story.category === 'non-fiction' ? 'Non-Fiction' : 'Fiction'}</p>
                    </div>
                </header>

                <div
                    className="leading-relaxed whitespace-pre-wrap select-text space-y-6"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {story.content.split("\n").map((line: string, i: number) => (
                        <p key={i} className={line.trim() === "" ? "h-4" : ""}>{line}</p>
                    ))}
                </div>

                <footer className="pt-24 pb-32 text-center">
                    <div className="h-px w-12 bg-[var(--reader-accent)] mx-auto mb-8 opacity-30" />
                    <p className="text-[10px] uppercase tracking-[0.6em] opacity-40 italic">End of the Chronicle</p>
                </footer>
            </article>
        </main>
    );
}
