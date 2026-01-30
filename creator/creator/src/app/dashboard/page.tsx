"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    drafts: 0,
    published: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch Drafts count
        const draftsRef = collection(db, "users", user.uid, "drafts");
        const draftsSnap = await getDocs(draftsRef);

        // Fetch Published count (Stories + Novels)
        const publishedStoriesRef = collection(db, "stories");
        const qStories = query(publishedStoriesRef, where("authorId", "==", user.uid), where("published", "==", true));
        const storiesSnap = await getDocs(qStories);

        const novelsRef = collection(db, "novels");
        const qNovels = query(novelsRef, where("authorId", "==", user.uid), where("published", "==", true));
        const novelsSnap = await getDocs(qNovels);

        setStats({
          drafts: draftsSnap.size,
          published: storiesSnap.size + novelsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <section className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-2xl tracking-[0.2em] font-light uppercase text-white">
          Studio Overview
        </h1>
        <p className="text-gray-500 max-w-lg leading-relaxed">
          Monitor your creative progress, manage your latest drafts, and track the pulse of your published stories.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-white/5 bg-zinc-900/20 p-8 rounded-sm space-y-2">
          <p className="text-xs uppercase tracking-widest text-emerald-500/80 font-medium">Drafts in progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{loading ? "—" : stats.drafts}</span>
            <span className="text-gray-600 text-sm">Stories being told</span>
          </div>
        </div>

        <div className="border border-white/5 bg-zinc-900/20 p-8 rounded-sm space-y-2">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-medium">Published Works</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light text-white">{loading ? "—" : stats.published}</span>
            <span className="text-gray-600 text-sm">Live in the Chronicles</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 font-semibold border-b border-white/5 pb-2 w-fit">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/drafts/new"
            className="px-6 py-3 bg-white text-black text-sm uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors"
          >
            Start New Story
          </Link>

          <Link
            href="/dashboard/drafts"
            className="px-6 py-3 border border-white/10 text-white text-sm uppercase tracking-widest hover:border-white/30 transition-colors"
          >
            View Drafts
          </Link>

          <Link
            href="/dashboard/published"
            className="px-6 py-3 border border-white/10 text-white text-sm uppercase tracking-widest hover:border-white/30 transition-colors"
          >
            Manage Published
          </Link>
        </div>
      </div>

      {/* Atmospheric Footer Tip */}
      <footer className="pt-12 border-t border-white/5">
        <p className="text-xs italic text-gray-700 max-w-md">
          "A professional writer is an amateur who didn't quit." — Keep writing, your next chronicles await.
        </p>
      </footer>
    </section>
  );
}
