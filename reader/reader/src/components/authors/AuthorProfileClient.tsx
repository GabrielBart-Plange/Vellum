"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import StoryCard from "@/components/cards/StoryCard";
import ArtCard from "@/components/art/ArtCard";
import WalletCard from "@/components/monetization/WalletCard";
import { ArtPiece, LibraryData } from "@/types";
import { progressTracking } from "@/lib/progressTracking";

interface AuthorProfileClientProps {
  authorId: string;
  authorMetadata: any;
  xpProfile: any;
  initialStories: any[];
  initialNovels: any[];
  initialArt: ArtPiece[];
  initialFollowerCount: number;
}

export default function AuthorProfileClient({
  authorId,
  authorMetadata,
  xpProfile,
  initialStories,
  initialNovels,
  initialArt,
  initialFollowerCount
}: AuthorProfileClientProps) {
  const { user } = useAuth();
  const isOwner = user?.uid === authorId;
  const [activeTab, setActiveTab] = useState<any>("stories");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);

  useEffect(() => {
    const checkFollowAndLibrary = async () => {
      if (user) {
        try {
          // Check follow status
          const followDoc = await getDoc(doc(db, "users", user.uid, "following", authorId));
          setIsFollowing(followDoc.exists());

          // Load Library Data if owner
          if (isOwner) {
            const data = await progressTracking.getUserLibrary(authorId);
            setLibraryData(data);
          }
        } catch (error) {
          console.error("Error loading profile client data:", error);
        }
      }
    };
    checkFollowAndLibrary();
  }, [authorId, user, isOwner]);

  const handleFollow = async () => {
    if (!user || !authorId) return;
    try {
      const followerId = user.uid;
      await setDoc(doc(db, "users", followerId, "following", authorId), {
        authorId: authorId,
        followedAt: new Date()
      });
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

  const tabs = [
    { id: "stories", label: `Stories (${initialStories.length})` },
    { id: "novels", label: `Novels (${initialNovels.length})` },
    { id: "art", label: `Art (${initialArt.length})` },
    { id: "activity", label: "Activity" },
    ...(isOwner ? [
      { id: "collections", label: "Collections" },
      { id: "wallet", label: "Wallet" },
      { id: "saved_art", label: `Saved Art (${libraryData?.savedArt.length || 0})` },
      { id: "reposts", label: `Reposts (${libraryData?.repostedArt.length || 0})` },
    ] : [])
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 md:px-16 relative z-20 space-y-24 -mt-10">
      {/* Dynamic Identity & Actions (Passed through as props or handled here) */}
      <div className="flex flex-col items-center gap-8 -mt-20 mb-20 text-center">
        {!isOwner && (
          <button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            className={`px-16 py-5 text-[11px] font-black uppercase tracking-[0.4em] transition-all rounded-2xl italic ${isFollowing
              ? "bg-zinc-900 text-zinc-600 border border-white/5"
              : "bg-white text-black hover:scale-105 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
              }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-zinc-900/20 border border-white/5 p-12 rounded-[2.5rem] space-y-6 flex flex-col justify-center min-vh-[200px] relative overflow-hidden group hover:border-[var(--reader-accent)]/20 transition-all">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Novels</p>
          <p className="text-6xl font-black text-white italic tracking-tighter">{initialNovels.length}</p>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 p-12 rounded-[2.5rem] space-y-6 flex flex-col justify-center min-vh-[200px] relative overflow-hidden group hover:border-pink-500/20 transition-all">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Followers</p>
          <p className="text-6xl font-black text-white italic tracking-tighter">{followerCount}</p>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 p-12 rounded-[2.5rem] space-y-6 flex flex-col justify-center min-vh-[200px] relative overflow-hidden group hover:border-blue-500/20 transition-all">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">XP Level</p>
          <p className="text-6xl font-black text-white italic tracking-tighter">{xpProfile?.level || 0}</p>
        </div>
        <div className="bg-zinc-900/20 border border-white/5 p-12 rounded-[2.5rem] space-y-6 flex flex-col justify-center min-vh-[200px] relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black italic">Works</p>
          <p className="text-6xl font-black text-white italic tracking-tighter">{initialStories.length + initialNovels.length + initialArt.length}</p>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-1 space-y-12">
          <div className="space-y-6">
            <h2 className="text-[11px] uppercase tracking-[0.6em] text-zinc-500 font-black border-b border-white/5 pb-4">Synopsis</h2>
            <p className="text-zinc-400 leading-relaxed text-lg font-light italic">
              "{authorMetadata.bio}"
            </p>
          </div>
        </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {activeTab === "stories" && initialStories.map(s => <StoryCard key={s.id} {...s} hideAuthor={true} />)}
            {activeTab === "novels" && initialNovels.map(n => <StoryCard key={n.id} {...n} hideAuthor={true} type="novel" />)}
            {activeTab === "art" && initialArt.map(item => (
              <ArtCard
                key={item.id}
                art={item}
                isSavedInitially={libraryData?.savedArt?.some(a => a.id === item.id) || false}
                isRepostedInitially={libraryData?.repostedArt?.some(a => a.id === item.id) || false}
              />
            ))}
            {activeTab === "wallet" && <WalletCard />}
          </div>
        </div>
      </section>
    </div>
  );
}
