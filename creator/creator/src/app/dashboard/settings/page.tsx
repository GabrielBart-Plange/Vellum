"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

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
        <section className="space-y-12">
            <header className="space-y-4">
                <h1 className="text-2xl tracking-[0.2em] font-light uppercase text-white">
                    Studio Settings
                </h1>
                <p className="text-gray-500 max-w-lg leading-relaxed">
                    Technical configurations and account management for your creative residency.
                </p>
            </header>

            <div className="max-w-xl space-y-10">
                {/* Account Security */}
                <div className="space-y-6">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold border-b border-white/5 pb-2">
                        Account & Security
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-900/10 border border-white/5 rounded-sm">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-200 uppercase tracking-widest leading-none">Email Address</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <button className="text-[10px] uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                                Change
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-900/10 border border-white/5 rounded-sm">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-200 uppercase tracking-widest leading-none">Password</p>
                                <p className="text-xs text-gray-500">Last changed: —</p>
                            </div>
                            <button className="text-[10px] uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications & Preferences */}
                <div className="space-y-6">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold border-b border-white/5 pb-2">
                        Preferences
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Minimal Editor Mode</p>
                            <div className="h-5 w-10 bg-zinc-800 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 h-3 w-3 bg-zinc-600 rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Discord Integration</p>
                            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-10 space-y-4">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-red-900/70 font-bold border-b border-red-900/10 pb-2">
                        Danger Zone
                    </h2>
                    <p className="text-[10px] text-gray-600 italic">
                        Permanent actions that cannot be undone. Exercise caution.
                    </p>
                    <button className="text-[10px] uppercase tracking-widest text-red-900/50 hover:text-red-500 transition-colors">
                        Delete Creator Account
                    </button>
                </div>
            </div>

            <footer className="pt-12 text-[10px] uppercase tracking-[0.4em] text-gray-800 border-t border-white/5">
                .15 Chronicles System v1.2.0
            </footer>
        </section>
    );
}
