"use client";

import Link from "next/link";

export default function LibraryPage() {
    return (
        <main className="min-h-screen bg-black pt-40 pb-24 px-8">
            <div className="max-w-6xl mx-auto space-y-16">
                <header className="space-y-4 border-l-2 border-zinc-700 pl-8">
                    <p className="text-[11px] uppercase tracking-[0.8em] text-zinc-500 font-bold">Personal</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase italic">THE GRAND LIBRARY</h1>
                </header>

                <div className="glass-panel p-20 rounded-[40px] border border-white/5 text-center space-y-8">
                    <div className="h-20 w-20 rounded-full border border-white/10 mx-auto flex items-center justify-center opacity-20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                        </svg>
                    </div>
                    <p className="text-zinc-500 italic uppercase tracking-[0.4em] text-sm">Your scrolls are being retrieved from the archive...</p>
                    <Link href="/login" className="inline-block px-10 py-4 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                        Sign In to Access
                    </Link>
                </div>
            </div>
        </main>
    );
}
