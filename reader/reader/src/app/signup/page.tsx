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
                <header className="space-y-6">
                    <Link href="/" className="text-3xl font-black tracking-tighter text-white uppercase italic">Vellum</Link>
                    <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-black italic">Member Access</p>
                        <div className="h-px w-12 bg-[var(--reader-accent)]/30 mx-auto" />
                    </div>
                </header>

                <div className="glass-panel p-12 rounded-[2.5rem] border border-white/5 space-y-10 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--reader-accent)]/5 blur-3xl rounded-full" />
                    
                    <form onSubmit={handleSignup} className="space-y-8">
                        {error && (
                            <div role="alert" className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest italic animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] active:scale-95 italic flex items-center justify-center gap-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12.24 10.285V14.4H19.046C18.771 16.165 16.99 19.574 12.24 19.574C8.145 19.574 4.801 16.185 4.801 12C4.801 7.815 8.145 4.426 12.24 4.426C14.57 4.426 16.131 5.415 17.025 6.275L20.279 3.137C18.189 1.186 15.479 0 12.24 0C5.605 0 0.245 5.365 0.245 12C0.245 18.635 5.605 24 12.24 24C19.166 24 23.76 19.131 23.76 12.274C23.76 11.486 23.675 10.884 23.571 10.285H12.24Z" />
                            </svg>
                            Sign Up with Google
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.4em] font-black italic">
                                <span className="px-6 text-[var(--reader-text)]/30" style={{ backgroundColor: 'var(--reader-bg)' }}>or etch a new identity</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="USERNAME"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-[10px] font-black tracking-[0.2em] focus:outline-none focus:border-[var(--reader-accent)]/40 focus:ring-4 focus:ring-[var(--reader-accent)]/5 transition-all text-white placeholder:text-zinc-800 disabled:opacity-50 italic"
                            />

                            <input
                                type="email"
                                placeholder="EMAIL ADDRESS"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-[10px] font-black tracking-[0.2em] focus:outline-none focus:border-[var(--reader-accent)]/40 focus:ring-4 focus:ring-[var(--reader-accent)]/5 transition-all text-white placeholder:text-zinc-800 disabled:opacity-50 italic"
                            />

                            <input
                                type="password"
                                placeholder="PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-[10px] font-black tracking-[0.2em] focus:outline-none focus:border-[var(--reader-accent)]/40 focus:ring-4 focus:ring-[var(--reader-accent)]/5 transition-all text-white placeholder:text-zinc-800 disabled:opacity-50 italic"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 rounded-2xl bg-[var(--reader-accent)] text-white font-black uppercase tracking-[0.3em] text-[11px] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] active:scale-95 italic"
                        >
                            {loading ? "Etching Identity..." : "Sign Up"}
                        </button>
                    </form>
                </div>

                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] italic">
                    Already a Reader? <Link href="/login" className="text-white hover:text-[var(--reader-accent)] transition-all ml-2 border-b border-white/10 pb-0.5">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
