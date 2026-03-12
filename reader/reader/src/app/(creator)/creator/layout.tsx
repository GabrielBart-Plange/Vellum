import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vellum Archivist",
  description: "Creator Dashboard",
};

import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased h-full bg-[var(--reader-bg)] text-[var(--reader-text)] min-h-screen relative overflow-x-hidden transition-colors duration-500">
      {/* Universal Vellum Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-[var(--reader-accent)] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-[var(--reader-accent)] opacity-[0.03] blur-[130px] rounded-full" />
      </div>

      {children}
      <Analytics />
    </div>
  );
}
