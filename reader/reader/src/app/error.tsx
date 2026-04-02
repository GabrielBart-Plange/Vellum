"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0b0a0f] flex flex-col items-center justify-center text-center p-10 space-y-12 animate-in slide-in-from-bottom duration-700">
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
          <span className="text-3xl">🪶</span>
        </div>
        <h2 className="text-[11px] uppercase tracking-[0.8em] text-red-500 font-black italic">Broken Link in the Archives</h2>
      </div>

      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">The chronicle has failed to unroll.</h1>
        <p className="text-zinc-500 text-sm leading-relaxed italic">
          A spiritual disturbance has occurred in the digital archive. We've traced the error, but this saga is temporarily sealed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <button
          onClick={() => reset()}
          className="px-12 py-5 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-12 py-5 rounded-2xl border border-white/5 bg-white/[0.02] text-white text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white/5 transition-all italic"
        >
          Return Home
        </Link>
      </div>

      <div className="pt-20">
        <p className="text-[9px] uppercase tracking-widest text-zinc-800 font-bold">Error Hash: {error.digest || 'Internal Vellum Fault'}</p>
      </div>
    </div>
  );
}
