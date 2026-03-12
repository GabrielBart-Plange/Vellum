"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
    id: string;
    userId: string;
    username: string;
    text: string;
    createdAt: Timestamp;
}

interface ArtCommentsProps {
    artId: string;
}

export default function ArtComments({ artId }: ArtCommentsProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, "art", artId, "comments"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
        });

        return () => unsubscribe();
    }, [artId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, "art", artId, "comments"), {
                userId: user.uid,
                username: user.displayName || "Unknown User",
                text: newComment.trim(),
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">Echoes of the Chronicle</h4>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Leave an echo..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-all"
                />
                <button
                    type="submit"
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-black text-[10px] uppercase font-black tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                    Post
                </button>
            </form>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <p className="text-zinc-700 italic text-xs py-4">"Silence remains unbroken."</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="glass-panel p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                                    {comment.username}
                                </span>
                                <span className="text-[9px] text-zinc-700 uppercase">
                                    {comment.createdAt?.toDate().toLocaleDateString() || "just now"}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-300 font-light leading-relaxed">
                                {comment.text}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
