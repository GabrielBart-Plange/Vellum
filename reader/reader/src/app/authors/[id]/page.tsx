"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useParams } from "next/navigation";
import StoryCard from "@/components/cards/StoryCard";
import Link from "next/link";
import Image from "next/image";
import { ArtPiece, LibraryData } from "@/types";
import { progressTracking } from "@/lib/progressTracking";
import ArtCard from "@/components/art/ArtCard";
import { useAuth } from "@/contexts/AuthContext";
import WalletCard from "@/components/monetization/WalletCard";

export default function UserPage() {
    const { id: authorId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [stories, setStories] = useState<any[]>([]);
    const [novels, setNovels] = useState<any[]>([]);
    const [art, setArt] = useState<ArtPiece[]>([]);
    const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"stories" | "novels" | "art" | "collections" | "saved_art" | "reposts" | "progress" | "wallet">("stories");

    const isOwner = user?.uid === authorId;

    // User Identity
    const [authorMetadata, setAuthorMetadata] = useState({
        username: "Unknown User",
        bio: "",
        avatarUrl: "",
        bannerUrl: "",
        joinedDate: "",
        supportLink: "",
    });

    // Follow System
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            if (!authorId) return;
            try {
                // 1. Fetch User Metadata
                const userRef = doc(db, "users", authorId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setAuthorMetadata({
                        username: data.username || data.displayName || "Unknown User",
                        avatarUrl: data.avatarUrl,
                        bannerUrl: data.bannerUrl,
                        bio: data.bio || "This user has not yet unrolled their scroll of biography.",
                        joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "06/01/2026",
                        supportLink: data.supportLink || "",
                    });
                }

                // Check Follow Status & Count
                const followersRef = collection(db, "users", authorId, "followers");
                const followersSnap = await getDocs(followersRef);
                setFollowerCount(followersSnap.size);

                if (user) {
                    const followDoc = await getDoc(doc(db, "users", user.uid, "following", authorId));
                    setIsFollowing(followDoc.exists());
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
                setArt(artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtPiece)));

                // 5. Fetch Library Data if owner
                if (isOwner) {
                    const data = await progressTracking.getUserLibrary(authorId);
                    setLibraryData(data);
                }

            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [authorId, isOwner]);

    const handleFollow = async () => {
        if (!user || !authorId) return;
        try {
            const followerId = user.uid;
            // Add to my following
            await setDoc(doc(db, "users", followerId, "following", authorId), {
                authorId: authorId,
                followedAt: new Date()
            });
            // Add to author's followers
            await setDoc(doc(db, "users", authorId, "followers", followerId), {
                userId: followerId,
                followedAt: new Date()
            });
            setIsFollowing(true);
            setFollowerCount(prev => prev + 1);
        } catch (error) {
            console.error("Error following:", error);
        }
    };

    const handleUnfollow = async () => {
        if (!user || !authorId) return;
        try {
            const followerId = user.uid;
            await deleteDoc(doc(db, "users", followerId, "following", authorId));
            await deleteDoc(doc(db, "users", authorId, "followers", followerId));
            setIsFollowing(false);
            setFollowerCount(prev => prev - 1);
        } catch (error) {
            console.error("Error unfollowing:", error);
        }
    };

    // Aggregated Stats
    const totalLikes = [...stories, ...novels].reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalViews = [...stories, ...novels].reduce((acc, curr) => acc + (curr.views || 0), 0);

    const tabs = [
        { id: "stories", label: `Stories (${stories.length})` },
        { id: "novels", label: `Novels (${novels.length})` },
        { id: "art", label: `Art (${art.length})` },
        ...(isOwner ? [
            { id: "collections", label: "Collections" },
            { id: "wallet", label: "Wallet" },
            { id: "saved_art", label: `Saved Art (${libraryData?.savedArt.length || 0})` },
            { id: "reposts", label: `Reposts (${libraryData?.repostedArt.length || 0})` },
        ] : [])
    ];


    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-700 font-black tracking-[0.5em] uppercase text-xs">
            Summoning...
        </div>
    );

    return (
        <main className="min-h-screen text-[var(--reader-text)] font-sans pb-40">
            {/* Hero Section */}
            <div className="relative min-h-[600px] w-full flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl px-6 text-center">
                    {/* Avatar with Level Badge and Edit Button */}
                    <div className="relative group/avatar">
                        <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
                            {authorMetadata.avatarUrl ? (
                                <Image
                                    src={authorMetadata.avatarUrl}
                                    alt={authorMetadata.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black text-6xl">
                                    {authorMetadata.username.charAt(0)}
                                </div>
                            )}

                            {isOwner && (
                                <Link
                                    href="/settings"
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        {/* Level Badge */}
                        <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[#5a7d00] border-2 border-black px-4 py-1 rounded-full shadow-lg">
                            <span className="text-[10px] md:text-xs font-black text-white italic tracking-tighter">LV. 9</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-4">
                        <span className="px-8 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-[9px] uppercase tracking-[0.4em] font-black text-zinc-500">Archivist</span>
                        <span className="px-8 py-2.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] uppercase tracking-[0.4em] font-black text-purple-400">Verified</span>
                    </div>

                    {/* Identity */}
                    <div className="space-y-4 max-w-full overflow-hidden">
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-none break-words">
                            {authorMetadata.username}
                        </h1>
                        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-zinc-600 font-bold">
                            Joined {authorMetadata.joinedDate} &nbsp; • &nbsp; {followerCount} Followers
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-8 mt-6 w-full">
                        {!isOwner && (
                            <button
                                onClick={isFollowing ? handleUnfollow : handleFollow}
                                className={`px-12 py-4 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl ${isFollowing
                                    ? "bg-zinc-900 text-zinc-500 border border-white/10"
                                    : "bg-white text-black hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)]"
                                    }`}
                            >
                                {isFollowing ? "Joined" : "Join Circle"}
                            </button>
                        )}


                        <button
                            onClick={() => {
                                if (authorMetadata.supportLink) {
                                    window.open(authorMetadata.supportLink, '_blank', 'noopener,noreferrer');
                                } else {
                                    alert("This archivist hasn't unrolled their support scroll yet.");
                                }
                            }}
                            className={`px-16 py-5 border text-[11px] font-black uppercase tracking-[0.5em] transition-all rounded-3xl w-full max-w-[320px] shadow-2xl ${authorMetadata.supportLink
                                ? "bg-white text-black hover:scale-105"
                                : "bg-zinc-950 border-white/5 text-zinc-700 cursor-not-allowed"
                                }`}
                        >
                            {authorMetadata.supportLink ? "Support Archivist" : "Support Locked"}
                        </button>

                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 md:px-16 relative z-20 space-y-24 -mt-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-zinc-900/20 border border-white/5 p-10 rounded-3xl space-y-5 flex flex-col justify-center min-h-[160px]">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Total Books</p>
                        <p className="text-5xl font-black text-white">{novels.length}</p>
                    </div>
                    <div className="bg-zinc-900/20 border border-white/5 p-10 rounded-3xl space-y-5 flex flex-col justify-center min-h-[160px]">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Total Likes</p>
                        <p className="text-5xl font-black text-white">{totalLikes.toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900/20 border border-white/5 p-10 rounded-3xl space-y-5 flex flex-col justify-center min-h-[160px]">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Total Views</p>
                        <p className="text-5xl font-black text-white">{totalViews.toLocaleString()}</p>
                    </div>
                    <div className="bg-zinc-900/20 border border-white/5 p-10 rounded-3xl space-y-5 flex flex-col justify-center min-h-[160px]">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-black">Creations</p>
                        <p className="text-5xl font-black text-white">{stories.length + novels.length + art.length}</p>
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
                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`pb-4 text-[11px] uppercase tracking-[0.4em] font-black transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-white text-white'
                                            : 'border-transparent text-zinc-600 hover:text-zinc-400'
                                            }`}
                                    >
                                        {tab.label.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                            {activeTab === "stories" && stories.map(s => <StoryCard key={s.id} {...s} hideAuthor={true} />)}
                            {activeTab === "novels" && novels.map(n => <StoryCard key={n.id} {...n} hideAuthor={true} type="novel" />)}
                            {activeTab === "art" && art.map(item => (
                                <ArtCard
                                    key={item.id}
                                    art={item}
                                    isSavedInitially={libraryData?.savedArt?.some(a => a.id === item.id) || false}
                                    isRepostedInitially={libraryData?.repostedArt?.some(a => a.id === item.id) || false}
                                />
                            ))}

                            {activeTab === "wallet" && (
                                <div className="col-span-full max-w-2xl mx-auto w-full">
                                    <h3 className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-8">Essence Management</h3>
                                    <WalletCard />
                                </div>
                            )}

                            {activeTab === "collections" && libraryData && (

                                <div className="col-span-full space-y-12">
                                    {libraryData.likedStories.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Liked Stories</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {libraryData.likedStories.map(s => <StoryCard key={s.id} {...s} />)}
                                            </div>
                                        </div>
                                    )}
                                    {libraryData.savedNovels.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Saved Novels</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {libraryData.savedNovels.map(n => <StoryCard key={n.id} {...n} type="novel" />)}
                                            </div>
                                        </div>
                                    )}
                                    {libraryData.novelsInProgress.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">In Progress</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                                {/* Mapping for reading progress would go here, simplified for now */}
                                                {libraryData.novelsInProgress.map(n => (
                                                    <Link key={n.id} href={`/novels/${n.id}/chapter/${n.currentChapterId}`} className="glass-panel p-6 rounded-2xl flex gap-4 hover:border-white/20 transition-all">
                                                        <div className="w-16 h-20 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img src={n.coverImage} className="w-full h-full object-cover opacity-60" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white text-sm font-bold truncate">{n.title}</h4>
                                                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">{n.progressPercentage}% Complete</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "saved_art" && libraryData?.savedArt.map(item => (
                                <ArtCard key={item.id} art={item} isSavedInitially={true} />
                            ))}

                            {activeTab === "reposts" && libraryData?.repostedArt.map(item => (
                                <ArtCard key={item.id} art={item} isRepostedInitially={true} />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main >
    );
}
