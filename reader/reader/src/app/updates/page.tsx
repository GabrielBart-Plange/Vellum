"use client";

import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, where, limit, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Zap, Clock, ChevronLeft, BookOpen, User, Search } from "lucide-react";

interface PulseChapter {
    id: string;
    title: string;
    order: number;
    publishedAt: Timestamp;
    novelId: string;
    novelTitle?: string;
    authorName?: string;
    coverImage?: string;
    slug?: string;
}

export default function UpdatesPage() {
    const [chapters, setChapters] = useState<PulseChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const loadPulse = async () => {
            try {
                // Collection Group Query for latest chapters across all novels
                const q = query(
                    collectionGroup(db, "chapters"),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc"),
                    limit(20)
                );

                const snap = await getDocs(q);
                const results: PulseChapter[] = [];
                const novelCache: Record<string, any> = {};

                for (const docSnap of snap.docs) {
                    const data = docSnap.data();
                    let novelTitle = data.novelTitle;
                    let authorName = data.authorName;
                    let coverImage = data.coverImage;

                    // Fallback for missing denormalized data
                    if ((!novelTitle || !authorName) && data.novelId) {
                        if (novelCache[data.novelId]) {
                            novelTitle = novelTitle || novelCache[data.novelId].title;
                            authorName = authorName || novelCache[data.novelId].authorName;
                            coverImage = coverImage || novelCache[data.novelId].coverImage;
                        } else {
                            const novelRef = doc(db, "novels", data.novelId);
                            const novelSnap = await getDoc(novelRef);
                            if (novelSnap.exists()) {
                                const nData = novelSnap.data();
                                novelCache[data.novelId] = nData;
                                novelTitle = novelTitle || nData.title;
                                authorName = authorName || nData.authorName;
                                coverImage = coverImage || nData.coverImage;
                            }
                        }
                    }

                    results.push({
                        id: docSnap.id,
                        title: data.title,
                        order: data.order,
                        publishedAt: data.publishedAt,
                        novelId: data.novelId,
                        novelTitle: novelTitle || "Unknown Chronicle",
                        authorName: authorName || "Unknown Author",
                        coverImage: coverImage,
                        slug: data.slug
                    });
                }

                setChapters(results);
            } catch (error) {
                console.error("Failed to fetch updates:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPulse();
    }, []);

    const filteredChapters = chapters.filter(chapter => 
        chapter.novelTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-[#0b0a0f] pt-40 pb-24 px-8">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="space-y-6 border-l-2 border-purple-500/30 pl-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Live Feed</p>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-[0.8]">CHRONICLE<br />UPDATES</h1>
                        </div>
                        <Link 
                            href="/" 
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </Link>
                    </div>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-[11px] uppercase tracking-[0.2em] font-black italic">
                        Real-time synchronization with the latest archival expansions across the collective consciousness.
                    </p>
                </header>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search size={16} className="text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search updates by novel, unit title, or author..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/40 border border-white/5 rounded-full py-4 pl-14 pr-6 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/30 focus:bg-zinc-900/60 transition-all uppercase tracking-widest font-bold"
                    />
                </div>

                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-6 p-6 rounded-[2rem] bg-white/5 border border-white/5">
                                <div className="h-24 w-16 rounded-xl bg-white/5 flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/4 rounded bg-white/5" />
                                    <div className="h-6 w-3/4 rounded bg-white/5" />
                                    <div className="h-3 w-1/3 rounded bg-white/5" />
                                </div>
                            </div>
                        ))
                    ) : filteredChapters.length > 0 ? (
                        filteredChapters.map((chapter) => (
                            <Link 
                                key={`${chapter.novelId}-${chapter.id}`}
                                href={`/chapter/${chapter.novelId}-${chapter.order}`}
                                className="group flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all"
                            >
                                {/* Cover Image */}
                                <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl border border-white/5 mx-auto md:mx-0">
                                    <img 
                                        src={chapter.coverImage || "https://placehold.co/200x300/1a1a1a/666666?text=Vellum"} 
                                        alt={chapter.novelTitle}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 space-y-2 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 italic">
                                            {chapter.novelTitle}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-white/10 hidden md:block" />
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Clock size={10} />
                                            {chapter.publishedAt ? new Date(chapter.publishedAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just Now"}
                                        </span>
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight group-hover:text-purple-400 transition-colors">
                                        {chapter.title || `Unit ${chapter.order + 1}`}
                                    </h3>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <User size={10} className="text-zinc-600" />
                                            {chapter.authorName}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <BookOpen size={10} className="text-zinc-600" />
                                            Unit {chapter.order + 1}
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex justify-center md:justify-end pr-4">
                                    <div className="px-6 py-2 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white group-hover:border-white/20 transition-all italic">
                                        Synchronize
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-32 text-center glass-panel rounded-[3rem] border-dashed border-white/10 bg-white/[0.01]">
                            <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                {searchTerm ? "No matching updates found" : "Transmission Quiet"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
