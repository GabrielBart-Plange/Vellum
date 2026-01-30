"use client";

import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import ImageUpload from "@/components/ImageUpload";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (u) => {
            if (u) {
                setUser(u);
                // Fetch username from Firestore
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

    const handleLogout = async () => {
        await auth.signOut();
        router.push("/login");
    };

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
                email: user.email,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            alert("Profile updated successfully.");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-zinc-900 rounded" />
            <div className="h-4 w-64 bg-zinc-900 rounded" />
        </div>
    );

    return (
        <section className="space-y-12 pb-20">
            <header className="space-y-4">
                <h1 className="text-2xl tracking-[0.2em] font-light uppercase text-white">
                    Creator Profile
                </h1>
                <p className="text-gray-500 max-w-lg leading-relaxed text-sm">
                    This is your public identity within the Chronicles. Your banner and avatar will be shown on your author profile in the reader.
                </p>
            </header>

            <div className="max-w-4xl space-y-8">
                <div className="border border-white/5 bg-zinc-900/20 p-8 rounded-sm space-y-12">

                    {/* Public Info */}
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold italic">
                                    Public Username
                                </label>
                                <input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="e.g. Chronicler_42"
                                    className="w-full bg-black border border-white/10 p-3 text-gray-200 focus:outline-none focus:border-white/30 transition-colors text-sm"
                                />
                                <p className="text-[10px] text-gray-600 tracking-wider">This name appears on all your published work.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold italic">
                                    Biography
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell your readers about yourself..."
                                    className="w-full bg-black border border-white/10 p-3 text-gray-200 focus:outline-none focus:border-white/30 transition-colors h-40 resize-none text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold italic">
                                    Profile Avatar
                                </label>
                                <div className="flex items-start gap-4">
                                    <div className="h-24 w-24 flex-shrink-0 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} className="w-full h-full object-cover" alt="Avatar Preview" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold">?</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <ImageUpload onUploadComplete={setAvatarUrl} className="max-w-[150px]" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold italic">
                                    Profile Banner
                                </label>
                                <div className="space-y-4">
                                    <div className="h-24 w-full bg-zinc-900 border border-white/5 rounded-sm overflow-hidden bg-cover bg-center" style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : 'none' }}>
                                        {!bannerUrl && <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] uppercase tracking-widest italic">No Banner uploaded</div>}
                                    </div>
                                    <ImageUpload onUploadComplete={setBannerUrl} className="max-w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-gray-600">Connected as</p>
                            <p className="text-sm font-medium text-white">{user.email}</p>
                        </div>
                        <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-12 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-gray-200 disabled:bg-gray-500 transition-all shadow-xl"
                        >
                            {saving ? "Synchronizing..." : "Update Profile"}
                        </button>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold border-t border-white/5 pt-6 block">
                            Email Address
                        </label>
                        <p className="text-lg text-gray-200">{user.email}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                            Verification Status
                        </label>
                        <p className={`text-sm tracking-wide ${user.emailVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-bold">
                            Account Created
                        </label>
                        <p className="text-sm text-gray-400">
                            {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 border border-red-900/30 text-red-500/80 text-xs uppercase tracking-widest hover:bg-red-900/10 transition-all rounded-sm"
                    >
                        Sign out of Studio
                    </button>
                </div>
            </div>

            <footer className="pt-12 text-[10px] uppercase tracking-[0.4em] text-gray-800">
                Chronicles Identity Management v1.0
            </footer>
        </section>
    );
}
