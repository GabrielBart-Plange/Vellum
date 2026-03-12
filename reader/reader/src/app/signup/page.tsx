"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createProfile = async (userId: string, displayName: string | null, mail: string | null) => {
        try {
            await setDoc(doc(db, "users", userId), {
                username: displayName || "Reader",
                email: mail || "",
                roles: ["reader"],
                createdAt: serverTimestamp(),
            }, { merge: true });
        } catch (err) {
            console.error("Reader profile creation failed:", err);
        }
    };

    const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const user = credential.user;
            await updateProfile(user, { displayName: username || user.displayName || "Reader" });
            await createProfile(user.uid, username || user.displayName, user.email);
            await sendEmailVerification(user);
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError(null);
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);
            await createProfile(credential.user.uid, credential.user.displayName, credential.user.email);
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign up with Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md space-y-12 relative z-10 text-center">
                <header className="space-y-4">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase italic">Vellum</Link>
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-bold">New Archive Protocol</p>
                </header>

                <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-8">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join with Google
                        </button>

                        <div className="flex items-center gap-4 text-zinc-700">
                            <div className="h-px flex-1 bg-zinc-900" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Register</span>
                            <div className="h-px flex-1 bg-zinc-900" />
                        </div>

                        <input
                            type="text"
                            placeholder="CHOSEN USERNAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-zinc-700 disabled:opacity-50"
                        />

                        <input
                            type="email"
                            placeholder="ARCHIVIST MAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-zinc-700 disabled:opacity-50"
                        />

                        <input
                            type="password"
                            placeholder="ACCESS CODE"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-zinc-700 disabled:opacity-50"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black uppercase tracking-widest text-xs premium-glow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating Account..." : "Initialize Scroll"}
                        </button>
                    </form>
                </div>

                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    Existing User? <Link href="/login" className="text-white hover:text-blue-400 transition-colors">SignIn</Link>
                </p>
            </div>
        </div>
    );
}
