"use client";

import { auth, db } from "@/lib/firebase";
import {
    setDoc,
    deleteDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

export default function DraftEditorPage() {
    const GENRE_OPTIONS = {
        fiction: ["Fantasy", "Sci-Fi", "Mystery", "Horror", "Thriller", "Romance", "Adventure", "Historical Fiction", "Comedy", "Literary Fiction"],
        "non-fiction": ["Biography", "Memoir", "Self-Help", "Essay", "Travel", "History", "Science", "Philosophy", "Guide", "Commentary"]
    };

    const { id } = useParams<{ id: string }>();
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
                let chaptersRef = collection(db, "users", user.uid, "drafts", id, "chapters");
                let q = query(chaptersRef, orderBy("order", "asc"));
                let chapSnap = await getDocs(q);

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
        if (!user || !title) return;

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
        <section className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Category</label>
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/5">
                        <button
                            onClick={() => { setCategory("fiction"); setGenre(GENRE_OPTIONS.fiction[0]); setIsCustomGenre(false); }}
                            className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${category === "fiction" ? "bg-white text-black font-bold" : "text-gray-500 hover:text-white"}`}
                        >
                            Fiction
                        </button>
                        <button
                            onClick={() => { setCategory("non-fiction"); setGenre(GENRE_OPTIONS["non-fiction"][0]); setIsCustomGenre(false); }}
                            className={`flex-1 py-2 text-[10px] uppercase tracking-widest transition-all ${category === "non-fiction" ? "bg-white text-black font-bold" : "text-gray-500 hover:text-white"}`}
                        >
                            Non-Fiction
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Genre</label>
                    <div className="flex gap-2">
                        {!isCustomGenre ? (
                            <select
                                value={genre}
                                onChange={(e) => {
                                    if (e.target.value === "CUSTOM") setIsCustomGenre(true);
                                    else setGenre(e.target.value);
                                }}
                                className="flex-1 bg-black border border-white/10 p-2 text-sm focus:outline-none focus:border-white/30 transition-colors uppercase tracking-widest"
                            >
                                {GENRE_OPTIONS[category].map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="CUSTOM">+ Custom Genre...</option>
                            </select>
                        ) : (
                            <div className="flex-1 flex gap-2">
                                <input
                                    value={genre === "CUSTOM" ? "" : genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    placeholder="Enter custom genre..."
                                    className="flex-1 bg-black border border-white/10 p-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <button
                                    onClick={() => { setIsCustomGenre(false); setGenre(GENRE_OPTIONS[category][0]); }}
                                    className="px-3 border border-white/10 text-gray-500 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">Book Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter the chronicle's title..."
                    className="w-full bg-black border border-white/10 p-3 text-xl font-light focus:outline-none focus:border-white/30 transition-colors"
                />
            </div>

            <div className="space-y-4 bg-white/5 border border-white/5 p-4 relative group">
                <div className="flex justify-between items-center">
                    <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">Smart Tags (@tags)</label>
                    <span className="text-[9px] text-gray-600 italic">Prepend @system to unlock system tools</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                        <span key={idx} className={`px-2 py-1 text-[10px] uppercase tracking-widest border ${tag.toLowerCase() === '@system' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-white/10 bg-white/5 text-gray-400'} flex items-center gap-2`}>
                            {tag}
                            <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="hover:text-white">✕</button>
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
                        placeholder="Add tag (e.g. action)..."
                        className="bg-transparent border-none text-[10px] uppercase tracking-widest focus:outline-none text-gray-300 w-32"
                    />
                </div>

                {/* System Toolbox - Triggered by @system */}
                {hasSystemTag && (
                    <div className="absolute -top-12 left-0 right-0 flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={() => {
                                const template = `\n[System: Notification text here]\n`;
                                if (type === 'short') setContent(content + template);
                                else updateActiveChapter({ content: (chapters[activeChapterIndex]?.content || "") + template });
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold shadow-lg"
                        >
                            + [System]
                        </button>
                        <button
                            onClick={() => {
                                const template = `\n{Quest: Quest Name\n- Objective: ...\n- Reward: ...}\n`;
                                if (type === 'short') setContent(content + template);
                                else updateActiveChapter({ content: (chapters[activeChapterIndex]?.content || "") + template });
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold shadow-lg"
                        >
                            + {"{Quest}"}
                        </button>
                        <button
                            onClick={() => {
                                const template = `\n|Status|\nName: ...\nLevel: 1\nClass: ...\nStrength: 10\nAgility: 10\n|/Status|\n`;
                                if (type === 'short') setContent(content + template);
                                else updateActiveChapter({ content: (chapters[activeChapterIndex]?.content || "") + template });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold shadow-lg"
                        >
                            + |Status Table|
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-8 items-start">
                <ImageUpload
                    label="Cover Image"
                    onUploadComplete={setCoverImage}
                    className="flex-shrink-0"
                />
                <div className="flex-1 space-y-4">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Current URL</p>
                    <input
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="w-full bg-black border border-white/10 p-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <p className="text-[10px] text-gray-600 italic">"Upload a file above or paste a direct link here."</p>
                </div>
            </div>

            {type === "short" ? (
                <div className="pt-4">
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Content</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing…"
                        className="w-full h-[60vh] bg-black border border-white/10 p-3 resize-none focus:outline-none focus:border-white/30 transition-colors"
                    />
                </div>
            ) : (
                <div className="flex gap-6 pt-4 h-[70vh]">
                    {/* Chapter Sidebar */}
                    <div className="w-48 flex flex-col gap-2 border-r border-white/5 pr-4 overflow-y-auto">
                        <label className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">Chapters</label>
                        {chapters.map((ch, idx) => (
                            <div key={ch?.id || `idx-${idx}`} className="group relative">
                                <button
                                    onClick={() => setActiveChapterIndex(idx)}
                                    className={`w-full text-left p-2 text-xs truncate transition-colors pr-8 ${activeChapterIndex === idx
                                        ? "bg-white/10 text-white"
                                        : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    {idx + 1}. {ch?.title || "Untitled"}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteChapter(idx); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-red-900/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Delete Chapter"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addChapter}
                            className="text-center p-2 text-[10px] uppercase tracking-widest border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all mt-4"
                        >
                            + New Chapter
                        </button>
                    </div>

                    {/* Chapter Editor */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Chapter Title</label>
                            <input
                                value={chapters[activeChapterIndex]?.title || ""}
                                onChange={(e) => updateActiveChapter({ title: e.target.value })}
                                placeholder="E.g. The Quiet Before"
                                className="w-full bg-black border border-white/10 p-2 text-sm focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="block text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-1">Chapter Content</label>
                            <textarea
                                value={chapters[activeChapterIndex]?.content || ""}
                                onChange={(e) => updateActiveChapter({ content: e.target.value })}
                                placeholder="Expand the chronicle…"
                                className="flex-1 bg-black border border-white/10 p-3 resize-none focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}

            <p className="text-xs text-gray-500">
                {saving ? "Saving…" : "Saved"}
            </p>

            <button onClick={publish} className="bg-white text-black px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                Publish {type === "novel" ? "novel" : "short story"}
            </button>
        </section>
    );
}
