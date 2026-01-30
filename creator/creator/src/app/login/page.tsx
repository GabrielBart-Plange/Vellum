"use client";

import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";


import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
    const router = useRouter();
    const ready = useRequireAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const form = e.currentTarget;
        const email = (form.email as HTMLInputElement).value;
        const password = (form.password as HTMLInputElement).value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Login Error:", err);
            setError("Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (err) {
            console.error("Google Login Error:", err);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-light tracking-[0.3em] uppercase">Archivist Login</h1>
                    <p className="text-xs text-gray-500 tracking-widest uppercase">Enter the chronicler's vault</p>
                </div>

                <form onSubmit={login} className="space-y-4">
                    {error && (
                        <div className="bg-red-900/20 border border-red-900 text-red-500 p-3 text-xs tracking-wide">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="your@email.com"
                            className="w-full bg-transparent border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-transparent border border-white/10 p-3 focus:outline-none focus:border-white/30 transition-colors text-sm"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? "Entering..." : "Enter Vault"}
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                            <span className="bg-black px-2 text-gray-600">or use social</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={googleLogin}
                        className="w-full border border-white/10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-colors"
                    >
                        Login with Google
                    </button>
                </form>

                <div className="text-center pt-4">
                    <p className="text-xs text-gray-600 tracking-wide">
                        New chronicler?{" "}
                        <Link href="/signup" className="text-white hover:underline transition-all">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}


