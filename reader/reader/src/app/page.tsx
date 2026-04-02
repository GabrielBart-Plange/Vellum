import Link from "next/link";
import Hero from "@/components/home/Hero";
import StoriesSection from "@/components/home/StoriesSection";
import NovelsSection from "@/components/home/NovelsSection";
import GenreGrid from "@/components/home/GenreGrid";
import PulseFeed from "@/components/home/PulseFeed";

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8">
      <Hero />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-12">
        <div className="lg:col-span-3 space-y-24">
          <GenreGrid />
          <StoriesSection />
          <NovelsSection />
        </div>
        
        <aside className="space-y-10 hidden lg:block sticky top-32 h-fit">
          <PulseFeed />
          
          {/* Author Spotlight (Human Element) */}
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
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus_Scribe" 
                    alt="Nexus_Scribe"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
            <div className="min-w-0">
                <p className="text-sm font-black text-white truncate uppercase tracking-widest italic leading-none mb-1">Nexus_Scribe</p>
                <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.2em] italic">Lead Author</p>
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Last seen in the archives 2 hours ago</p>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed italic border-l border-white/10 pl-4">
              "Every saga starts with a single heartbeat. Join me in the Library this week."
            </p>
            <Link 
              href="/authors/nexus-scribe" 
              className="block w-full py-3.5 text-center rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all shadow-xl active:scale-95 italic"
            >
              Visit Profile
            </Link>
          </div>

          {/* Community Goal */}
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
                    <p className="text-[11px] font-black text-white italic tracking-tighter leading-none">85% Bound</p>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Collective Progress</p>
                </div>
                <span className="text-xs grayscale group-hover:grayscale-0 transition-all duration-500">🔥</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 w-[85%] animate-pulse-slow shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed italic font-medium">
                Our community grows. Reach <span className="text-white font-black italic">1,000 active readers</span> this cycle to unlock a site-wide XP catalyst!
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
