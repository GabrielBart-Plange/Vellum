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
                        username: data.username || "Unknown Author",
                        bio: data.bio || "",
                        avatarUrl: data.avatarUrl || "",
                        bannerUrl: data.bannerUrl || "",
                        joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "Jan 2026",
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

    const tabs = [
        { id: "stories", label: `Stories (${stories.length})` },
        { id: "novels", label: `Novels (${novels.length})` },
        { id: "art", label: `Art (${art.length})` },
    ];

    return (
        <main className="min-h-screen bg-black text-gray-200">
            {/* Banner Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden bg-zinc-900">
                {authorMetadata.bannerUrl ? (
                    <img
                        src={authorMetadata.bannerUrl}
                        className="w-full h-full object-cover opacity-60"
                        alt="Profile Banner"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-black opacity-30" />
                )}

                {/* Floating Avatar */}
                <div className="absolute -bottom-12 left-8 md:left-16">
                    <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-black bg-zinc-800 overflow-hidden">
                        {authorMetadata.avatarUrl ? (
                            <img src={authorMetadata.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <span className="text-4xl">?</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 md:px-16 pt-16 space-y-8">
                {/* Identity Header */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-light tracking-widest text-white uppercase">
                                {authorMetadata.username}
                            </h1>
                            <p className="text-gray-500 text-xs tracking-[0.2em] font-medium">
                                joined {authorMetadata.joinedDate}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-6 py-2 border border-white/10 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                                Follow
                            </button>
                            <button className="px-6 py-2 bg-indigo-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-indigo-700 transition-colors">
                                Tip
                            </button>
                        </div>
                    </div>

                    {authorMetadata.bio && (
                        <p className="text-gray-400 max-w-2xl leading-relaxed text-sm">
                            {authorMetadata.bio}
                        </p>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-white/5 flex gap-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-[10px] uppercase tracking-[0.3em] font-bold transition-all border-b-2 ${activeTab === tab.id
                                ? 'border-white text-white'
                                : 'border-transparent text-gray-600 hover:text-gray-400'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="py-8">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {activeTab === "stories" && (
                                stories.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {stories.map(story => (
                                            <StoryCard key={story.id} {...story} hideAuthor={true} />
                                        ))}
                                    </div>
                                ) : <p className="text-gray-600 italic">No short stories shared yet.</p>
                            )}

                            {activeTab === "novels" && (
                                novels.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {novels.map(novel => (
                                            <StoryCard key={novel.id} {...novel} hideAuthor={true} type="novel" />
                                        ))}
                                    </div>
                                ) : <p className="text-gray-600 italic">No long-form novels started yet.</p>
                            )}

                            {activeTab === "art" && (
                                art.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {art.map(item => (
                                            <div key={item.id} className="group bg-zinc-900 rounded-sm overflow-hidden border border-white/5 transition-all hover:border-white/20">
                                                <div className="aspect-[4/5] overflow-hidden grayscale-[0.3] group-hover:grayscale-0 transition-all">
                                                    <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={item.title} />
                                                </div>
                                                <div className="p-4 border-t border-white/5">
                                                    <h3 className="text-xs uppercase tracking-widest text-white">{item.title}</h3>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-gray-600 italic">No art pieces showcased yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
