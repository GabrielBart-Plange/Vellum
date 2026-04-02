export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#0b0a0f] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
      {/* Decorative Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative">
        {/* Spinner/Orb */}
        <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-purple-500/30 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 blur-sm animate-pulse opacity-50" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2 relative z-10">
        <h2 className="text-[10px] uppercase tracking-[0.8em] text-white/40 font-black italic">Project Vellum</h2>
        <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-bold animate-pulse">Unrolling the chronicles...</p>
      </div>

      {/* Progress Bar Placeholder */}
      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  );
}
