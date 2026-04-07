"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import ReadingSettings from "@/components/reader/ReadingSettings";
import AuthorWorks from "@/components/author/AuthorWorks";
import SystemNotation from "@/components/reader/SystemNotation";
import LikeButton from "@/components/interactions/LikeButton";
import CommentSection from "@/components/interactions/CommentSection";
import TipButton from "@/components/interactions/TipButton";
import Link from "next/link";
import { Share, MessageSquare, Twitter, Flag } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ManagedAd from "@/components/monetization/ManagedAd";
import { getStoryStatus, unlockStory, GILT_EXCHANGE_RATIO } from "@/lib/monetization/coinService";
import { analyticsService } from "@/lib/analyticsService";
import ReportModal from "@/components/modals/ReportModal";

interface StoryReaderClientProps {
  storyId: string;
  story: any;
  initialLocked: boolean;
  unlockPrice: number;
}

export default function StoryReaderClient({
  storyId,
  story,
  initialLocked,
  unlockPrice: initialPrice
}: StoryReaderClientProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [unlockPrice, setUnlockPrice] = useState(initialPrice);
  const [unlocking, setUnlocking] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("sans");
  const [progress, setProgress] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<'inklets' | 'gilt'>('inklets');
  const [isViralUnlock, setIsViralUnlock] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll <= 0) {
        setProgress(0);
        return;
      }
      setProgress((currentScroll / totalScroll) * 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const savedSize = localStorage.getItem("reader-font-size") || "18";
    const savedFont = localStorage.getItem("reader-font-family") || "sans";
    setFontSize(parseInt(savedSize));
    setFontFamily(savedFont);
  }, []);

  useEffect(() => {
    localStorage.setItem("reader-font-size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("reader-font-family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Track view for analytics
      analyticsService.trackStoryView({
        storyId,
        authorId: story.authorId || story.creatorId,
        userId: user?.uid
      });

      if (user && story.isPremium) {
        // Author check
        if (user.uid === story.authorId || user.uid === story.creatorId) {
          setIsLocked(false);
          return;
        }

        const unlockRef = doc(db, "users", user.uid, "unlockedStories", storyId);
        const unlockSnap = await getDoc(unlockRef);
        if (unlockSnap.exists()) {
          setIsLocked(false);
        } else {
          const status = await getStoryStatus(user.uid, storyId);
          setIsLocked(status.locked);
          setUnlockPrice(status.price || story.price || 10);
        }
      }
    };
    checkUserStatus();
    
    // Check for session-based viral unlock
    const viralKey = `viral_unlock_${storyId}`;
    if (localStorage.getItem(viralKey)) {
      setIsLocked(false);
      setIsViralUnlock(true);
    }
  }, [user, storyId, story]);

  const handleShareToUnlock = () => {
    const referralId = (user as any)?.referralId || "VELLUM";
    // Correctly map to /stories/ or /novel/ based on type
    const path = story.type === 'story' || storyId.startsWith('story_') ? 'stories' : 'novel';
    const shareUrl = `${window.location.origin}/${path}/${story.slug || storyId}?ref=${referralId}`;
    const shareText = `I'm reading "${story.title}" on Vellum! It's incredible. Use my archival link to get 50 bonus Inklets: ${shareUrl}`;
    
    // Use Web Share API for "Easy" sharing if available
    if (navigator.share) {
      navigator.share({
        title: story.title,
        text: shareText,
        url: shareUrl,
      }).catch(err => console.log("Share failed:", err));
    } else {
      // Fallback to WhatsApp Share Intent
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    }

    // Grant temporary unlock
    localStorage.setItem(`viral_unlock_${storyId}`, "true");
    setIsLocked(false);
    setIsViralUnlock(true);
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-1 z-[150] pointer-events-none">
        <div
          className="h-full bg-[var(--reader-accent)] transition-all duration-150 ease-out shadow-[0_0_10px_var(--reader-accent)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ReadingSettings
        currentFontSize={fontSize}
        currentFontFamily={fontFamily}
        onFontSizeChange={setFontSize}
        onFontFamilyChange={setFontFamily}
      />

      {/* Top Ad Placement */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <ManagedAd zone="READER_TOP" />
      </div>

      <article className={`relative max-w-4xl mx-auto rounded-3xl overflow-hidden transition-all duration-700 ${theme === 'void' || theme === 'nebula' ? 'reader-container-glow border border-white/5' : ''} bg-[var(--reader-bg)]`}>
        {/* Same header as before, but content is now passed through or repeated here */}
        {/* ... (Hero Image content) */}
        {/* I'll simplify the client wrapper by passing the main content here */}
        
        {/* Interaction Bar */}
        {/* ... */}
        
        <div className="px-12 md:px-16 pb-16">
          {/* Content Header Info */}
          <div className="flex flex-col items-center text-center space-y-6 pt-12 pb-8">
            <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full glass text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-black">
                {story.genre}
              </span>
              {story.rating && (
                <span className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.3em] font-black italic ${
                  story.rating === 'Explicit' || story.rating === 'Mature' 
                  ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                  : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                }`}>
                  {story.rating}
                </span>
              )}
              {story.targetAudience && (
                <span className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-[0.3em] font-black italic">
                  {story.targetAudience} Lead
                </span>
              )}
            </div>
            
            {/* Content Warnings */}
            {story.contentWarnings && story.contentWarnings.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                <span className="text-[8px] uppercase tracking-[0.4em] text-red-500/60 font-black italic mr-2">Warnings:</span>
                {story.contentWarnings.map((warning: string) => (
                  <span 
                    key={warning}
                    className="text-[9px] uppercase tracking-widest text-red-400/80 font-bold px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
              {story.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 py-8 border-b border-t transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
            <LikeButton
              contentType="story"
              contentId={storyId}
              initialLikeCount={story.likes || 0}
            />
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="glass-panel p-2.5 rounded-2xl text-zinc-500 hover:text-red-400 transition-all hover:bg-red-500/5 hover:border-red-500/20"
              title="Report Story"
            >
              <Flag size={18} />
            </button>
            <div className="flex-grow" />
            <TipButton creatorId={story.authorId || story.creatorId} creatorName={story.authorName} />
          </div>

          {/* Story Tags */}
          {story.tags && story.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8">
              {story.tags.map((tag: string) => {
                const tagSlug = tag.toLowerCase().replace(/\s+/g, '-').replace(/#/g, '');
                return (
                  <Link 
                    key={tag} 
                    href={`/tag/${tagSlug}`}
                    className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-black px-3 py-1 rounded-full border border-[var(--reader-border)] bg-[var(--reader-surface)] hover:border-[var(--reader-accent)]/50 hover:text-white transition-all italic"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </Link>
                );
              })}
            </div>
          )}

          <div
            className={`leading-relaxed select-text pt-16 relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
          >
            {isViralUnlock && !isLocked && (
              <div className="mb-8 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <p className="text-[10px] uppercase font-black text-purple-400 tracking-widest italic animate-pulse">
                  Viral Grace Period Active — Thank you for spreading the word!
                </p>
              </div>
            )}
            {isLocked ? (
              <div className="relative py-20 px-6 rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-0" />
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--reader-accent)]">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-widest text-white italic">This Story is Locked</h3>
                  </div>
                  {user ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
                          <button
                            onClick={() => setSelectedCurrency('inklets')}
                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCurrency === 'inklets' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
                          >
                            {unlockPrice} Inklets
                          </button>
                          <button
                            onClick={() => setSelectedCurrency('gilt')}
                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCurrency === 'gilt' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
                          >
                            {Math.ceil(unlockPrice / GILT_EXCHANGE_RATIO)} Gilt
                          </button>
                        </div>
                        <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-bold italic">
                          1 Gilt = 10 Inklets Exchange Ratio
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          setUnlocking(true);
                          const success = await unlockStory(user.uid, storyId, selectedCurrency);
                          if (success) {
                            setIsLocked(false);
                          } else {
                            alert(`Unlock failed. Check your ${selectedCurrency === 'gilt' ? 'Gilt' : 'Inklet'} balance.`);
                          }
                          setUnlocking(false);
                        }}
                        disabled={unlocking}
                        className="w-full bg-[var(--reader-accent)] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_-10px_rgba(var(--reader-accent-rgb),0.3)] italic"
                      >
                        {unlocking ? "Manifesting..." : `Unlock with ${selectedCurrency === 'gilt' ? 'Gilt' : 'Inklets'}`}
                      </button>

                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest italic">Or spread the word for a grace period</p>
                        <button
                          onClick={handleShareToUnlock}
                          className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all italic text-zinc-400 hover:text-white"
                        >
                          <Share size={14} className="text-[var(--reader-accent)]" />
                          Spread the Word
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link href={`/login?returnUrl=/stories/${storyId}`} className="inline-block bg-white text-black px-8 py-3 rounded-full text-[10px] uppercase font-black">
                      Login to Unlock
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <SystemNotation content={story.content} fontSize={fontSize} storyId={storyId} />
                
                {/* Bottom Ad Placement */}
                <div className="mt-16 pt-8 border-t border-white/5">
                  <ManagedAd zone="READER_AFTER_CHAPTER" />
                </div>
              </>
            )}
          </div>

          <CommentSection
            contentType="story"
            contentId={storyId}
            initialCommentCount={story.commentCount || 0}
          />

          {/* More from Author */}
          <div className="mt-24 pt-16 border-t border-[var(--reader-border)]">
            <AuthorWorks 
              authorId={story.authorId || story.creatorId} 
              authorName={story.authorName} 
              currentWorkId={storyId} 
              type="story" 
            />
          </div>
        </div>
      </article>

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        contentType="story"
        contentId={storyId}
        contentTitle={story.title}
        authorId={story.authorId || story.creatorId}
      />
    </>
  );
}
