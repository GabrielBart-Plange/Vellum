"use client";

import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, collection, query, where, getDocs } from "firebase/firestore";
import ImageUpload from "@/components/creator/ImageUpload";
import { useTheme } from "@/contexts/ThemeContext";

const THEMES = [
    { id: "void", name: "The Void (OLED)", bg: "bg-black", border: "border-white/10", accent: "bg-white" },
    { id: "archive", name: "The Archive (Sepia)", bg: "bg-[#f5f2e9]", border: "border-[#7c2d12]/20", accent: "bg-[#7c2d12]" },
    { id: "midnight", name: "The Midnight", bg: "bg-[#0f172a]", border: "border-[#38bdf8]/20", accent: "bg-[#38bdf8]" },
    { id: "light", name: "The Light", bg: "bg-white", border: "border-black/5", accent: "bg-black" },
    { id: "nebula", name: "The Nebula", bg: "bg-[#110e20]", border: "border-[#c084fc]/20", accent: "bg-[#c084fc]" },
    { id: "serene", name: "The Serene", bg: "bg-[#fff5f7]", border: "border-[#f472b6]/20", accent: "bg-[#f472b6]" },
] as const;

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { theme, setTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const unsub = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                const userRef = doc(db, "users", u.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUsername(data.username || "");
                    setBio(data.bio || "");
                    setAvatarUrl(data.avatarUrl || "");
                    setBannerUrl(data.bannerUrl || "");
                }
            } else {
                router.replace("/login");
            }
        });
        return () => unsub();
    }, [router]);

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                username,
                bio,
                avatarUrl,
                bannerUrl,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // Bulk update authorName in novels and stories
            const batch = writeBatch(db);
            let updateCount = 0;

            const syncCollection = async (collName: string, idField: string) => {
                const q = query(collection(db, collName), where(idField, "==", user.uid));
                const snap = await getDocs(q);
                snap.forEach((d) => {
                    batch.update(d.ref, { authorName: username });
                    updateCount++;
                });
            };

            await syncCollection("novels", "authorId");
            await syncCollection("novels", "creatorId");
            await syncCollection("stories", "authorId");
            await syncCollection("stories", "creatorId");

            if (updateCount > 0) {
                await batch.commit();
            }

            alert("Settings updated successfully.");
        } catch (error) {
            console.error("[Settings] Error:", error);
            alert("Failed to update settings.");
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !user) return (
        <div className="min-h-screen flex items-center justify-center text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-bold">
            Loading Archives...
        </div>
    );

    return (
        <main className="min-h-screen pb-20 pt-20 px-6">
            <div className="max-w-4xl mx-auto space-y-16">
                <header className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-[var(--reader-text)]">
                        Settings
                    </h1>
                    <p className="text-[var(--reader-text-muted)] max-w-lg text-sm leading-relaxed">
                        Customize your presence and experience within the <span className="brand-highlight">Vellum</span> ecosystem.
                    </p>
                </header>

                <div className="grid lg:grid-cols-1 gap-12">
                    {/* Profile Section */}
                    <section className="space-y-8 glass-panel p-8 rounded-3xl border-[var(--reader-border)]">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--reader-text-muted)] border-b border-[var(--reader-border)] pb-4">
                            Reader Identity
                        </h2>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-subtle)] font-black italic">
                                        Handle
                                    </label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your handle..."
                                        className="w-full bg-[var(--reader-surface)] border border-[var(--reader-border)] p-4 text-[var(--reader-text)] focus:outline-none focus:border-[var(--reader-accent)] transition-all rounded-xl text-sm"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-subtle)] font-black italic">
                                        Biography
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="About you..."
                                        className="w-full bg-[var(--reader-surface)] border border-[var(--reader-border)] p-4 text-[var(--reader-text)] focus:outline-none focus:border-[var(--reader-accent)] transition-all h-32 resize-none text-sm leading-relaxed rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-subtle)] font-black italic">
                                        Avatar
                                    </label>
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 flex-shrink-0 bg-white/5 border border-[var(--reader-border)] rounded-full overflow-hidden shadow-2xl">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--reader-text)]/20 font-black text-2xl">?</div>
                                            )}
                                        </div>
                                        <ImageUpload onUploadComplete={setAvatarUrl} className="max-w-[150px]" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text)]/50 font-black italic">
                                        Banner
                                    </label>
                                    <div className="space-y-4">
                                        <div className="h-20 w-full bg-white/5 border border-[var(--reader-border)] rounded-2xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none' }}>
                                            {!bannerUrl && <div className="w-full h-full flex items-center justify-center text-[var(--reader-text)]/10 text-[10px] uppercase tracking-widest font-bold">No Banner</div>}
                                        </div>
                                        <ImageUpload onUploadComplete={setBannerUrl} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="space-y-8 glass-panel p-8 rounded-3xl border-[var(--reader-border)]">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--reader-text)]/60 border-b border-[var(--reader-border)] pb-4">
                            Loom of Appearance
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all p-4 text-left ${theme === t.id
                                        ? "border-[var(--reader-accent)] bg-[var(--reader-accent)]/5"
                                        : "border-white/5 bg-white/[0.02] hover:border-white/20"
                                        }`}
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className={`h-12 w-full rounded-lg ${t.bg} ${t.border} flex items-center justify-center`}>
                                            <div className={`h-4 w-4 rounded-full ${t.accent} opacity-50 shadow-lg`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme === t.id ? 'text-[var(--reader-accent)]' : 'text-[var(--reader-text)]/60'}`}>
                                            {t.name}
                                        </span>
                                    </div>
                                    {theme === t.id && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--reader-accent)] animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-16 py-5 bg-[var(--reader-text)] text-[var(--reader-bg)] text-[11px] uppercase tracking-[0.4em] font-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all rounded-full shadow-[0_20px_50px_-10px_rgba(255,255,255,0.1)]"
                        >
                            {saving ? "Rewriting Chronicle..." : "Commit Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
