"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import ReadingSettings from "@/components/reader/ReadingSettings";
import SystemNotation from "@/components/reader/SystemNotation";
import LikeButton from "@/components/interactions/LikeButton";
import CommentSection from "@/components/interactions/CommentSection";
import TipButton from "@/components/interactions/TipButton";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStoryStatus, unlockStory } from "@/lib/monetization/coinService";

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
  }, [user, storyId, story]);

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

      <article className={`relative max-w-4xl mx-auto rounded-3xl overflow-hidden transition-all duration-700 ${theme === 'void' || theme === 'nebula' ? 'reader-container-glow border border-white/5' : ''} bg-[var(--reader-bg)]`}>
        {/* Same header as before, but content is now passed through or repeated here */}
        {/* ... (Hero Image content) */}
        {/* I'll simplify the client wrapper by passing the main content here */}
        
        {/* Interaction Bar */}
        {/* ... */}
        
        <div className="px-12 md:px-16 pb-16">
          <div className="flex items-center gap-4 py-8 border-b border-t transition-colors" style={{ borderColor: 'var(--reader-border)' }}>
            <LikeButton
              contentType="story"
              contentId={storyId}
              initialLikeCount={story.likes || 0}
            />
            <div className="flex-grow" />
            <TipButton creatorId={story.authorId || story.creatorId} creatorName={story.authorName} />
          </div>

          <div
            className={`leading-relaxed select-text pt-16 relative ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
          >
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
                    <button
                      onClick={async () => {
                        setUnlocking(true);
                        const success = await unlockStory(user.uid, storyId);
                        if (success) setIsLocked(false);
                        else alert("Unlock failed. Check your Inklet balance.");
                        setUnlocking(false);
                      }}
                      disabled={unlocking}
                      className="bg-white text-black px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
                    >
                      {unlocking ? "Unlocking..." : `Unlock for ${unlockPrice} Inklets`}
                    </button>
                  ) : (
                    <Link href={`/login?returnUrl=/stories/${storyId}`} className="inline-block bg-white text-black px-8 py-3 rounded-full text-[10px] uppercase font-black">
                      Login to Unlock
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <SystemNotation content={story.content} fontSize={fontSize} />
            )}
          </div>

          <CommentSection
            contentType="story"
            contentId={storyId}
            initialCommentCount={story.commentCount || 0}
          />
        </div>
      </article>
    </>
  );
}
