"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, updateProfile } from "firebase/auth";
import { syncCreatorProfile } from "@/lib/syncUser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Auth Profile (Display Name)
            await updateProfile(user, { displayName: username });

            // 3. Create/Sync Firestore Profile
            await syncCreatorProfile(user, username);

            await sendEmailVerification(user);
            console.log("User registered and profile created.");
            router.push("/verify-email");
        } catch (err: unknown) {
            console.error("Signup Error:", err);
            setError((err as Error).message || "Failed to create account.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError("");
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);
            await syncCreatorProfile(credential.user, credential.user.displayName || undefined);
            router.push("/dashboard");
        } catch (err: unknown) {
            console.error("Google Signup Error:", err);
            setError((err as Error).message || "Failed to sign up with Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-light tracking-[0.3em] uppercase">Join the Archive</h1>
                    <p className="text-xs text-gray-500 tracking-widest uppercase">Create your creator account</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 text-xs tracking-wide">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleSignup}
                        disabled={loading}
                        className="w-full border border-white/10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Join with Google
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="bg-black px-2 text-gray-600">or use email</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Username</label>
                        <input
                            required
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Pen name or handle"
                            className="w-full bg-transparent border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-transparent border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-transparent border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="text-center pt-4">
                    <p className="text-xs text-gray-600 tracking-wide">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:underline transition-all">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
