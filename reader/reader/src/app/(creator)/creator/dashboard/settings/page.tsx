"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileNav from "@/components/creator/MobileNav";
import Sidebar from "@/components/creator/Sidebar";
import { useTheme } from "@/components/creator/theme-provider";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            if (u) {
                setUser(u);
            } else {
                router.replace("/login");
            }
        });
        return () => unsub();
    }, [router]);

    if (!user) return null;

    return (
        <section className="space-y-16 transition-all duration-500">
            <header className="space-y-4">
                <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">
                    Studio Settings
                </h1>
                <p className="text-[var(--reader-text)]/50 max-w-lg leading-relaxed text-sm">
                    Technical configurations and account management for your creative residency in the <span className="text-[var(--accent-sakura)] italic">Archives</span>.
                </p>
            </header>

            <div className="max-w-3xl space-y-12">
                {/* Account Security */}
                <div className="space-y-8">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/30 font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">Account & Security</span>
                        <div className="h-[1px] w-full bg-white/[0.05]" />
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-8 glass-panel border transition-all hover:border-white/10 rounded-3xl">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[var(--reader-text)]/40 uppercase tracking-[0.2em] font-medium">Email Address</p>
                                <p className="text-sm text-[var(--foreground)] tracking-wide">{user.email}</p>
                            </div>
                            <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--reader-accent)] hover:text-[var(--foreground)] transition-colors">
                                Change
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-8 glass-panel border transition-all hover:border-white/10 rounded-3xl">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[var(--reader-text)]/40 uppercase tracking-[0.2em] font-medium">Password</p>
                                <p className="text-sm text-[var(--foreground)] tracking-wide italic">SECURED</p>
                            </div>
                            <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--reader-accent)] hover:text-[var(--foreground)] transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications & Preferences */}
                <div className="space-y-8">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text)]/30 font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">System Preferences</span>
                        <div className="h-[1px] w-full bg-white/[0.05]" />
                    </h2>

                    <div className="glass-panel p-10 rounded-3xl space-y-8 border-white/5">
                        {/* Theme Selection */}
                        <div className="space-y-4">
                            <p className="text-[10px] text-[var(--reader-text)]/40 uppercase tracking-[0.2em] font-medium ml-1">Archive Atmosphere (Theme)</p>
                            <div className="flex flex-wrap gap-3">
                                {(['void', 'archive', 'nebula', 'light'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${theme === t
                                            ? "border-[var(--reader-accent)] text-[var(--reader-accent)] bg-[var(--reader-accent)]/10 shadow-[0_0_20px_-5px_hsla(var(--reader-accent-hsl),0.4)]"
                                            : "border-white/5 text-[var(--reader-text)]/40 hover:border-white/20 hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div>
                                <p className="text-xs text-[var(--reader-text)] uppercase tracking-widest group-hover:text-[var(--foreground)] transition-colors">Discord Integration</p>
                                <p className="text-[10px] text-[var(--reader-text)]/30 mt-1 italic font-light">Connect your chronicles to your community.</p>
                            </div>
                            <span className="text-[9px] text-[var(--reader-text)]/20 uppercase tracking-[0.3em] font-bold bg-white/[0.02] px-3 py-1 rounded-full border border-white/5">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-10 space-y-6">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-red-900/40 font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">Danger Zone</span>
                        <div className="h-[1px] w-full bg-red-900/10" />
                    </h2>
                    <div className="p-8 rounded-3xl bg-red-950/5 border border-red-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <p className="text-[10px] text-[var(--reader-text)]/40 italic font-light max-w-sm">
                            Permanent actions that cannot be undone. Exercise extreme caution within the deep archives.
                        </p>
                        <button className="px-8 py-3 rounded-full border border-red-900/20 text-[10px] uppercase tracking-[0.2em] font-bold text-red-900/50 hover:text-red-500 hover:border-red-500 transition-all">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            <footer className="pt-12 text-[10px] uppercase tracking-[0.5em] text-white/5 border-t border-white/5 flex justify-between items-center">
                <span>Vellum System v1.2.0</span>
                <span className="italic">Protected by the Archivist's Seal</span>
            </footer>
        </section>
    );
}
