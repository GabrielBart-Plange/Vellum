"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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

    // Context-aware search defaults
    useEffect(() => {
        if (isOpen) {
            // Check if we are on a genre page
            const genreMatch = pathname?.match(/\/genre\/([^/]+)/);
            if (genreMatch) {
                const genreSlug = genreMatch[1];
                // Simple mapping for common genres
                const genreMap: Record<string, string> = {
                    'fantasy': 'Fantasy',
                    'sci-fi': 'Sci-Fi',
                    'romance': 'Romance',
                    'action': 'Action',
                    'mystery': 'Mystery',
                    'horror': 'Horror'
                };
                if (genreMap[genreSlug]) {
                    setSelectedGenre(genreMap[genreSlug]);
                }
            } else {
                // Restore from session storage if not on a specific genre page
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
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
            // We don't clear the term/filters here anymore to allow "persistence"
        }
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
                // Fetch from multiple collections
                const collections = ["novels", "stories", "art"];
                const promises = collections.map(col =>
                    getDocs(query(collection(db, col), where("published", "==", true), limit(30)))
                        .catch(() => ({ docs: [] })) // Handle missing collections or permission issues
                );

                // Art collection doesn't have a 'published' field in its current schema, so we query it differently
                const [novelsSnap, storiesSnap, artSnap] = await Promise.all([
                    getDocs(query(collection(db, "novels"), where("published", "==", true), limit(30))),
                    getDocs(query(collection(db, "stories"), where("published", "==", true), limit(30))),
                    getDocs(query(collection(db, "art"), orderBy("createdAt", "desc"), limit(30)))
                ]);

                const novels = novelsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'novel' } as any));
                const stories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'story' } as any));
                const art = artSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'art' } as any));

                let hits = [...novels, ...stories, ...art];

                // Client-side filtering
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

                // Sort by most recent
                hits.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                setResults(hits);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(search, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [searchTerm, selectedGenre, selectedStatus]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-[#0b0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[70vh]">
                <div className="p-4 border-b border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 ml-2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            className="flex-1 bg-transparent border-none text-lg text-white placeholder-zinc-700 focus:outline-none italic"
                            placeholder="Search for titles, authors, or themes..."
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

                    <div className="flex flex-wrap items-center gap-2 pl-2">
                        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
                            {["All", "Fantasy", "Action", "Romance", "Sci-Fi"].map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre)}
                                    className={`px-3 py-1 text-[9px] uppercase tracking-widest font-black rounded-md transition-all italic ${selectedGenre === genre ? 'bg-[var(--reader-accent)]/20 text-[var(--reader-accent)] border border-[var(--reader-accent)]/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                        <div className="h-4 w-px bg-white/10 mx-1" />
                        <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-lg border border-white/5">
                            {["All", "Ongoing", "Completed"].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-3 py-1 text-[9px] uppercase tracking-widest font-black rounded-md transition-all ${selectedStatus === status ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="p-12 text-center text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black animate-pulse flex flex-col items-center gap-4 italic">
                            <div className="w-8 h-8 rounded-full border-2 border-t-[var(--reader-accent)] border-white/5 animate-spin" />
                            Searching Library...
                        </div>
                    ) : searchTerm && results.length === 0 ? (
                        <div className="p-16 text-center space-y-4">
                            <div className="text-4xl opacity-20">🕯️</div>
                            <p className="text-zinc-500 italic font-black uppercase tracking-widest text-[10px]">
                                No results found
                            </p>
                            <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] font-bold">
                                The Library is silent on '{searchTerm}'
                            </p>
                        </div>
                    ) : (
                                <div className="space-y-1">
                                    {results.map(item => (
                                        <Link
                                            key={item.id}
                                            href={item.type === 'art' ? `/art` : `/${item.type}s/${item.id}`}
                                            onClick={onClose}
                                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group"
                                        >
                                            <div className="h-12 w-8 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                                {(item.coverImage || item.imageUrl) ? (
                                                    <img src={item.coverImage || item.imageUrl} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-600">NO IMG</div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    {item.status && (
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md border font-black uppercase tracking-tighter ${
                                                            item.status === 'Completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-purple-500/30 text-purple-400 bg-purple-500/5'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-black italic">
                                                    by {item.authorName || "Unknown Author"} • <span className="text-[var(--reader-accent)]/80">{item.type}</span> • {item.genre || item.category || "General"}
                                                </p>
                                            </div>
                                            {item.type === 'art' && (
                                                <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] uppercase font-black text-zinc-500">
                                                    Visual
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                    
                                    {results.length > 0 && (
                                        <Link
                                            href={`/search?q=${encodeURIComponent(searchTerm)}&genre=${selectedGenre}&status=${selectedStatus}`}
                                            onClick={onClose}
                                            className="flex items-center justify-center gap-2 p-4 mt-2 border-t border-white/5 text-[10px] uppercase tracking-[0.3em] font-black text-[var(--reader-accent)] hover:text-white transition-colors group"
                                        >
                                            View all {results.length >= 30 ? "30+" : results.length} results
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </Link>
                                    )}
                                </div>
                    )}

                    {!searchTerm && (
                        <div className="p-16 text-center space-y-6">
                            <div className="h-px w-12 bg-white/10 mx-auto" />
                            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-black italic">
                                Search for a title, author, or genre...
                            </p>
                            <div className="flex flex-wrap justify-center gap-3 opacity-40">
                                <span className="text-[8px] uppercase tracking-widest text-zinc-500 border border-white/10 px-3 py-1 rounded-full">Epic Novels</span>
                                <span className="text-[8px] uppercase tracking-widest text-zinc-500 border border-white/10 px-3 py-1 rounded-full">Short Stories</span>
                                <span className="text-[8px] uppercase tracking-widest text-zinc-500 border border-white/10 px-3 py-1 rounded-full">Visual Art</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
