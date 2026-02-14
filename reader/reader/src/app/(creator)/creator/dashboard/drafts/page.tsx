"use client";

import { auth, db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, doc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";

type Draft = {
    id: string;
    title: string;
    type: "short" | "novel";
};

export default function DraftsPage() {
    const [drafts, setDrafts] = useState<Draft[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const ref = collection(db, "users", user.uid, "drafts");
                const q = query(ref, orderBy("updatedAt", "desc"));
                const snap = await getDocs(q);

                setDrafts(
                    snap.docs.map((d) => ({
                        id: d.id,
                        title: d.data().title || "Untitled",
                        type: d.data().type,
                    }))
                );
            } catch (error) {
                console.error("Error fetching drafts:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, []);

    if (loading) {
        return (
            <div className="text-[var(--reader-text)]">
                Loading drafts...
            </div>
        );
    }

    const deleteDraft = async (id: string) => {
        const user = auth.currentUser;
        if (!user || !confirm("Are you sure you want to delete this draft?")) return;

        try {
            const ref = doc(db, "users", user.uid, "drafts", id);
            await deleteDoc(ref);
            setDrafts(drafts.filter((d) => d.id !== id));
        } catch (error) {
            console.error("Error deleting draft:", error);
            alert("Failed to delete draft.");
        }
    };

    return (
        <section className="space-y-12 transition-all duration-500">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">Drafts</h1>
                    <p className="text-[var(--reader-text)]/40 text-[10px] uppercase tracking-[0.2em]">Your evolving archives</p>
                </div>

                <Link
                    href="/creator/dashboard/drafts/new"
                    className="bg-[var(--accent-lime)] px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-white shadow-[0_0_20px_-5px_var(--glow-lime)] hover:scale-105 active:scale-95 transition-all"
                >
                    New draft
                </Link>
            </header>

            {drafts.length === 0 ? (
                <div className="py-20 text-center glass-panel border-dashed border-white/5 rounded-3xl">
                    <p className="text-[var(--reader-text)] italic tracking-wide">"The scroll is still blank. Begin your next chronicle."</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {drafts.map((d) => (
                        <li key={d.id} className="group relative">
                            <Link
                                href={`/creator/dashboard/drafts/${d.id}`}
                                className="block glass-panel p-6 rounded-2xl hover:bg-white/[0.03] border-white/5 hover:border-white/10 transition-all group-hover:pl-8"
                            >
                                <div className="flex justify-between items-center pr-12">
                                    <div>
                                        <p className="text-[var(--foreground)] group-hover:text-[var(--accent-sakura)] transition-colors text-lg tracking-wide">{d.title || "Untitled"}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-[var(--reader-text)]/40 uppercase tracking-[0.2em] font-medium">
                                                {d.type === "short" ? "Short story" : "Novel"}
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-white/10" />
                                            <span className="text-[10px] text-[var(--reader-text)]/30 uppercase tracking-[0.2em]">In Progress</span>
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-text)]/30"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </div>
                            </Link>

                            <button
                                onClick={() => deleteDraft(d.id)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-red-900/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                title="Discard Draft"
                            >
                                Discard
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
