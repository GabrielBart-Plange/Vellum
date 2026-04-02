"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  increment,
  updateDoc,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Comment as CommentType } from "@/types";
import { getXPProfile, getLevelFromXP } from "@/lib/monetization/xpService";

interface CommentSectionProps {
  contentType: 'story' | 'chapter';
  contentId: string;
  novelId?: string; // Required for chapters
  initialCommentCount: number;
}

export default function CommentSection({
  contentType,
  contentId,
  novelId,
  initialCommentCount
}: CommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  // We use comments.length for the count to ensure accuracy with what's shown
  // but if comments aren't loaded yet, we can fall back to initialCommentCount if needed.
  // actually, let's just rely on real-time comments.length.

  // Determine the Firestore path based on content type
  const getCommentsPath = () => {
    if (contentType === 'chapter' && novelId) {
      return `novels/${novelId}/chapters/${contentId}/comments`;
    } else {
      return `stories/${contentId}/comments`;
    }
  };

  const getParentPath = () => {
    if (contentType === 'chapter' && novelId) {
      return `novels/${novelId}/chapters/${contentId}`;
    } else {
      return `stories/${contentId}`;
    }
  };

  // Fetch comments real-time
  useEffect(() => {
    let unsubscribe: () => void;

    const setupListener = async () => {
      try {
        const commentsRef = collection(db, getCommentsPath());
        const q = query(commentsRef, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as CommentType[];
          setComments(commentsData);
        }, (error) => {
          console.error("Error listening to comments:", error);
        });

      } catch (error) {
        console.error("Error setting up comments listener:", error);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [contentId, novelId, contentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const xpProfile = await getXPProfile(user.uid);
      const userLevel = xpProfile.level;

      const commentsRef = collection(db, getCommentsPath());
      const commentData = {
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || "Anonymous",
        userLevel: userLevel,
        text: newComment.trim(),
        createdAt: Timestamp.now()
      };

      await addDoc(commentsRef, commentData);

      // Update comment count on parent document
      await updateDoc(doc(db, getParentPath()), {
        commentCount: increment(1)
      });

      // No need to update local state manually, onSnapshot handles it
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, getCommentsPath(), commentId));

      // Update comment count on parent document
      await updateDoc(doc(db, getParentPath()), {
        commentCount: increment(-1)
      });

      // No need to update local state manually, onSnapshot handles it
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const toDate = (value: { seconds?: number; toDate?: () => Date } | Date | string | number | unknown): Date => {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    const obj = value as { seconds?: number; toDate?: () => Date };
    if (obj && typeof obj === 'object') {
      if (typeof obj.toDate === "function") return obj.toDate();
      if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
    }
    return new Date(value as string | number);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="glass-panel rounded-3xl border border-white/5 p-8 mt-12">
      <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3 italic uppercase tracking-widest">
        <div className="w-1.5 h-6 bg-[var(--reader-accent)] rounded-full" />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Inscribe your thoughts into the archives..."
                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[var(--reader-accent)]/50 transition-all text-white placeholder:text-zinc-600 resize-none italic"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="self-start px-8 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--reader-accent)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-10 rounded-3xl bg-zinc-900/30 border border-white/5 text-center space-y-4">
          <p className="text-zinc-400 text-[11px] uppercase tracking-[0.3em] font-black italic">
            Your voice is missing from the scroll
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            Sign In to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-20 glass-panel border-dashed border-white/10 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-[0.4em] font-black italic">The archives are silent</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Be the first to leave a mark on this chronicle</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group border-b border-white/5 pb-10 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-black shadow-inner overflow-hidden">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} 
                        alt={comment.username}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-white text-[13px] uppercase tracking-widest">{comment.username}</p>
                      {comment.userLevel !== undefined && (
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-[var(--reader-accent)]/10 border border-[var(--reader-accent)]/20 text-[var(--reader-accent)] font-black tracking-tighter italic">
                          SLOT {comment.userLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mt-1 italic">{formatDate(toDate(comment.createdAt))}</p>
                  </div>
                </div>
                {user && user.uid === comment.userId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete comment"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-zinc-400 ml-14 text-sm leading-relaxed italic border-l border-white/5 pl-6">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
