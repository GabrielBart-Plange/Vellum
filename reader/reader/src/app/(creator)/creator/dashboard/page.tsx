"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    drafts: 0,
    published: 0,
    totalViews: 0,
    totalLikes: 0,
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

        // Aggregate Views and Likes
        let totalViews = 0;
        let totalLikes = 0;

        storiesSnap.docs.forEach(d => {
          totalViews += (d.data().views || 0);
          totalLikes += (d.data().likes || 0);
        });

        novelsSnap.docs.forEach(d => {
          totalViews += (d.data().views || 0);
          totalLikes += (d.data().likes || 0);
        });

        setStats({
          drafts: draftsSnap.size,
          published: storiesSnap.size + novelsSnap.size,
          totalViews,
          totalLikes,
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
    <section className="space-y-16">
      <header className="space-y-4">
        <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">
          Studio Overview
        </h1>
        <p className="text-[var(--reader-text)]/50 max-w-lg leading-relaxed text-sm">
          Monitor your creative progress, manage your latest drafts, and track the pulse of your published stories in the <span className="text-[var(--accent-sakura)] italic">Archives</span>.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-3xl space-y-4 group hover:border-white/10 transition-all">
          <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500/60 font-semibold">Drafts in progress</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-extralight text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left">
              {loading ? "—" : stats.drafts}
            </span>
            <span className="text-[var(--reader-text)]/40 text-xs uppercase tracking-widest font-medium">Stories being told</span>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl space-y-4 group hover:border-white/10 transition-all">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-accent)] font-semibold">Published Works</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-extralight text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left">
              {loading ? "—" : stats.published}
            </span>
            <span className="text-[var(--reader-text)]/40 text-xs uppercase tracking-widest font-medium">Stories Live</span>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl space-y-4 group hover:border-white/10 transition-all">
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/60 font-semibold">Total Impressions</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-extralight text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left">
              {loading ? "—" : stats.totalViews.toLocaleString()}
            </span>
            <span className="text-[var(--reader-text)]/40 text-xs uppercase tracking-widest font-medium">Archive Views</span>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl space-y-4 group hover:border-white/10 transition-all">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/60 font-semibold">Total Approval</p>
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-extralight text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left">
              {loading ? "—" : stats.totalLikes}
            </span>
            <span className="text-[var(--reader-text)]/40 text-xs uppercase tracking-widest font-medium">Likes Received</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-8">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/30 font-bold flex items-center gap-4">
          <span className="flex-shrink-0">Quick Actions</span>
          <div className="h-[1px] w-full bg-white/[0.05]" />
        </h2>

        <div className="flex flex-wrap gap-6">
          <Link
            href="/creator/dashboard/drafts/new"
            className="px-10 py-4 bg-[var(--accent-lime)] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_-5px_var(--glow-lime)]"
          >
            Start New Story
          </Link>

          <Link
            href="/creator/dashboard/drafts"
            className="px-10 py-4 glass-panel border-white/10 text-[var(--foreground)] text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white/5 transition-all"
          >
            View Drafts
          </Link>

          <Link
            href="/creator/dashboard/published"
            className="px-10 py-4 glass-panel border-white/10 text-[var(--foreground)] text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-white/5 transition-all"
          >
            Manage Published
          </Link>
        </div>
      </div>

      {/* Atmospheric Footer Tip */}
      <footer className="pt-20">
        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 max-w-2xl">
          <p className="text-xs italic text-[var(--reader-text)]/50 leading-relaxed font-light">
            "A professional writer is an amateur who didn't quit." — Your next great chronicle is just a chapter away within the Vellum Archives.
          </p>
        </div>
      </footer>
    </section>
  );
}
