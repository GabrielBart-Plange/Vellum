"use client";

import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

interface ArtPiece {
    id: string;
    title: string;
    imageUrl: string;
    description: string;
    createdAt: any;
}

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

            setArt([{
                id: docRef.id,
                title: newTitle || "Untitled",
                imageUrl: newImageUrl,
                description: newDescription,
                createdAt: new Date(),
            }, ...art]);

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
        <section className="space-y-8">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-xl tracking-widest uppercase text-white">Art Gallery</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Manage your visual chronicles</p>
                </div>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="border border-white/10 px-6 py-2 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                    {showAddForm ? "Cancel" : "Add New Art"}
                </button>
            </header>

            {showAddForm && (
                <form onSubmit={handleAddArt} className="bg-zinc-900/30 border border-white/5 p-8 space-y-6 rounded-sm max-w-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-4 text-sm">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Piece Title</label>
                            <input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="E.g. The Shattered Citadel"
                                className="w-full bg-black border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                        <div className="flex gap-4 items-end">
                            <ImageUpload
                                label="Upload Piece"
                                onUploadComplete={setNewImageUrl}
                                className="flex-shrink-0"
                            />
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Or Image URL</label>
                                <input
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/art.jpg"
                                    required
                                    className="w-full bg-black border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Description (Optional)</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="A brief context for this piece..."
                                className="w-full bg-black border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors h-24 resize-none"
                            />
                        </div>
                    </div>
                    <button
                        disabled={saving}
                        className="w-full bg-white text-black py-3 text-xs uppercase tracking-[0.3em] font-bold hover:bg-gray-200 transition-colors disabled:bg-gray-600"
                    >
                        {saving ? "Publishing..." : "Publish to Gallery"}
                    </button>
                </form>
            )}

            {loading ? (
                <div className="flex gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-64 h-80 bg-zinc-900 rounded-sm" />
                    ))}
                </div>
            ) : art.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-white/10 rounded-sm">
                    <p className="text-gray-600 italic">"No visual echoes found in your gallery."</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {art.map((item) => (
                        <div key={item.id} className="group relative bg-zinc-900/20 border border-white/5 overflow-hidden rounded-sm transition-all hover:border-white/20">
                            <div className="aspect-[4/5] overflow-hidden grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => (e.currentTarget.src = "https://placehold.co/400x500/1a1a1a/666666?text=Image+Not+Found")}
                                />
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-sm font-medium text-gray-200 tracking-wide uppercase">{item.title}</h3>
                                    <button
                                        onClick={() => handleDeleteArt(item.id)}
                                        className="text-[10px] text-red-900/70 hover:text-red-500 uppercase tracking-widest transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                                {item.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
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
