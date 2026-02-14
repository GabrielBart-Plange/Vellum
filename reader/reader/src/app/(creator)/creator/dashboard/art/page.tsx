"use client";

import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/creator/ImageUpload";
import { ArtPiece } from "@/types";
import Link from "next/link";
import MobileNav from "@/components/creator/MobileNav";
import Sidebar from "@/components/creator/Sidebar";

export default function ArtGalleryPage() {
    const [art, setArt] = useState<ArtPiece[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "art"),
                    where("authorId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const snap = await getDocs(q);
                setArt(snap.docs.map(d => ({ id: d.id, ...d.data() } as ArtPiece)));
            } catch (error) {
                console.error("Error fetching art:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, []);

    const handleAddArt = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !newImageUrl) return;

        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, "art"), {
                title: newTitle || "Untitled",
                imageUrl: newImageUrl,
                description: newDescription,
                authorId: user.uid,
                createdAt: serverTimestamp(),
            });

            setArt((prevArt) => [{
                id: docRef.id,
                title: newTitle || "Untitled",
                imageUrl: newImageUrl,
                description: newDescription,
                createdAt: Timestamp.now(),
            }, ...prevArt]);

            // Reset form
            setNewTitle("");
            setNewImageUrl("");
            setNewDescription("");
            setShowAddForm(false);
        } catch (error) {
            console.error("Error adding art:", error);
            alert("Failed to add art.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteArt = async (id: string) => {
        if (!confirm("Remove this piece from your gallery?")) return;
        try {
            await deleteDoc(doc(db, "art", id));
            setArt(art.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting art:", error);
        }
    };

    return (
        <section className="space-y-12 transition-all duration-500">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">Art Gallery</h1>
                    <p className="text-[var(--reader-text)]/40 text-[10px] uppercase tracking-[0.2em]">Manage your visual chronicles</p>
                </div>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-10 py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${showAddForm
                            ? "glass-panel border-white/10 text-[var(--foreground)] hover:bg-white/5"
                            : "bg-[var(--accent-lime)] text-white shadow-[0_0_20px_-5px_var(--glow-lime)] hover:scale-105"
                        }`}
                >
                    {showAddForm ? "Discard Change" : "Add New Art"}
                </button>
            </header>

            {showAddForm && (
                <form onSubmit={handleAddArt} className="glass-panel p-10 space-y-8 rounded-3xl max-w-2xl animate-in fade-in slide-in-from-top-4 border-white/5">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/50 font-bold ml-1">Piece Title</label>
                            <input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="E.g. The Shattered Citadel"
                                className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-xl text-[var(--foreground)] focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 items-end">
                            <ImageUpload
                                label="Upload Piece"
                                onUploadComplete={setNewImageUrl}
                                className="flex-shrink-0"
                            />
                            <div className="flex-1 w-full space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/50 font-bold ml-1">Or Image URL</label>
                                <input
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/art.jpg"
                                    required
                                    className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-xl text-[var(--foreground)] focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/50 font-bold ml-1">Description (Optional)</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="A brief context for this piece..."
                                className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-xl text-[var(--foreground)] focus:outline-none focus:border-white/20 transition-all h-32 resize-none placeholder:text-white/10 leading-relaxed"
                            />
                        </div>
                    </div>
                    <button
                        disabled={saving}
                        className="w-full bg-[var(--reader-accent)] text-white py-5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_-5px_hsla(var(--reader-accent-hsl),0.3)] disabled:opacity-50"
                    >
                        {saving ? "Publishing..." : "Publish to Gallery"}
                    </button>
                </form>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[4/5] glass-panel rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : art.length === 0 ? (
                <div className="py-24 text-center glass-panel border-dashed border-white/5 rounded-3xl">
                    <p className="text-[var(--reader-text)]/40 italic tracking-wide">"The gallery sits in silence. Populate it with your visions."</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {art.map((item) => (
                        <div key={item.id} className="group glass-panel rounded-3xl overflow-hidden hover:border-white/10 transition-all">
                            <div className="aspect-[4/5] overflow-hidden">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 grayscale-[0.3] group-hover:grayscale-0"
                                    onError={(e) => (e.currentTarget.src = "https://placehold.co/400x500/1a1a1a/666666?text=Image+Not+Found")}
                                />
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-light text-[var(--foreground)] tracking-wide">{item.title}</h3>
                                    <button
                                        onClick={() => handleDeleteArt(item.id)}
                                        className="text-[9px] text-red-900/40 hover:text-red-500 uppercase tracking-[0.2em] font-bold transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                                {item.description && (
                                    <p className="text-xs text-[var(--reader-text)]/50 line-clamp-2 leading-relaxed font-light italic">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
