"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isResetMode, setIsResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signInWithGoogle, resetPassword } = useAuth();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isResetMode) {
                await resetPassword(email);
                setResetSent(true);
            } else {
                await signIn(email, password);
                const returnUrl = searchParams.get('returnUrl') || '/';
                router.push(returnUrl);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred. Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);

        try {
            await signInWithGoogle();
            router.push('/');
        } catch (err) {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    if (resetSent) {
        return (
            <main className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="w-full max-w-md space-y-8 text-center glass-panel p-10 rounded-3xl border border-white/5">
                    <header className="space-y-4">
                        <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase italic">Vellum</Link>
                        <p className="text-[10px] uppercase tracking-[0.6em] text-green-500 font-bold">Reset Protocol Sent</p>
                    </header>
                    <p className="text-sm text-zinc-400">Check your mail for the archival access reset link.</p>
                    <button
                        onClick={() => { setIsResetMode(false); setResetSent(false); }}
                        className="w-full py-4 rounded-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all transition-all"
                    >
                        Back to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md space-y-12 relative z-10 text-center">
                <header className="space-y-4">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase italic">Vellum</Link>
                    <p className="text-[10px] uppercase tracking-[0.6em] text-zinc-500 font-bold">
                        {isResetMode ? "Recovery Protocol" : "Authentication Node"}
                    </p>
                </header>

                <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
                                {error}
                            </div>
                        )}

                        <input
                            type="email"
                            placeholder="ARCHIVIST MAIL"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-zinc-700 disabled:opacity-50"
                        />

                        {!isResetMode && (
                            <input
                                type="password"
                                placeholder="ACCESS CODE"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-6 py-4 text-xs font-black tracking-widest focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-zinc-700 disabled:opacity-50"
                            />
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Processing...' : (isResetMode ? 'Send Reset Link' : 'Enter Archives')}
                        </button>

                        <div className="flex justify-between items-center px-1">
                            <button
                                type="button"
                                onClick={() => setIsResetMode(!isResetMode)}
                                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors font-bold"
                            >
                                {isResetMode ? "Back to Login" : "Forgot Access Code?"}
                            </button>
                        </div>

                        {!isResetMode && (
                            <>
                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                        <span className="bg-black px-4 text-zinc-600">or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-xl border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                        <path fill="#FFFFFF" d="M12.24 10.285V14.4H19.046C18.771 16.165 16.99 19.574 12.24 19.574C8.145 19.574 4.801 16.185 4.801 12C4.801 7.815 8.145 4.426 12.24 4.426C14.57 4.426 16.131 5.415 17.025 6.275L20.279 3.137C18.189 1.186 15.479 0 12.24 0C5.605 0 0.245 5.365 0.245 12C0.245 18.635 5.605 24 12.24 24C19.166 24 23.76 19.131 23.76 12.274C23.76 11.486 23.675 10.884 23.571 10.285H12.24Z" />
                                    </svg>
                                    Google
                                </button>
                            </>
                        )}
                    </form>
                </div>

                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    New Archivist? <Link href="/signup" className="text-white hover:text-[var(--accent-sakura)] transition-colors">Join the Archives</Link>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-black flex items-center justify-center px-6">
                <div className="text-white">Loading...</div>
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}
