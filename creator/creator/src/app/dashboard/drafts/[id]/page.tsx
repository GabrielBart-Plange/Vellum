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
    const { id } = useParams<{ id: string }>();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [genre, setGenre] = useState("Fantasy");
    const [coverImage, setCoverImage] = useState("");
    const [type, setType] = useState<"short" | "novel">("short");
    const [chapters, setChapters] = useState<{ id: string, title: string, content: string }[]>([]);
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    // Unified data loading effect
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) return;

            try {
                console.log("Loading draft or published work for ID:", id);
                const draftRef = doc(db, "users", user.uid, "drafts", id);
                const draftSnap = await getDoc(draftRef);

                let currentData = null;
                let usedFallback = false;

                if (draftSnap.exists()) {
                    console.log("Found existing draft.");
                    currentData = draftSnap.data();
                } else {
                    console.log("No draft found, checking published collections...");
                    const novelSnap = await getDoc(doc(db, "novels", id));
                    if (novelSnap.exists()) {
                        currentData = novelSnap.data();
                        usedFallback = true;
                        console.log("Found published novel fallback.");
                    } else {
                        const storySnap = await getDoc(doc(db, "stories", id));
                        if (storySnap.exists()) {
                            currentData = storySnap.data();
                            usedFallback = true;
                            console.log("Found published story fallback.");
                        }
                    }
                }

                if (currentData) {
                    setTitle(currentData.title || "");
                    setGenre(currentData.genre || "Fantasy");
                    setCoverImage(currentData.coverImage || "");
                    const detectedType = currentData.type || "short";
                    setType(detectedType);
                    setContent(currentData.content || "");

                    if (detectedType === "novel") {
                        let chaptersRef = collection(db, "users", user.uid, "drafts", id, "chapters");
                        let q = query(chaptersRef, orderBy("createdAt", "asc"));
                        let chapSnap = await getDocs(q);

                        // If draft has no chapters, try pulling from published as a second-level fallback
                        if (chapSnap.docs.length === 0) {
                            console.log("No chapters in draft, checking published version...");
                            const pubChaptersRef = collection(db, "novels", id, "chapters");
                            const pubQ = query(pubChaptersRef, orderBy("order", "asc"));
                            const pubSnap = await getDocs(pubQ);

                            if (pubSnap.docs.length > 0) {
                                console.log(`Recovered ${pubSnap.docs.length} chapters from published version.`);
                                setChapters(pubSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
                            } else {
                                console.log("No published chapters found either, initializing default.");
                                setChapters([{ id: doc(collection(db, "temp")).id, title: "Chapter 1", content: "" }]);
                            }
                        } else {
                            setChapters(chapSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
                        }
                    }
                } else {
                    console.log("Document not found in any collection.");
                }
            } catch (err) {
                console.error("Critical Load Error:", err);
            }
        });

        return () => unsub();
    }, [id]);

    // Autosave with cleaner logic
    useEffect(() => {
        const user = auth.currentUser;
        if (!user || !title) return;

        const t = setTimeout(async () => {
            setSaving(true);
            try {
                console.log("Autosaving...");
                const ref = doc(db, "users", user.uid, "drafts", id);
                await setDoc(ref, {
                    title,
                    content: type === "short" ? content : "",
                    genre,
                    coverImage,
                    type,
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
                console.log("Autosave complete.");
            } catch (err) {
                console.error("Autosave Failure:", err);
            } finally {
                setSaving(false);
            }
        }, 2000);

        return () => clearTimeout(t);
    }, [title, content, genre, coverImage, chapters, id, type]);

    const publish = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch latest username before publishing to ensure we have it
        let authorDisplayName = user.email || "Unknown Author";
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().username) {
                authorDisplayName = userSnap.data().username;
            }
        } catch (e) {
            console.error("Error fetching username for publish:", e);
        }

        // Determine collection based on draft type
        const collectionName = type === "novel" ? "novels" : "stories";

        // Use setDoc to keep the ID consistent (draft ID = story ID) and prevent duplicates
        await setDoc(doc(db, collectionName, id), {
            title,
            authorId: user.uid,
            authorName: authorDisplayName,
            coverImage: coverImage || "https://placehold.co/400x600/1a1a1a/666666?text=Cover",
            genre,
            type,
            published: true,
            createdAt: serverTimestamp(),
            publishedAt: serverTimestamp(),
            // Short stories keep content, novels don't (they use chapters sub-collection)
            ...(type === "short" ? { content } : {}),
        });

        // Publish chapters if novel
        if (type === "novel" && chapters) {
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                if (!chapter || !chapter.id) continue;

                await setDoc(doc(db, "novels", id, "chapters", chapter.id), {
                    title: chapter.title || "Untitled",
                    content: chapter.content || "",
                    order: i,
                    authorId: user.uid, // Denormalized for security rules
                    novelId: id,
                    published: true, // Denormalized for security rules
                    publishedAt: serverTimestamp(),
                });
            }
        }

        alert(`${type === "novel" ? "Novel" : "Short story"} published successfully!`);
    };

    const deleteChapter = async (index: number) => {
        if (!confirm("Are you sure you want to delete this chapter from your draft?")) return;

        const chapterToDelete = chapters[index];
        const newChapters = chapters.filter((_, i) => i !== index);
        setChapters(newChapters);

        // If we deleted the active chapter, adjust index
        if (activeChapterIndex >= newChapters.length) {
            setActiveChapterIndex(Math.max(0, newChapters.length - 1));
        }

        // Also delete from Firestore draft collection immediately
        const user = auth.currentUser;
        if (user && chapterToDelete?.id) {
            try {
                const chapRef = doc(db, "users", user.uid, "drafts", id, "chapters", chapterToDelete.id);
                await deleteDoc(chapRef);
                console.log("Chapter deleted from draft storage.");
            } catch (err) {
                console.error("Failed to delete chapter from Firestore:", err);
            }
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
        <section className="max-w-3xl space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Story title"
                        className="w-full bg-black border border-white/10 p-2 text-lg focus:outline-none focus:border-white/30 transition-colors"
                    />
                </div>
                <div className="w-48">
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Genre</label>
                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-lg focus:outline-none focus:border-white/30 transition-colors"
                    >
                        <option value="Fantasy">Fantasy</option>
                        <option value="Sci-Fi">Sci-Fi</option>
                        <option value="Mystery">Mystery</option>
                        <option value="Horror">Horror</option>
                        <option value="Thriller">Thriller</option>
                        <option value="Romance">Romance</option>
                    </select>
                </div>
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
