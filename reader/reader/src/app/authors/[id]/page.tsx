"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import StoryCard from "@/components/cards/StoryCard";

export default function AuthorPage() {
    // Note: Next.js 15+ needs params awaited if it's a page prop, 
    // but useParams() in client components is still synchronous for now or handled by React.
    const { id: authorId } = useParams<{ id: string }>();
    const [stories, setStories] = useState<any[]>([]);
    const [novels, setNovels] = useState<any[]>([]);
    const [art, setArt] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"stories" | "novels" | "art">("stories");

    // Author Identity
    const [authorMetadata, setAuthorMetadata] = useState({
        username: "Unknown Author",
        bio: "",
        avatarUrl: "",
        bannerUrl: "",
        joinedDate: "",
    });

    useEffect(() => {
        const load = async () => {
            if (!authorId) return;
            try {
                // 1. Fetch Author Metadata
                const userRef = doc(db, "users", authorId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setAuthorMetadata({
                        username: data.username || data.displayName || "Unknown Author",
                        avatarUrl: data.avatarUrl,
                        bannerUrl: data.bannerUrl,
                        bio: data.bio || "This author has not yet unrolled their scroll of biography.",
                        joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "06/01/2026",
                    });
                }

                // 2. Fetch Stories
                const qStories = query(
                    collection(db, "stories"),
                    where("authorId", "==", authorId),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc")
                );
                const storiesSnap = await getDocs(qStories);
                setStories(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 3. Fetch Novels
                const qNovels = query(
                    collection(db, "novels"),
                    where("authorId", "==", authorId),
                    where("published", "==", true),
                    orderBy("publishedAt", "desc")
                );
                const novelsSnap = await getDocs(qNovels);
                setNovels(novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // 4. Fetch Art
                const qArt = query(
                    collection(db, "art"),
                    where("authorId", "==", authorId),
                    orderBy("createdAt", "desc")
                );
                const artSnap = await getDocs(qArt);
                setArt(artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            } catch (error) {
                console.error("Error fetching author profile:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [authorId]);

    // Aggregated Stats
    const totalLikes = [...stories, ...novels].reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalViews = [...stories, ...novels].reduce((acc, curr) => acc + (curr.views || 0), 0);

    const tabs = [
        { id: "stories", label: `Stories (${stories.length})` },
        { id: "novels", label: `Novels (${novels.length})` },
        { id: "art", label: `Art (${art.length})` },
    ];

    return (
        <main className="min-h-screen bg-black text-zinc-100 font-sans pb-40">
            {/* Immersive Author Hero */}
            <div className="relative h-[65vh] md:h-[75vh] w-full overflow-hidden flex items-center justify-center">
                {authorMetadata.bannerUrl ? (
                    <img
                        src={authorMetadata.bannerUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 blur-[2px]"
                        alt="Profile Banner"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0b0a0f] via-purple-900/10 to-transparent" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* mesh-gradient style effect */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full" />

                {/* Identity Center */}
                <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto px-8 py-20">
                    <div className="inline-block relative">
                        <div className="h-32 w-32 md:h-44 md:w-44 rounded-full border-2 border-white/10 bg-zinc-900 overflow-hidden mx-auto shadow-[0_0_50px_-10px_rgba(139,92,246,0.3)]">
                            {authorMetadata.avatarUrl ? (
                                <img src={authorMetadata.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800 font-black text-6xl">
                                    ?
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[var(--accent-lime)] text-black rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-lg border-2 border-black">
                            LV. 9
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-4 py-1.5 rounded-full border border-white/10 glass text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-black">
                                Archivist
                            </span>
                            <span className="px-4 py-1.5 rounded-full border border-[var(--accent-sakura)]/20 bg-[var(--accent-sakura)]/5 text-[10px] uppercase tracking-[0.4em] text-[var(--accent-sakura)] font-black">
                                Verified
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-none pb-2">
                            {authorMetadata.username}
                        </h1>
                        <p className="text-zinc-500 text-[11px] uppercase tracking-[0.8em] font-black">
                            Joined {authorMetadata.joinedDate}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 pt-4 pb-12">
                        <button className="px-10 py-4 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl">
                            Follow
                        </button>
                        <button className="px-10 py-4 rounded-2xl border border-white/10 glass-panel text-white text-[12px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all">
                            Donate
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 md:px-16 relative z-20 space-y-24">
                {/* Stats Grid - Inspired by premium profiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass border border-white/5 p-8 rounded-3xl space-y-2 group hover:border-white/10 transition-all">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black group-hover:text-zinc-400 transition-colors">Total Books</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-white">{novels.length + stories.length}</p>
                        </div>
                    </div>
                    <div className="glass border border-white/5 p-8 rounded-3xl space-y-2 group hover:border-white/10 transition-all">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black group-hover:text-zinc-400 transition-colors">Total Likes</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-white">{totalLikes.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="glass border border-white/5 p-8 rounded-3xl space-y-2 group hover:border-white/10 transition-all">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black group-hover:text-zinc-400 transition-colors">Total Views</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-white">{totalViews.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="glass border border-white/5 p-8 rounded-3xl space-y-2 group hover:border-white/10 transition-all">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black group-hover:text-zinc-400 transition-colors">Creations</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-black text-white">{novels.length}</p>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-600 pb-1 font-black">Units</span>
                        </div>
                    </div>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                    {/* Bio/About */}
                    <div className="lg:col-span-1 space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 font-black border-b border-white/5 pb-4">Synopsis</h2>
                            <p className="text-zinc-400 leading-relaxed text-lg font-light italic">
                                "{authorMetadata.bio || "The archives are currently being unrolled for this chronicle. Check back soon for the full synopsis."}"
                            </p>
                        </div>

                        <div className="space-y-8 glass p-8 rounded-3xl border border-white/5">
                            <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">Archive Stats</h2>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500 font-black tracking-widest uppercase">Reputation</span>
                                    <span className="text-white font-black">94% Positive</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[94%] h-full bg-[var(--accent-lime)]" />
                                </div>
                                <div className="flex justify-between items-center text-xs pt-2">
                                    <span className="text-zinc-500 font-black tracking-widest uppercase">Consistency</span>
                                    <span className="text-white font-black">High</span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="w-[80%] h-full bg-purple-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Creations Feed */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex gap-8">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`pb-4 text-[11px] uppercase tracking-[0.4em] font-black transition-all border-b-2 ${activeTab === tab.id
                                            ? 'border-white text-white'
                                            : 'border-transparent text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        {tab.id.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {activeTab === "stories" && stories.map(s => <StoryCard key={s.id} {...s} hideAuthor={true} />)}
                            {activeTab === "novels" && novels.map(n => <StoryCard key={n.id} {...n} hideAuthor={true} type="novel" />)}
                            {activeTab === "art" && art.map(item => (
                                <div key={item.id} className="group glass rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all">
                                    <img src={item.imageUrl} className="w-full aspect-square object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
                                    <div className="p-6">
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-500">{item.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
