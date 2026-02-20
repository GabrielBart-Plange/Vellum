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
      const commentsRef = collection(db, getCommentsPath());
      const commentData = {
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || "Anonymous",
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

  const toDate = (value: any): Date => {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
    return new Date(value);
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
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785c-.442.483.087 1.228.639.986 1.123-.494 2.454-.973 3.348-1.15a3.15 3.15 0 0 1 1.066.023c.337.062.671.139 1.011.139Z" />
        </svg>
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
                placeholder="Share your thoughts..."
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-zinc-600 resize-none"
                rows={3}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="self-start px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 rounded-xl bg-zinc-900/30 border border-white/5 text-center">
          <p className="text-zinc-400 text-sm">
            <button
              onClick={() => router.push("/login")}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Sign in
            </button> to join the discussion
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 italic">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{comment.username}</p>
                    <p className="text-xs text-zinc-500">{formatDate(toDate(comment.createdAt))}</p>
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
              <p className="text-zinc-300 ml-11">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
