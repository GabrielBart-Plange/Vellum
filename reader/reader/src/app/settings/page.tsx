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
        <div className="min-h-screen bg-[#0b0a0f] flex items-center justify-center text-[10px] uppercase tracking-[0.8em] text-zinc-700 font-black italic">
            Loading Settings...
        </div>
    );

    return (
        <main className="min-h-screen pb-20 pt-20 px-6">
            <div className="max-w-4xl mx-auto space-y-16">
                <header className="space-y-6 border-l-2 border-[var(--reader-accent)]/30 pl-10">
                    <p className="text-[10px] uppercase tracking-[0.8em] text-zinc-500 font-black italic">Personal Calibration</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-[var(--reader-text)] italic leading-[0.8]">
                        THE <br />SETTINGS
                    </h1>
                    <p className="text-[var(--reader-text-muted)] max-w-lg text-[11px] uppercase tracking-[0.2em] font-black italic leading-relaxed">
                        Refine your presence and tune your experience within the <span className="brand-highlight">Vellum</span> ecosystem.
                    </p>
                </header>

                <div className="grid lg:grid-cols-1 gap-12">
                    {/* Persona Section */}
                    <section className="space-y-10 glass-panel p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Identification</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white italic">
                                Profile Identity
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                        Username
                                    </label>
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Choose your moniker..."
                                        className="w-full bg-white/[0.03] border border-white/5 p-5 text-white focus:outline-none focus:border-[var(--reader-accent)]/40 focus:ring-4 focus:ring-[var(--reader-accent)]/5 transition-all rounded-2xl text-sm font-black italic tracking-widest placeholder:text-zinc-800"
                                        title="Your public display name"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                        Biography
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Write your story for the community..."
                                        className="w-full bg-white/[0.03] border border-white/5 p-5 text-white focus:outline-none focus:border-[var(--reader-accent)]/40 focus:ring-4 focus:ring-[var(--reader-accent)]/5 transition-all h-40 resize-none text-sm leading-relaxed rounded-2xl font-black italic placeholder:text-zinc-800"
                                        title="Share a bit about yourself"
                                    />
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                        Avatar Image
                                    </label>
                                    <div className="flex items-center gap-8">
                                        <div className="h-24 w-24 flex-shrink-0 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative group/img">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" alt="Avatar" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black text-3xl">?</div>
                                            )}
                                        </div>
                                        <ImageUpload onUploadComplete={setAvatarUrl} className="max-w-[180px]" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black italic">
                                        Profile Banner
                                    </label>
                                    <div className="space-y-4">
                                        <div className="h-24 w-full bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden bg-cover bg-center shadow-inner group/banner relative" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none' }}>
                                            {!bannerUrl && <div className="w-full h-full flex items-center justify-center text-zinc-800 text-[10px] uppercase tracking-widest font-black italic">Default Banner</div>}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/banner:opacity-100 transition-opacity" />
                                        </div>
                                        <ImageUpload onUploadComplete={setBannerUrl} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Appearance Section */}
                    <section className="space-y-10 glass-panel p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.5 3.5L12 9l-3.5-3.5L12 2zM2 12l3.5 3.5L2 19l-3.5-3.5L2 12zM22 12l3.5 3.5L22 19l-3.5-3.5L22 12zM12 15l3.5 3.5L12 22l-3.5-3.5L12 15z"/></svg>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--reader-accent)] font-black italic">Environment</p>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white italic">
                                Loom of Appearance
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                    className={`group relative overflow-hidden rounded-3xl border transition-all p-6 text-left ${theme === t.id
                                        ? "border-[var(--reader-accent)] bg-[var(--reader-accent)]/5 shadow-[0_10px_30px_-5px_rgba(139,92,246,0.2)]"
                                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                                        }`}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className={`h-16 w-full rounded-2xl ${t.bg} ${t.border} flex items-center justify-center border shadow-inner`}>
                                            <div className={`h-6 w-6 rounded-full ${t.accent} opacity-40 shadow-xl group-hover:scale-110 transition-transform`} />
                                        </div>
                                        <div className="space-y-1">
                                            <span className={`text-[11px] font-black uppercase tracking-widest italic leading-none block ${theme === t.id ? 'text-[var(--reader-accent)]' : 'text-zinc-500'}`}>
                                                {t.name}
                                            </span>
                                            {theme === t.id && <p className="text-[8px] font-black uppercase tracking-widest text-[var(--reader-accent)]/60">Active Theme</p>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-center pt-8">
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-20 py-6 bg-white text-black text-[11px] uppercase tracking-[0.5em] font-black hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 transition-all rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)] italic"
                            title="Preserve your persona in the archives"
                        >
                            {saving ? "Saving Changes..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
