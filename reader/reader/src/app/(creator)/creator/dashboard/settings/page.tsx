"use client";

import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileNav from "@/components/creator/MobileNav";
import Sidebar from "@/components/creator/Sidebar";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [supportLink, setSupportLink] = useState("");
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                // Fetch profile
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    setSupportLink(snap.data().supportLink || "");
                }
            } else {
                router.replace("/login");
            }
        });
        return () => unsub();
    }, [router]);

    const saveSupportLink = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                supportLink: supportLink.trim()
            });
            alert("Settings updated successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <section className="space-y-16 transition-all duration-500">
            <header className="space-y-4">
                <h1 className="text-4xl tracking-[0.3em] font-light uppercase text-[var(--foreground)]">
                    Studio Settings
                </h1>
                <p className="text-[var(--reader-text-muted)] max-w-lg leading-relaxed text-sm">
                    Technical configurations and account management for your creative residency in the <span className="text-[var(--reader-accent)] italic font-medium">Vellum Archives</span>.
                </p>
            </header>

            <div className="max-w-3xl space-y-12">
                {/* Account Security */}
                <div className="space-y-8">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">Account & Security</span>
                        <div className="h-[1px] w-full bg-[var(--reader-border)]" />
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-8 glass-panel border border-[var(--reader-border)] transition-all hover:bg-[var(--reader-surface-hover)] rounded-3xl">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-[0.2em] font-medium">Email Address</p>
                                <p className="text-sm text-[var(--foreground)] tracking-wide">{user.email}</p>
                            </div>
                            <button className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--reader-accent)] hover:text-[var(--foreground)] transition-colors">
                                Change
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-8 glass-panel border border-[var(--reader-border)] transition-all hover:bg-[var(--reader-surface-hover)] rounded-3xl">
                            <div className="space-y-2">
                                <p className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-[0.2em] font-medium">Password</p>
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
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">System Preferences</span>
                        <div className="h-[1px] w-full bg-[var(--reader-border)]" />
                    </h2>

                    <div className="glass-panel p-10 rounded-3xl space-y-8 border-white/5">
                        {/* Theme Selection */}
                        <div className="space-y-4">
                            <p className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-[0.2em] font-medium ml-1">Archive Atmosphere (Theme)</p>
                            <div className="flex flex-wrap gap-3">
                                {(['void', 'archive', 'nebula', 'midnight', 'light', 'serene'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t as Theme)}
                                        className={`px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${theme === t
                                            ? "border-[var(--reader-accent)] text-[var(--reader-accent)] bg-[var(--reader-accent)]/10 shadow-[0_0_20px_-5px_var(--reader-accent)]"
                                            : "border-[var(--reader-border)] text-[var(--reader-text-muted)] hover:border-[var(--reader-accent)]/50 hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div>
                                <p className="text-xs text-[var(--reader-text-muted)] uppercase tracking-widest group-hover:text-[var(--foreground)] transition-colors">Discord Integration</p>
                                <p className="text-[10px] text-[var(--reader-text-subtle)] mt-1 italic font-light">Connect your works to your community.</p>
                            </div>
                            <span className="text-[9px] text-[var(--reader-text-subtle)] uppercase tracking-[0.3em] font-bold bg-[var(--reader-surface)] px-3 py-1 rounded-full border border-[var(--reader-border)]">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* Support Flow */}
                <div className="space-y-8">
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-text-subtle)] font-bold flex items-center gap-4">
                        <span className="flex-shrink-0">Creator Support Flow</span>
                        <div className="h-[1px] w-full bg-[var(--reader-border)]" />
                    </h2>

                    <div className="glass-panel p-10 rounded-3xl space-y-6 border-white/5">
                        <div className="space-y-4">
                            <p className="text-[10px] text-[var(--reader-text-muted)] uppercase tracking-[0.2em] font-medium ml-1">Support Link (Ko-fi, Patreon, etc.)</p>
                            <div className="flex gap-4">
                                <input
                                    value={supportLink}
                                    onChange={(e) => setSupportLink(e.target.value)}
                                    placeholder="https://ko-fi.com/yourname"
                                    className="flex-1 bg-[var(--reader-surface)] border border-[var(--reader-border)] p-4 rounded-2xl text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--reader-accent)] transition-all placeholder:text-[var(--reader-text-subtle)]"
                                />
                                <button
                                    onClick={saveSupportLink}
                                    disabled={saving}
                                    className="px-8 bg-[var(--reader-accent)] text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Link"}
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--reader-text-subtle)] italic font-light ml-1">
                                This will make the "Donate" button on your profile functional.
                            </p>
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
                        <p className="text-[10px] text-[var(--reader-text-muted)] italic font-light max-w-sm">
                            Permanent actions that cannot be undone. Exercise extreme caution within the deep archives.
                        </p>
                        <button className="px-8 py-3 rounded-full border border-red-900/30 text-[10px] uppercase tracking-[0.2em] font-bold text-red-600 hover:text-red-500 hover:border-red-500 transition-all">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            <footer className="pt-12 text-[10px] uppercase tracking-[0.5em] text-[var(--reader-text-subtle)] border-t border-[var(--reader-border)] flex justify-between items-center">
                <span>Vellum System v1.2.0</span>
                <span className="italic">Protected by the Archivist's Seal</span>
            </footer>
        </section>
    );
}
