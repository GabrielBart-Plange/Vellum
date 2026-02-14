"use client";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp, collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ImageUpload from "@/components/creator/ImageUpload";
import Link from "next/link";

export default function DraftEditorPage() {
    const GENRE_OPTIONS = {
        fiction: ["Fantasy", "Sci-Fi", "Mystery", "Horror", "Thriller", "Romance", "Adventure", "Historical Fiction", "Comedy", "Literary Fiction"],
        "non-fiction": ["Biography", "Memoir", "Self-Help", "Essay", "Travel", "History", "Science", "Philosophy", "Guide", "Commentary"]
    };

    const params = useParams();
    const id = params?.id as string;
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState<keyof typeof GENRE_OPTIONS>("fiction");
    const [genre, setGenre] = useState("Fantasy");
    const [isCustomGenre, setIsCustomGenre] = useState(false);
    const [coverImage, setCoverImage] = useState("");
    const [type, setType] = useState<"short" | "novel">("short");
    const [chapters, setChapters] = useState<{ id: string, title: string, content: string }[]>([]);
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const hasSystemTag = tags.some(t => t.toLowerCase() === "@system");

    // Unified data loading effect
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) return;

            try {
                console.log("Loading draft or published work for ID:", id);
                const draftRef = doc(db, "users", user.uid, "drafts", id);
                const draftSnap = await getDoc(draftRef);

                let currentData = null;

                if (draftSnap.exists()) {
                    currentData = draftSnap.data();
                } else {
                    const novelSnap = await getDoc(doc(db, "novels", id));
                    if (novelSnap.exists()) currentData = novelSnap.data();
                    else {
                        const storySnap = await getDoc(doc(db, "stories", id));
                        if (storySnap.exists()) currentData = storySnap.data();
                    }
                }

                if (currentData) {
                    setTitle(currentData.title || "");

                    // Handle legacy and new genre structure
                    const loadedCategory = (currentData.category as keyof typeof GENRE_OPTIONS) || "fiction";
                    setCategory(loadedCategory);

                    const loadedGenre = currentData.genre || "Fantasy";
                    setGenre(loadedGenre);

                    // If the loaded genre isn't in our list, it's custom
                    if (!GENRE_OPTIONS[loadedCategory].includes(loadedGenre)) {
                        setIsCustomGenre(true);
                    }

                    setCoverImage(currentData.coverImage || "");
                    const detectedType = currentData.type || "short";
                    setType(detectedType);
                    setContent(currentData.content || "");
                    setTags(currentData.tags || []);
                    // Wait for type state to update then load chapters if needed
                }
            } catch (err) {
                console.error("Critical Load Error:", err);
            }
        });

        return () => unsub();
    }, [id]);

    // Separate chapter loading effect to ensure type is set
    useEffect(() => {
        const loadChapters = async () => {
            const user = auth.currentUser;
            if (!user || type !== "novel") return;

            try {
                const chaptersRef = collection(db, "users", user.uid, "drafts", id, "chapters");
                const q = query(chaptersRef, orderBy("order", "asc"));
                const chapSnap = await getDocs(q);

                if (chapSnap.docs.length === 0) {
                    const pubChaptersRef = collection(db, "novels", id, "chapters");
                    const pubQ = query(pubChaptersRef, orderBy("order", "asc"));
                    const pubSnap = await getDocs(pubQ);
                    if (pubSnap.docs.length > 0) {
                        setChapters(pubSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
                    } else {
                        setChapters([{ id: doc(collection(db, "temp")).id, title: "Chapter 1", content: "" }]);
                    }
                } else {
                    setChapters(chapSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
                }
            } catch (e) { console.error("Chapter load error", e); }
        };
        loadChapters();
    }, [id, type]);

    // Autosave
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const t = setTimeout(async () => {
            setSaving(true);
            try {
                const ref = doc(db, "users", user.uid, "drafts", id);
                await setDoc(ref, {
                    title,
                    content: type === "short" ? content : "",
                    category,
                    genre,
                    coverImage,
                    type,
                    tags,
                    updatedAt: serverTimestamp(),
                }, { merge: true });

                if (type === "novel") {
                    for (let i = 0; i < chapters.length; i++) {
                        const chapter = chapters[i];
                        if (!chapter?.id) continue;
                        const chapRef = doc(db, "users", user.uid, "drafts", id, "chapters", chapter.id);
                        await setDoc(chapRef, {
                            title: chapter.title || "Untitled Chapter",
                            content: chapter.content || "",
                            order: i,
                            updatedAt: serverTimestamp(),
                        }, { merge: true });
                    }
                }
            } catch (err) {
                console.error("Autosave Failure:", err);
            } finally {
                setSaving(false);
            }
        }, 2000);

        return () => clearTimeout(t);
    }, [title, content, category, genre, coverImage, chapters, id, type, tags]);

    const publish = async () => {
        const user = auth.currentUser;
        if (!user) return;

        let authorDisplayName = user.email || "Unknown Author";
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists() && userSnap.data().username) authorDisplayName = userSnap.data().username;
        } catch (e) { }

        const collectionName = type === "novel" ? "novels" : "stories";
        await setDoc(doc(db, collectionName, id), {
            title,
            authorId: user.uid,
            authorName: authorDisplayName,
            coverImage: coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Cover",
            category,
            genre,
            type,
            tags,
            published: true,
            createdAt: serverTimestamp(),
            publishedAt: serverTimestamp(),
            ...(type === "short" ? { content } : {}),
        });

        if (type === "novel" && chapters) {
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                if (!chapter || !chapter.id) continue;
                await setDoc(doc(db, "novels", id, "chapters", chapter.id), {
                    title: chapter.title || "Untitled",
                    content: chapter.content || "",
                    order: i,
                    authorId: user.uid,
                    novelId: id,
                    published: true,
                    publishedAt: serverTimestamp(),
                });
            }
        }
        alert(`${type === "novel" ? "Novel" : "Short story"} published successfully!`);
    };

    // ... rest of help functions same ...
    const deleteChapter = async (index: number) => {
        if (!confirm("Are you sure you want to delete this chapter?")) return;
        const chapterToDelete = chapters[index];
        const newChapters = chapters.filter((_, i) => i !== index);
        setChapters(newChapters);
        if (activeChapterIndex >= newChapters.length) setActiveChapterIndex(Math.max(0, newChapters.length - 1));
        const user = auth.currentUser;
        if (user && chapterToDelete?.id) {
            try { await deleteDoc(doc(db, "users", user.uid, "drafts", id, "chapters", chapterToDelete.id)); } catch (err) { }
        }
    };

    const addChapter = () => {
        const newId = doc(collection(db, "temp")).id;
        setChapters([...chapters, { id: newId, title: `Chapter ${chapters.length + 1}`, content: "" }]);
        setActiveChapterIndex(chapters.length);
    };

    const updateActiveChapter = (updates: Partial<{ title: string, content: string }>) => {
        const newChapters = [...chapters];
        newChapters[activeChapterIndex] = { ...newChapters[activeChapterIndex], ...updates };
        setChapters(newChapters);
    };

    return (
        <section className="space-y-12 max-w-5xl mx-auto pb-24 transition-all duration-700">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold ml-1">
                        <span>Drafting Room</span>
                        <div className="h-1 w-1 rounded-full bg-white/10" />
                        <span className="text-[var(--accent-sakura)]">{type === "novel" ? "Epic Architecture" : "Stand-alone Legend"}</span>
                    </div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Chronicle..."
                        className="w-full bg-transparent border-none p-0 text-5xl font-light text-[var(--foreground)] focus:outline-none placeholder:text-white/5 tracking-tight"
                    />
                </div>
                <div className="flex items-center gap-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text)]/30 font-bold">
                        {saving ? "Synchronizing..." : "Archive Secured"}
                    </p>
                    <button
                        onClick={publish}
                        className="bg-[var(--accent-lime)] text-white px-10 py-4 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold shadow-[0_0_20px_-5px_var(--glow-lime)] hover:scale-105 active:scale-95 transition-all"
                    >
                        Publish to Archives
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Metadata & Config */}
                <div className="lg:col-span-1 space-y-10">
                    {/* Category & Genre Block */}
                    <div className="glass-panel p-8 rounded-3xl space-y-8 border-white/5">
                        <div className="space-y-4">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold ml-1">Archive Category</label>
                            <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => { setCategory("fiction"); setGenre(GENRE_OPTIONS.fiction[0]); setIsCustomGenre(false); }}
                                    className={`flex-1 py-3 text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all ${category === "fiction" ? "bg-white/5 text-white font-bold shadow-inner" : "text-[var(--reader-text)]/40 hover:text-white"}`}
                                >
                                    Fiction
                                </button>
                                <button
                                    onClick={() => { setCategory("non-fiction"); setGenre(GENRE_OPTIONS["non-fiction"][0]); setIsCustomGenre(false); }}
                                    className={`flex-1 py-3 text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all ${category === "non-fiction" ? "bg-white/5 text-white font-bold shadow-inner" : "text-[var(--reader-text)]/40 hover:text-white"}`}
                                >
                                    Non-Fiction
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold ml-1">Genre</label>
                            {!isCustomGenre ? (
                                <select
                                    value={genre}
                                    onChange={(e) => {
                                        if (e.target.value === "CUSTOM") setIsCustomGenre(true);
                                        else setGenre(e.target.value);
                                    }}
                                    className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-xs text-[var(--foreground)] focus:outline-none focus:border-white/20 transition-all uppercase tracking-[0.2em] appearance-none cursor-pointer"
                                >
                                    {GENRE_OPTIONS[category].map(opt => (
                                        <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                                    ))}
                                    <option value="CUSTOM" className="bg-neutral-900">+ Custom Genre...</option>
                                </select>
                            ) : (
                                <div className="flex gap-3">
                                    <input
                                        value={genre === "CUSTOM" ? "" : genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        placeholder="Custom Genre..."
                                        className="flex-1 bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-xs text-[var(--foreground)] focus:outline-none focus:border-white/20 transition-all uppercase tracking-[0.2em]"
                                    />
                                    <button
                                        onClick={() => { setIsCustomGenre(false); setGenre(GENRE_OPTIONS[category][0]); }}
                                        className="aspect-square w-12 flex items-center justify-center border border-white/5 text-[var(--reader-text)] hover:text-white rounded-2xl transition-all"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags Block */}
                    <div className="glass-panel p-8 rounded-3xl space-y-6 border-white/5 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold ml-1">Smart Tags</label>
                            <span className="text-[8px] text-[var(--reader-text)]/20 italic tracking-widest">@system for tools</span>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-24 content-start">
                            {tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] rounded-full border transition-all flex items-center gap-3 ${tag.toLowerCase() === '@system'
                                        ? 'border-[var(--accent-sakura)]/30 bg-[var(--accent-sakura)]/5 text-[var(--accent-sakura)] shadow-[0_0_15px_-5px_var(--accent-sakura)]'
                                        : 'border-white/5 bg-white/[0.02] text-[var(--reader-text)]/60'
                                        }`}
                                >
                                    {tag}
                                    <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-white opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            ))}
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagInput.trim()) {
                                        setTags([...tags, tagInput.trim().startsWith('@') ? tagInput.trim() : `@${tagInput.trim()}`]);
                                        setTagInput("");
                                    }
                                }}
                                placeholder="Add @tag..."
                                className="bg-transparent border-none text-[10px] uppercase tracking-[0.2em] focus:outline-none text-white placeholder-white/10 w-24 ml-2"
                            />
                        </div>

                        {/* Floating System Toolbox */}
                        {hasSystemTag && (
                            <div className="absolute -top-6 -right-4 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-500 z-20">
                                <button
                                    onClick={() => {
                                        const template = `\n[System: Alert | Connection timed out.]\n`;
                                        if (type === 'short') setContent(content + template);
                                        else updateActiveChapter({ content: (chapters[activeChapterIndex]?.content || "") + template });
                                    }}
                                    className="bg-neutral-900 border border-white/10 text-[8px] uppercase tracking-[0.3em] px-4 py-2 font-bold rounded-full shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-indigo-500" /> [System]
                                </button>
                                <button
                                    onClick={() => {
                                        const template = `\n{Quest: Daily Quests | - 5km run\n- 50 push-ups}\n`;
                                        if (type === 'short') setContent(content + template);
                                        else updateActiveChapter({ content: (chapters[activeChapterIndex]?.content || "") + template });
                                    }}
                                    className="bg-neutral-900 border border-white/10 text-[8px] uppercase tracking-[0.3em] px-4 py-2 font-bold rounded-full shadow-2xl hover:bg-white hover:text-black transition-all flex items-center gap-2"
                                >
                                    <div className="w-1 h-1 rounded-full bg-amber-500" /> {`{Quest}`}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cover Asset Block */}
                    <div className="glass-panel p-8 rounded-3xl space-y-6 border-white/5">
                        <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold ml-1">Cover Asset</label>
                        <div className="aspect-[4/6] rounded-2xl overflow-hidden glass-panel border-white/5 relative group">
                            {coverImage ? (
                                <img src={coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] text-white/5 italic">No asset selected</div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                                <ImageUpload
                                    label="Replace Image"
                                    onUploadComplete={setCoverImage}
                                    className="scale-90"
                                />
                            </div>
                        </div>
                        <input
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="Direct URL..."
                            className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-[9px] text-[var(--reader-text)]/40 focus:outline-none focus:border-white/20 transition-all uppercase tracking-[0.2em] placeholder:text-white/5"
                        />
                    </div>
                </div>

                {/* Right Column: Writing Surface */}
                <div className="lg:col-span-2 space-y-10">
                    {type === "short" ? (
                        <div className="glass-panel p-1 rounded-[2.5rem] border-white/5 h-full min-h-[80vh] flex flex-col overflow-hidden">
                            <div className="absolute top-8 left-8 text-[9px] uppercase tracking-[0.5em] text-white/5 pointer-events-none">Narrative Flow</div>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Start your legend…"
                                className="flex-1 w-full bg-transparent p-12 resize-none text-xl font-light text-[var(--foreground)] focus:outline-none placeholder:text-white/5 leading-relaxed selection:bg-[var(--accent-sakura)]/20"
                            />
                        </div>
                    ) : (
                        <div className="flex gap-6 h-[85vh]">
                            {/* Modern Chapter Sidebar */}
                            <div className="w-64 flex flex-col gap-4 border-r border-white/5 pr-6 overflow-y-auto scrollbar-hide">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/40 font-bold">Chapters</label>
                                    <button
                                        onClick={addChapter}
                                        className="text-[16px] text-white/20 hover:text-white transition-all p-2 bg-white/5 rounded-full"
                                        title="Add New Chapter"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {chapters.map((ch, idx) => (
                                        <div key={ch?.id || `idx-${idx}`} className="group relative">
                                            <button
                                                onClick={() => setActiveChapterIndex(idx)}
                                                className={`w-full text-left p-4 rounded-2xl text-[11px] truncate transition-all duration-500 border relative overflow-hidden pr-12 ${activeChapterIndex === idx
                                                    ? "glass-panel bg-white/5 border-white/10 text-white translate-x-1"
                                                    : "border-transparent text-white/20 hover:text-white/60 hover:translate-x-1"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="opacity-30 font-bold tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                                                    <span className="tracking-wide">{ch?.title || "Untitled"}</span>
                                                </div>
                                                {activeChapterIndex === idx && (
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[var(--accent-sakura)] shadow-[0_0_10px_var(--accent-sakura)]" />
                                                )}
                                            </button>
                                            {/* Quick Delete Trigger */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteChapter(idx); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/0 group-hover:text-red-500/40 hover:text-red-500 transition-all z-10"
                                                title="Delete Chapter"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Refined Chapter Editor */}
                            <div className="flex-1 flex flex-col gap-8 min-h-0 bg-white/[0.01] rounded-[2.5rem] border border-white/5 p-12 overflow-hidden relative">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/30 font-bold ml-1">Chapter Title</label>
                                    <div className="flex items-center justify-between gap-6 group">
                                        <input
                                            value={chapters[activeChapterIndex]?.title || ""}
                                            onChange={(e) => updateActiveChapter({ title: e.target.value })}
                                            placeholder="E.g. A New Dawn..."
                                            className="bg-transparent border-none p-0 text-3xl font-light text-white focus:outline-none placeholder:text-white/5 flex-1 tracking-tight"
                                        />
                                        <button
                                            onClick={() => deleteChapter(activeChapterIndex)}
                                            className="text-[9px] uppercase tracking-[0.3em] font-bold text-red-500 border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)] appearance-none"
                                        >
                                            Discard Chapter
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col min-h-0 relative">
                                    <textarea
                                        value={chapters[activeChapterIndex]?.content || ""}
                                        onChange={(e) => updateActiveChapter({ content: e.target.value })}
                                        placeholder="Weave your story..."
                                        className="flex-1 w-full bg-transparent resize-none text-xl font-light text-[var(--foreground)] focus:outline-none placeholder:text-white/5 leading-relaxed selection:bg-[var(--accent-sakura)]/20 scrollbar-hide"
                                    />
                                    <div className="absolute top-0 right-0 py-1 px-3 text-[8px] uppercase tracking-[0.4em] text-white/5 border border-white/5 rounded-full pointer-events-none">
                                        Creative Flow
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="pt-24 border-t border-white/5 flex justify-between items-center opacity-10 grayscale">
                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.5em] font-bold">
                    <span>Vellum Editor Suite</span>
                    <div className="h-1 w-1 rounded-full bg-white" />
                    <span className="italic">Archival Grade</span>
                </div>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Achronos-3 Interface</span>
            </footer>
        </section>
    );
}
