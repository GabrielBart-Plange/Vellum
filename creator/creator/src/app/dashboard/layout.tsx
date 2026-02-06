"use client";

import Sidebar from "@/components/Sidebar";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useRequireAuth();
  const [showSidebar, setShowSidebar] = useState(true);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]">
        Checking access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] transition-colors duration-500">
      {/* Sidebar - Conditional Rendering */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-56 flex-shrink-0
          md:relative md:inset-auto md:h-auto md:z-0
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${showSidebar ? "md:block" : "md:hidden"}
        `}
      >
        <div className="h-full bg-[var(--background)] relative group">
          <Sidebar />
          <button
            onClick={() => setShowSidebar(false)}
            className="absolute right-4 top-4 text-[var(--reader-text)] hover:text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Collapse Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Floating Toggle for Zen Mode */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="fixed top-4 left-4 z-50 p-2 text-[var(--reader-text)] hover:text-[var(--foreground)] border border-[var(--reader-border)] bg-[var(--background)] rounded-sm opacity-50 hover:opacity-100 transition-all"
          title="Show Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 p-8 transition-all duration-300 ${!showSidebar ? "mx-auto max-w-5xl" : ""}`}>
        {children}
      </main>

      {/* Overlay for mobile or temporary sidebar view if needed */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  );
}
