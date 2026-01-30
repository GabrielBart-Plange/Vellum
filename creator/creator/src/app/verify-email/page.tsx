"use client";

import { auth } from "@/lib/firebase";
import { sendEmailVerification, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const resend = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    alert("Verification email sent.");
  };

  const recheck = async () => {
    if (!auth.currentUser) return;

    setChecking(true);
    await auth.currentUser.reload();

    if (auth.currentUser.emailVerified) {
      router.push("/dashboard");
    } else {
      setChecking(false);
      alert("Email not verified yet.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-gray-200">
      <div className="w-full max-w-md border border-gray-800 p-8 space-y-4 text-center">
        <h1 className="tracking-widest">VERIFY YOUR EMAIL</h1>

        <p className="text-sm text-gray-400">
          You must verify your email before accessing the creator dashboard.
        </p>

        <button
          onClick={recheck}
          disabled={checking}
          className="w-full border py-2 disabled:opacity-50"
        >
          {checking ? "Checking…" : "I’ve verified my email"}
        </button>

        <button
          onClick={resend}
          className="w-full border border-gray-600 py-2 text-sm"
        >
          Resend verification email
        </button>

        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-white"
        >
          Back to login
        </button>
      </div>
    </main>
  );
}
