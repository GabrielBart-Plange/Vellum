import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vellum Archivist",
  description: "Creator Dashboard",
};

import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/creator/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased h-full bg-[var(--background)] text-[var(--foreground)] min-h-screen relative overflow-x-hidden transition-colors duration-500">
      {/* Universal Vellum Atmosphere */}
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/5 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/[0.02] blur-[150px] rounded-full" />
      </div>

      <ThemeProvider>
        {children}
        <Analytics />
      </ThemeProvider>
    </div>
  );
}
