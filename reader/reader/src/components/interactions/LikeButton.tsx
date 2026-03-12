"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  increment,
  updateDoc,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { progressTracking } from "@/lib/progressTracking";

interface LikeButtonProps {
  contentType: 'story' | 'novel' | 'chapter';
  contentId: string;
  novelId?: string; // Required for chapters
  initialLikeCount: number;
}

export default function LikeButton({
  contentType,
  contentId,
  novelId,
  initialLikeCount
}: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  // Sync like count with parent updates (real-time)
  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  // Determine the Firestore path based on content type
  const getLikePath = () => {
    if (contentType === 'chapter' && novelId) {
      return `novels/${novelId}/chapters/${contentId}/likes/${user?.uid}`;
    } else if (contentType === 'novel') {
      return `novels/${contentId}/likes/${user?.uid}`;
    } else {
      return `stories/${contentId}/likes/${user?.uid}`;
    }
  };

  const getParentPath = () => {
    if (contentType === 'chapter' && novelId) {
      return `novels/${novelId}/chapters/${contentId}`;
    } else if (contentType === 'novel') {
      return `novels/${contentId}`;
    } else {
      return `stories/${contentId}`;
    }
  };

  // Check if user has already liked this content
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return;

      try {
        const likeDoc = await getDoc(doc(db, getLikePath()));
        setLiked(likeDoc.exists());
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [user, contentId, novelId, contentType]);

  const handleLike = async () => {
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);

    try {
      // Fetch authorId from content if available, or pass it from parent if we had it
      // For now, let's assume we can get it or it's passed.
      // Ideally props should include authorId to avoid an extra fetch here.

      // Let's do a quick fetch of the document to get authorId and title if not provided
      const parentRef = doc(db, getParentPath());
      const parentSnap = await getDoc(parentRef);
      const data = parentSnap.data();
      const authorId = data?.authorId || data?.creatorId;
      const title = data?.title || "Untitled";

      if (liked) {
        await progressTracking.unlikeContent(user.uid, contentId, contentType, authorId);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await progressTracking.likeContent(
          user.uid,
          user.displayName || "Someone",
          contentId,
          contentType,
          title,
          authorId
        );
        setLiked(true);
        setLikeCount(prev => prev + 1);

        // If it's a story, we traditionally add to likedStories collection too
        // (This is handled inside likeContent now if we want, or we keep it explicit)
        // Actually, let's look at what likeContent does. I should update it to also handle the library addition for stories.
      }
    } catch (error) {
      console.error("Error handling like:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 glass-panel px-4 py-2 rounded-2xl">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`transition-all ${liked ? 'text-pink-500 scale-110' : 'text-zinc-500 hover:text-pink-400'} disabled:opacity-50`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={liked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      </button>
      <span className="text-xs font-bold text-zinc-400">{likeCount}</span>
    </div>
  );
}
