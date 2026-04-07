import Link from "next/link";
import Hero from "@/components/home/Hero";
import StoriesSection from "@/components/home/StoriesSection";
import NovelsSection from "@/components/home/NovelsSection";
import GenreGrid from "@/components/home/GenreGrid";
import PulseFeed from "@/components/home/PulseFeed";
import ContinueReading from "@/components/home/ContinueReading";
import LastReadAnchor from "@/components/home/LastReadAnchor";
import RisingStars from "@/components/home/RisingStars";
import ChapterPulse from "@/components/home/ChapterPulse";
import ThematicCollections from "@/components/home/ThematicCollections";
import GlobalActivityTicker from "@/components/home/GlobalActivityTicker";
import { adminDb } from "@/lib/firebase-admin";

async function getFeaturedAuthor() {
  if (!adminDb) return null;
  try {
    const authorsSnap = await adminDb.collection('users')
      .where('isChronicler', '==', true)
      .orderBy('xp', 'desc')
      .limit(5)
      .get();
    
    if (authorsSnap.empty) return null;
    
    // Pick a random one from the top 5 for variety
    const randomIndex = Math.floor(Math.random() * authorsSnap.docs.length);
    const doc = authorsSnap.docs[randomIndex];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching featured author:", error);
    return null;
  }
}

async function getChampionPick() {
  if (!adminDb) return null;
  try {
    // For now, pick the most liked novel as the champion pick
    const novelsSnap = await adminDb.collection('novels')
      .where('published', '==', true)
      .orderBy('likes', 'desc')
      .limit(1)
      .get();
    
    if (novelsSnap.empty) return null;
    
    const doc = novelsSnap.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      authorName: data.authorName,
      genre: data.genre,
      type: 'novel',
      slug: data.slug
    };
  } catch (error) {
    console.error("Error fetching champion pick:", error);
    return null;
  }
}

async function getCommunityStats() {
  if (!adminDb) return { totalUsers: 0 };
  try {
    const countSnap = await adminDb.collection('users').count().get();
    return { totalUsers: countSnap.data().count };
  } catch (error) {
    console.error("Error fetching community stats:", error);
    return { totalUsers: 0 };
  }
}

export default async function HomePage() {
  const [featuredAuthor, championPick, communityStats]: [any, any, any] = await Promise.all([
    getFeaturedAuthor(),
    getChampionPick(),
    getCommunityStats()
  ]);

  const spotlightAuthor = featuredAuthor || {
    id: "pro-scribe",
    username: "Pro_Scribe",
    bio: "The archives are only for those brave enough to look. Welcome to the Pro sanctuary.",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pro_Scribe",
    level: 10,
    joinedDate: "06/01/2026"
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8">
      <GlobalActivityTicker />
      <Hero championPick={championPick} />
      
      <ContinueReading />
      <LastReadAnchor />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-12">
        <div className="lg:col-span-3 space-y-24">
          <RisingStars />
          <ChapterPulse />
          <GenreGrid />
          <ThematicCollections />
          <StoriesSection />
          <NovelsSection />
        </div>
        
        <aside className="space-y-10 hidden lg:block sticky top-32 h-fit">
          <PulseFeed />
          
          {/* Author Spotlight (Dynamic) */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 bg-gradient-to-br from-indigo-500/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" /></svg>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-black italic">Spotlight</p>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-none">Featured Author</h3>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 overflow-hidden flex-shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                <img 
                    src={spotlightAuthor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${spotlightAuthor.username}`} 
                    alt={spotlightAuthor.username}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            <div className="min-w-0">
                <p className="text-sm font-black text-white truncate uppercase tracking-widest italic leading-none mb-1">{spotlightAuthor.username}</p>
                <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.2em] italic">
                  {spotlightAuthor.level >= 5 ? 'Master Scribe' : 'Lead Author'}
                </p>
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Active in the archives</p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed italic border-l border-white/10 pl-4 line-clamp-3">
              "{spotlightAuthor.bio || "This chronicler prefers to let their work speak for itself."}"
            </p>
            <Link 
              href={`/authors/${spotlightAuthor.id}`} 
              className="block w-full py-3.5 text-center rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-xl active:scale-95 italic"
            >
              Visit Profile
            </Link>
          </div>

          {/* Community Goal (Dynamic) */}
          <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Community Goal</p>
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-none">The Ascension</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[11px] font-black text-white italic tracking-tighter leading-none">
                      {Math.min(100, Math.round((communityStats.totalUsers / 1000) * 100))}% Bound
                    </p>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Collective Progress</p>
                </div>
                <span className="text-xs grayscale group-hover:grayscale-0 transition-all duration-500">
                  {communityStats.totalUsers >= 1000 ? "🔥" : "⏳"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 animate-pulse-slow shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.round((communityStats.totalUsers / 1000) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed italic font-medium">
                Our community grows. Reach <span className="text-white font-black italic">1,000 active readers</span> to unlock a site-wide XP catalyst! 
                <br />
                <span className="text-[9px] opacity-60 mt-1 block">Current Seekers: {communityStats.totalUsers.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
