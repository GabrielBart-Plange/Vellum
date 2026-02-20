"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Focus input? 
        } else {
            document.body.style.overflow = "unset";
            setSearchTerm("");
            setResults([]);
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    useEffect(() => {
        const search = async () => {
            if (!searchTerm.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Simple search: Title starts with searchTerm
                // Note: Firestore is case-sensitive by default.
                // For a robust search, we'd ideally have a lowercase field or an external search service.
                // For now, we'll try to match standard capitalized titles.

                const novelsRef = collection(db, "novels");

                // We'll just fetch recent published novels and filter client-side for this demo 
                // to avoid complex index requirements on 'published' + 'title' range queries immediately.
                // If the dataset grows, this needs a proper index or dedicated search solution.
                const q = query(
                    novelsRef,
                    where("published", "==", true),
                    limit(50)
                );

                const snap = await getDocs(q);
                const hits = snap.docs
                    .map(d => ({ id: d.id, ...d.data() } as any))
                    .filter(n => n.title?.toLowerCase().includes(searchTerm.toLowerCase()));

                setResults(hits);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(search, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-[#0b0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[70vh]">
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 ml-2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        className="flex-1 bg-transparent border-none text-lg text-white placeholder-zinc-600 focus:outline-none"
                        placeholder="Search chronicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white transition-colors"
                    >
                        <span className="text-xs uppercase font-bold tracking-widest">ESC</span>
                    </button>
                </div>

                <div className="overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500 text-xs uppercase tracking-widest animate-pulse">
                            Searching Archives...
                        </div>
                    ) : searchTerm && results.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 text-sm">
                            No chronicles found matching "{searchTerm}"
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {results.map(novel => (
                                <Link
                                    key={novel.id}
                                    href={`/novels/${novel.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group"
                                >
                                    <div className="h-12 w-8 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                        {novel.coverImage ? (
                                            <img src={novel.coverImage} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                                            {novel.title}
                                        </h4>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                                            {novel.authorName || "Unknown Author"} • {novel.genre || "Fiction"}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="p-8 text-center">
                            <p className="text-zinc-700 text-xs uppercase tracking-[0.2em] font-bold">
                                Type to search the archives
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
