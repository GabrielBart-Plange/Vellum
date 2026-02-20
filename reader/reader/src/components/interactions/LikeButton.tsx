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
      const likePath = getLikePath();
      const parentPath = getParentPath();

      if (liked) {
        // Unlike
        await deleteDoc(doc(db, likePath));
        await updateDoc(doc(db, parentPath), {
          likes: increment(-1)
        });
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        await setDoc(doc(db, likePath), {
          userId: user.uid,
          likedAt: new Date()
        });
        await updateDoc(doc(db, parentPath), {
          likes: increment(1)
        });
        setLiked(true);
        setLikeCount(prev => prev + 1);

        // Add to library if it's a story or novel (not chapter)
        if (contentType === 'story') {
          await addToLibrary();
        }
      }
    } catch (error) {
      console.error("Error handling like:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async () => {
    if (!user) return;

    try {
      const contentRef = doc(db, "stories", contentId);
      const contentSnap = await getDoc(contentRef);

      if (!contentSnap.exists()) return;

      const data = contentSnap.data();
      await setDoc(doc(db, "users", user.uid, "likedStories", contentId), {
        title: data.title || "Untitled",
        coverImage: data.coverImage || data.imageUrl || "",
        authorName: data.authorName || "Unknown Author",
        likedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error("Error adding to library:", error);
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
