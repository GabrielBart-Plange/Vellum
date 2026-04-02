"use client";

import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ArtPiece } from "@/types";
import ArtCard from "@/components/art/ArtCard";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";
import DiscoveryFilter from "@/components/layout/DiscoveryFilter";

export default function ArtGalleryPage() {
    const [art, setArt] = useState<ArtPiece[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [userLibrary, setUserLibrary] = useState<{ savedArt: { id: string }[]; repostedArt: { id: string }[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const loadArt = async () => {
            try {
                const q = query(collection(db, "art"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setArt(snap.docs.map(d => ({ id: d.id, ...d.data() } as ArtPiece)));

                if (user) {
                    const library = await progressTracking.getUserLibrary(user.uid);
                    setUserLibrary(library);
                }
            } catch (error) {
                console.error("Error fetching art:", error);
            } finally {
                setLoading(false);
            }
        };

        loadArt();
    }, [user]);

    const filteredArt = art.filter(item => {
        const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.authorName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory || (item.tags && item.tags.includes(selectedCategory));
        return matchesSearch && matchesCategory;
    });

    return (
        <main className="min-h-screen text-[var(--reader-text)] pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Art Gallery</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">VISUAL <br />ARCHIVES</h1>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-sm leading-relaxed italic">A collection of visual works captured from across the shifting realms.</p>
                </header>

                <DiscoveryFilter
                    categories={["Character", "Landscape", "Concept", "Illustration"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[4/5] glass-panel rounded-[2rem] border border-white/5 animate-pulse-slow" />
                        ))}
                    </div>
                ) : filteredArt.length === 0 ? (
                    <div className="col-span-full py-32 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 bg-white/[0.01]">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="text-4xl opacity-20 grayscale">🎨</div>
                            <div className="space-y-2">
                                <p className="text-zinc-500 italic font-black uppercase tracking-[0.4em] text-[10px]">
                                    No visions match your search
                                </p>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold">
                                    {searchTerm || selectedCategory !== "All"
                                        ? "Perhaps try a different whisper in the Library?"
                                        : "The gallery sits in silence. The next masterpiece is currently being etched in the stars..."}
                                </p>
                            </div>
                            <button 
                                onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
                                className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all italic"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {filteredArt.map((item) => (
                            <ArtCard
                                key={item.id}
                                art={item}
                                isSavedInitially={userLibrary?.savedArt.some((a: { id: string }) => a.id === item.id)}
                                isRepostedInitially={userLibrary?.repostedArt.some((a: { id: string }) => a.id === item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
