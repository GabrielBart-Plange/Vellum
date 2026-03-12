"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isAdFree } from "@/lib/monetization/subscriptionService";
import { getAdForZone, MockAd } from "@/lib/monetization/adConfig";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ManagedAdProps {
    zone: string;
    className?: string;
}

export default function ManagedAd({ zone, className = "" }: ManagedAdProps) {
    const { monetization } = useAuth();
    const [ad, setAd] = useState<MockAd | null>(null);

    // If user is on a paid tier, don't show any ads
    const adFree = monetization ? isAdFree(monetization.subscriptionTier) : false;

    useEffect(() => {
        if (!adFree) {
            setAd(getAdForZone(zone));
        }
    }, [adFree, zone]);

    if (adFree || !ad) {
        return null;
    }

    return (
        <div className={`my-8 ${className}`}>
            <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-1 backdrop-blur-sm transition-all hover:border-[var(--accent-sakura)]/20 shadow-xl">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-purple-600/5 blur-3xl group-hover:bg-purple-600/10 transition-colors" />

                <div className="relative flex flex-col md:flex-row items-center gap-6 p-6">
                    {/* Placeholder for Ad Image/Graphic */}
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:bg-zinc-700 transition-colors">
                        <span className="text-2xl opacity-40">✦</span>
                    </div>

                    <div className="flex-1 space-y-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-sakura)] opacity-80">Promoted</span>
                            <div className="h-px w-8 bg-white/10 hidden md:block" />
                        </div>
                        <h4 className="text-lg font-bold text-white tracking-tight leading-tight">{ad.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">{ad.description}</p>
                    </div>

                    <div className="flex-shrink-0">
                        <Link
                            href={ad.link}
                            className="px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                            {ad.cta}
                        </Link>
                    </div>
                </div>

                {/* Subtle Ad Label for Transparency */}
                <div className="absolute top-3 right-4">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Archive Bonus</span>
                </div>
            </div>

            {/* Minimal Upsell for Free Tier */}
            <div className="mt-2 text-center">
                <Link
                    href="/premium"
                    className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Hide all ads with Vellum Prime →
                </Link>
            </div>
        </div>
    );
}
