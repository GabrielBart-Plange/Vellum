"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { syncCreatorProfile } from "@/lib/syncUser";
import Sidebar from "@/components/creator/Sidebar";
import MobileNav from "@/components/creator/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);

  // Auto-hide sidebar on mobile on initial load
  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login?returnUrl=/creator/dashboard");
      } else {
        syncCreatorProfile(user).catch(console.error);
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]">
        Checking access...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors duration-500 overflow-hidden">
      {/* Sidebar - Conditional Rendering */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-56 flex-shrink-0
          md:relative md:inset-auto md:h-auto md:z-0
          transform transition-transform duration-500 ease-in-out
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${showSidebar ? "md:block w-56" : "md:w-0 overflow-hidden"}
        `}
      >
        <div className="h-full relative group">
          <Sidebar />
          <button
            onClick={() => setShowSidebar(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border border-[var(--reader-border)] bg-[var(--reader-bg)] backdrop-blur-md text-[var(--reader-text)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-all z-50 flex items-center justify-center hover:scale-110"
            title="Collapse Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Floating Toggle for Zen Mode (Desktop Only) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed top-8 left-8 z-50 hidden md:flex h-10 w-10 items-center justify-center text-[var(--reader-text)] hover:text-[var(--foreground)] border border-[var(--reader-border)] glass-panel rounded-full hover:bg-[var(--reader-surface-hover)] transition-all animate-in fade-in slide-in-from-left-4"
          title="Show Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      )}

      {/* Main Content Area */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-500 ${!showSidebar ? "md:mx-auto md:max-w-6xl w-full" : "md:max-w-7xl md:mx-auto w-full"}`}>
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[var(--reader-border)]/30 bg-transparent z-30 relative">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--reader-text-muted)] flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#8b0000] to-[#4a0000] flex items-center justify-center text-[8px] font-serif shadow-[0_2px_10px_rgba(139,0,0,0.5)] border border-[#a52a2a]/30 overflow-hidden">
              <span className="relative z-10 text-[#aa8e45]">V</span>
            </div>
            Archivist
          </div>
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 -mr-2 text-[var(--reader-text)] hover:text-[var(--foreground)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-6 md:px-8 py-8 md:py-12">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-[var(--reader-bg)]/60 backdrop-blur-sm md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
