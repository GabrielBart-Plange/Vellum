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
                <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">The Archives</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">ART GALLERY</h1>
                    <p className="text-[var(--reader-text-muted)] max-w-2xl text-sm leading-relaxed">A collection of visual works from across the realms.</p>
                </header>

                <DiscoveryFilter
                    categories={["Character", "Landscape", "Concept", "Illustration"]}
                    onSearch={setSearchTerm}
                    onCategoryChange={setSelectedCategory}
                    placeholder="Search characters, realms, or artists..."
                />

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-[4/5] glass-panel rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredArt.length === 0 ? (
                    <div className="py-24 text-center glass-panel border-dashed border-white/5 rounded-3xl">
                        <p className="text-zinc-500 italic tracking-wide">
                            {searchTerm || selectedCategory !== "All"
                                ? "No visions match your current search criteria."
                                : '"The gallery sits in silence."'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
