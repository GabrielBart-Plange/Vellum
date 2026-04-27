"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isOpen) {
            const genreMatch = pathname?.match(/\/genre\/([^/]+)/);
            if (genreMatch) {
                const genreMap: Record<string, string> = {
                    'fantasy': 'Fantasy', 'sci-fi': 'Sci-Fi', 'romance': 'Romance',
                    'action': 'Action', 'mystery': 'Mystery', 'horror': 'Horror'
                };
                if (genreMap[genreMatch[1]]) setSelectedGenre(genreMap[genreMatch[1]]);
            } else {
                const savedGenre = sessionStorage.getItem("vellum-search-genre");
                if (savedGenre) setSelectedGenre(savedGenre);
            }

            const savedTerm = sessionStorage.getItem("vellum-search-term");
            const savedStatus = sessionStorage.getItem("vellum-search-status");
            if (savedTerm) setSearchTerm(savedTerm);
            if (savedStatus) setSelectedStatus(savedStatus);
        }
    }, [isOpen, pathname]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    useEffect(() => {
        sessionStorage.setItem("vellum-search-term", searchTerm);
        sessionStorage.setItem("vellum-search-genre", selectedGenre);
        sessionStorage.setItem("vellum-search-status", selectedStatus);

        const search = async () => {
            if (!searchTerm.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const batchSize = 60;
                const [novelsSnap, storiesSnap, artSnap] = await Promise.all([
                    getDocs(query(collection(db, "novels"), where("published", "==", true), limit(batchSize))),
                    getDocs(query(collection(db, "stories"), where("published", "==", true), limit(batchSize))),
                    getDocs(query(collection(db, "art"), orderBy("createdAt", "desc"), limit(batchSize)))
                ]);

                const novels = novelsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'novel' } as any));
                const stories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'story' } as any));
                const art = artSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'art' } as any));

                let hits = [...novels, ...stories, ...art];

                hits = hits.filter(n => {
                    const title = n.title || "";
                    const description = n.description || "";
                    const author = n.authorName || "";
                    const term = searchTerm.toLowerCase();

                    const matchesTerm = title.toLowerCase().includes(term) ||
                        description.toLowerCase().includes(term) ||
                        author.toLowerCase().includes(term);

                    const matchesGenre = selectedGenre === "All" ||
                        n.genre === selectedGenre ||
                        n.category === selectedGenre ||
                        (n.tags && n.tags.includes(selectedGenre));

                    return matchesTerm && matchesGenre;
                });

                hits.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setResults(hits);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(search, 400);
        return () => clearTimeout(timeout);
    }, [searchTerm, selectedGenre, selectedStatus]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 overflow-hidden">
            <div
                className="absolute inset-0 bg-[#060509]/90 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            >
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--reader-accent)]/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            <div className="relative w-full max-w-2xl bg-[#0b0a0f]/80 backdrop-blur-md border border-white/5 rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8),0_0_50px_rgba(139,92,246,0.05)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-8 duration-500 flex flex-col max-h-[75vh]">
                
                {/* Search Header */}
                <div className="p-8 pb-6 space-y-8 relative">
                    <div className="flex items-center gap-6 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[var(--reader-accent)] blur-lg opacity-0 group-focus-within:opacity-20 transition-opacity" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-focus-within:text-[var(--reader-accent)] transition-colors relative z-10">
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            className="flex-1 bg-transparent border-none text-2xl text-white placeholder-zinc-800 focus:outline-none italic font-black tracking-tight"
                            placeholder="Search the archives..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-600 hover:text-white transition-all hover:bg-white/10 active:scale-95 group/esc"
                        >
                            <span className="text-[10px] font-black tracking-widest italic group-hover:translate-x-0.5 transition-transform">ESC</span>
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] rounded-2xl border border-white/5">
                            {["All", "Fantasy", "Action", "Romance", "Sci-Fi"].map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre)}
                                    className={`px-5 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all italic border ${selectedGenre === genre ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/5'}`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-white/5" />
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] rounded-2xl border border-white/5">
                            {["All", "Ongoing", "Completed"].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-5 py-2 text-[10px] uppercase tracking-widest font-black rounded-xl transition-all italic border ${selectedStatus === status ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/5'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
                    {loading ? (
                        <div className="py-24 text-center space-y-6">
                            <div className="relative w-12 h-12 mx-auto">
                                <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                                <div className="absolute inset-0 rounded-full border-2 border-t-[var(--reader-accent)] animate-spin" />
                            </div>
                            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.6em] font-black italic animate-pulse">Unrolling Scrolls...</p>
                        </div>
                    ) : searchTerm && results.length === 0 ? (
                        <div className="py-32 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-6xl opacity-10 grayscale group-hover:grayscale-0 transition-all">🕯️</div>
                            <div className="space-y-2">
                                <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[12px]">The Archive is Silent</p>
                                <p className="text-zinc-700 text-[10px] uppercase tracking-widest font-bold">No resonance found for "{searchTerm}"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((item, idx) => {
                                const itemHref = item.type === 'novel' 
                                    ? `/novel/${item.slug || item.id}`
                                    : item.type === 'story'
                                    ? `/stories/${item.alphanumericId || item.id}`
                                    : '/art';

                                return (
                                    <Link
                                        key={item.id}
                                        href={itemHref}
                                        onClick={onClose}
                                        className="flex items-center gap-6 p-4 hover:bg-white/[0.03] border border-transparent hover:border-white/5 rounded-[1.5rem] transition-all group relative overflow-hidden"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--reader-accent)]/0 to-[var(--reader-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="h-20 w-14 bg-zinc-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 shadow-2xl relative z-10">
                                            {(item.coverImage || item.imageUrl) ? (
                                                <img src={item.coverImage || item.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-800 font-black">📜</div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-black text-zinc-300 group-hover:text-white transition-colors uppercase italic tracking-tighter leading-none">
                                                    {item.title}
                                                </h4>
                                                {item.status && (
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-full border font-black uppercase tracking-widest ${
                                                        item.status === 'Completed' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-purple-500/20 text-purple-400 bg-purple-500/5'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold italic">
                                                    By <span className="text-zinc-400">{item.authorName || "Unknown Scribe"}</span>
                                                </p>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <p className="text-[9px] uppercase tracking-widest text-[var(--reader-accent)]/70 font-black italic">{item.type}</p>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black italic">{item.genre || item.category || "Mystery"}</p>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-accent)]"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </div>
                                    </Link>
                                );
                            })}
                            
                            {results.length > 0 && (
                                <Link
                                    href={`/search?q=${encodeURIComponent(searchTerm)}&genre=${selectedGenre}&status=${selectedStatus}`}
                                    onClick={onClose}
                                    className="flex items-center justify-center gap-3 p-6 mt-4 border-t border-white/5 text-[11px] uppercase tracking-[0.5em] font-black text-[var(--reader-accent)] hover:text-white transition-all group italic"
                                >
                                    Behold All {results.length >= 60 ? "60+" : results.length} Chronicles
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-2 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </Link>
                            )}
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="py-24 text-center space-y-10 animate-in fade-in duration-700">
                            <div className="space-y-4">
                                <div className="h-px w-16 bg-white/5 mx-auto" />
                                <p className="text-zinc-700 text-[11px] uppercase tracking-[0.5em] font-black italic">
                                    The Archives Await Your Inquiry
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4">
                                {["Epic Sagas", "Quick Echoes", "Visual Lore", "Hidden Tomes"].map(tag => (
                                    <span key={tag} className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 border border-white/5 px-6 py-2 rounded-full hover:border-white/10 hover:text-zinc-400 transition-colors cursor-default italic">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
