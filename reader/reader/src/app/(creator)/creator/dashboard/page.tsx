"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { TrendingUp, Users, Eye, Heart, BarChart3, Clock, Users2, Zap } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    drafts: 0,
    published: 0,
    totalViews: 0,
    totalLikes: 0,
    views24h: 0,
    views7d: 0,
  });
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<{
    usersNeedingReferralIds: number;
    migrationRequired: boolean;
  } | null>(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check referral migration status
        checkMigrationStatus();

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

        // Aggregate Views and Likes from Firestore
        let totalViews = 0;
        let totalLikes = 0;

        storiesSnap.docs.forEach(d => {
          const data = d.data();
          totalViews += (data.views || 0);
          totalLikes += (data.likes || 0);
        });

        novelsSnap.docs.forEach(d => {
          const data = d.data();
          totalViews += (data.views || 0);
          totalLikes += (data.likes || 0);
        });

        // Fetch real velocity metrics from Analytics API
        let views24h = 0;
        let views7d = 0;
        try {
          const analyticsResponse = await fetch(`/api/creator/analytics?authorId=${user.uid}`);
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.ok) {
            views24h = analyticsData.views24h;
            views7d = analyticsData.views7d;
          }
        } catch (err) {
          console.error("Error fetching velocity metrics:", err);
        }

        setStats({
          drafts: draftsSnap.size,
          published: storiesSnap.size + novelsSnap.size,
          totalViews,
          totalLikes,
          views24h,
          views7d,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/creator/dashboard/api/referral-migration');
      const data = await response.json();
      if (data.success) {
        setMigrationStatus({
          usersNeedingReferralIds: data.usersNeedingReferralIds,
          migrationRequired: data.migrationRequired
        });
      }
    } catch (error) {
      console.error('Failed to check migration status:', error);
    }
  };

  const runMigration = async () => {
    const migrationKey = process.env.NEXT_PUBLIC_REFERRAL_MIGRATION_KEY || "";
    if (!migrationKey) {
      alert("Referral migration key not configured in environment.");
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch('/creator/dashboard/api/referral-migration', {
        method: 'POST',
        headers: {
          'x-api-key': migrationKey
        }
      });
      const data = await response.json();
      if (data.success) {
        alert(`Migration complete: ${data.migrated} users received referral IDs`);
        await checkMigrationStatus();
      } else {
        alert('Migration failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console for details.');
    } finally {
      setMigrating(false);
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-8 rounded-[2rem] space-y-4 group hover:border-[var(--reader-border)] hover:bg-white/[0.02] transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500/60 font-bold">Drafts</p>
            <Clock size={14} className="text-emerald-500/40" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left tracking-tighter">
              {loading ? "—" : stats.drafts}
            </span>
            <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">In Progress</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] space-y-4 group hover:border-[var(--reader-border)] hover:bg-white/[0.02] transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-accent)]/60 font-bold">Published</p>
            <BarChart3 size={14} className="text-[var(--reader-accent)]/40" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left tracking-tighter">
              {loading ? "—" : stats.published}
            </span>
            <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">Live Works</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] space-y-4 group hover:border-[var(--reader-border)] hover:bg-white/[0.02] transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/60 font-bold">Total Views</p>
            <Eye size={14} className="text-blue-500/40" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left tracking-tighter">
              {loading ? "—" : stats.totalViews.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">Impressions</span>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] space-y-4 group hover:border-[var(--reader-border)] hover:bg-white/[0.02] transition-all">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-red-500/60 font-bold">Total Likes</p>
            <Heart size={14} className="text-red-500/40" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-[var(--foreground)] group-hover:scale-110 transition-transform block origin-left tracking-tighter">
              {loading ? "—" : stats.totalLikes.toLocaleString()}
            </span>
            <span className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-widest font-bold italic">Appreciation</span>
          </div>
        </div>
      </div>

      {/* Velocity Metrics Section */}
      <div className="space-y-8">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
          <span className="flex-shrink-0 flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--accent-sakura)]" />
            Velocity Metrics
          </span>
          <div className="h-[1px] w-full bg-[var(--reader-border)]" />
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-10 rounded-[2.5rem] border-[var(--reader-border)] bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--accent-sakura)]/5 blur-3xl rounded-full transition-opacity group-hover:opacity-100 opacity-50" />
            <div className="space-y-6 relative">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-bold italic">Recent Pulse (24h)</p>
                <div className="flex items-baseline gap-4">
                  <h3 className="text-6xl font-extralight tracking-tighter text-white">
                    {loading ? "—" : `+${stats.views24h.toLocaleString()}`}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-lime)] flex items-center gap-1 italic">
                    <TrendingUp size={12} />
                    Rising
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--reader-text)]/40 leading-relaxed font-light max-w-xs">
                Views accumulated across all published works in the last <span className="text-white/60">24 cycles</span>.
              </p>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2.5rem] border-[var(--reader-border)] bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full transition-opacity group-hover:opacity-100 opacity-50" />
            <div className="space-y-6 relative">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-bold italic">Weekly Momentum (7d)</p>
                <div className="flex items-baseline gap-4">
                  <h3 className="text-6xl font-extralight tracking-tighter text-white">
                    {loading ? "—" : `+${stats.views7d.toLocaleString()}`}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1 italic">
                    <TrendingUp size={12} />
                    Steady
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--reader-text)]/40 leading-relaxed font-light max-w-xs">
                Cumulative reach expansion over the previous <span className="text-white/60">7 solar rotations</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tools */}
      {migrationStatus && migrationStatus.migrationRequired && (
        <div className="space-y-8">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
            <span className="flex-shrink-0 flex items-center gap-2">
              <Users2 size={14} className="text-amber-400" />
              Admin Tools
            </span>
            <div className="h-[1px] w-full bg-[var(--reader-border)]" />
          </h2>

          <div className="glass-panel p-8 rounded-[2.5rem] border-amber-400/20 bg-gradient-to-br from-amber-400/5 to-transparent relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-400/10 blur-3xl rounded-full" />
            <div className="space-y-6 relative">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold italic flex items-center gap-2">
                  <Zap size={12} />
                  Referral Migration Required
                </p>
                <p className="text-2xl font-light text-white">
                  {migrationStatus.usersNeedingReferralIds} existing users need referral IDs
                </p>
              </div>
              <p className="text-sm text-[var(--reader-text)]/60 leading-relaxed">
                Existing users registered before the referral system implementation need referral IDs to participate in the "Archivist's Echo" automated publicity program.
              </p>
              <button
                onClick={runMigration}
                disabled={migrating}
                className="px-8 py-3 bg-amber-400 text-black text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]"
              >
                {migrating ? 'Migrating...' : 'Assign Referral IDs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-8">
        <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
          <span className="flex-shrink-0">Quick Actions</span>
          <div className="h-[1px] w-full bg-[var(--reader-border)]" />
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
            className="px-10 py-4 glass-panel border-[var(--reader-border)] text-[var(--foreground)] text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-[var(--reader-surface)] transition-all"
          >
            View Drafts
          </Link>

          <Link
            href="/creator/dashboard/published"
            className="px-10 py-4 glass-panel border-[var(--reader-border)] text-[var(--foreground)] text-[10px] uppercase tracking-[0.2em] font-bold rounded-full hover:bg-[var(--reader-surface)] transition-all"
          >
            Manage Published
          </Link>
        </div>
      </div>

      {/* Atmospheric Footer Tip */}
      <footer className="pt-20">
        <div className="p-8 rounded-3xl bg-[var(--reader-surface)] border border-[var(--reader-border)] max-w-2xl">
          <p className="text-xs italic text-[var(--reader-text-muted)] leading-relaxed font-light">
            "A professional writer is an amateur who didn't quit." — Your next great masterpiece is just a chapter away within the Vellum Archives.
          </p>
        </div>
      </footer>
    </section>
  );
}
