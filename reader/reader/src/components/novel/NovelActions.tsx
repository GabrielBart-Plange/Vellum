"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, where, DocumentData } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { progressTracking } from "@/lib/progressTracking";

interface NovelActionsProps {
  novel: DocumentData;
  novelId: string;
  slug: string;
  chapters: DocumentData[];
}

export default function NovelActions({ novel, novelId, slug, chapters }: NovelActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [readingProgress, setReadingProgress] = useState<DocumentData | null>(null);
  const [showChapters, setShowChapters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (user && novelId) {
        try {
          const savedRef = doc(db, "users", user.uid, "savedNovels", novelId);
          const savedSnap = await getDoc(savedRef);
          setSaved(savedSnap.exists());

          // Load Reading Progress
          const progressRef = doc(db, "users", user.uid, "progress", novelId);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists()) {
            setReadingProgress(progressSnap.data());
          }
        } catch (error) {
          console.error("Error loading user novel data:", error);
        }
      }
    };
    loadUserData();
  }, [novelId, user]);

  const handleSaveToLibrary = async () => {
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!novel || !novelId) return;

    setSaving(true);
    try {
      if (saved) {
        await progressTracking.unsaveNovel(user.uid, novelId);
        setSaved(false);
      } else {
        await progressTracking.saveNovel(
          user.uid,
          novelId,
          novel.title || "Untitled",
          novel.coverImage || "",
          novel.authorName || "Unknown Author",
          novel.authorId || novel.creatorId,
          novel.numericalId,
          novel.slug
        );
        setSaved(true);
      }
    } catch (error) {
      console.error("Error toggling novel save:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 pt-12">
        <button
          onClick={() => setShowChapters(true)}
          className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] premium-shadow hover:scale-105 active:scale-95 transition-all duration-500"
          title="See all chapters in this novel"
        >
          Start Reading
        </button>
        {readingProgress && (
          <Link
            href={`/chapter/${novel.numericalId || novel.slug || slug}-${readingProgress.chapterOrder || readingProgress.lastChapter || 1}`}
            className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 text-center rounded-2xl bg-white text-black text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
          >
            Continue Reading
          </Link>
        )}
        <button
          onClick={handleSaveToLibrary}
          disabled={saving}
          className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl border border-white/10 glass-panel text-white text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-white/5 transition-all disabled:opacity-50"
          title="Add this novel to your personal library"
        >
          {saved ? "In Library" : saving ? "Saving..." : "Save to Library"}
        </button>
      </div>

      {/* Expandable Chapters Overlay */}
      {showChapters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-[var(--reader-bg)]/90 backdrop-blur-3xl" onClick={() => setShowChapters(false)} />
          <div className="relative w-full max-w-5xl max-h-[80vh] overflow-hidden glass rounded-3xl border border-[var(--reader-border)] flex flex-col scale-in-center">
            <header className="p-8 border-b border-[var(--reader-border)] flex items-center justify-between">
              <div>
                <h1 className="text-[10px] uppercase tracking-[0.5em] text-[var(--reader-text-subtle)] font-black">Project Vellum</h1>
                <p className="text-xl font-black uppercase text-[var(--reader-text)] tracking-widest">{novel.title}</p>
              </div>
              <button
                onClick={() => setShowChapters(false)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center text-[var(--reader-text-subtle)] hover:text-[var(--reader-text)] transition-all"
              >
                ✕
              </button>
            </header>
            <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapters.map((chapter, index) => (
                  <Link
                    key={chapter.id}
                    href={`/chapter/${novel.numericalId || novel.slug || slug}-${chapter.order || chapter.id || (index + 1)}`}
                    className="group p-6 glass-panel border border-white/5 rounded-2xl hover:border-purple-500/40 hover:bg-white/[0.05] transition-all duration-500"
                  >
                    <div className="space-y-2">
                      <p className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black group-hover:text-[var(--reader-accent)] transition-colors">Chapter {index + 1}</p>
                      <h3 className="text-[var(--reader-text-muted)] text-sm font-black group-hover:text-[var(--reader-text)] transition-colors tracking-tight line-clamp-1 truncate uppercase">{chapter.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
