"use client";

import { Suspense, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

function SignOutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    useEffect(() => {
        const signOut = async () => {
            try {
                await auth.signOut();
            } finally {
                if (next) {
                    router.replace(next);
                } else {
                    router.replace("/login");
                }
            }
        };

        signOut();
    }, [next, router]);

    return (
        <main className="min-h-screen flex items-center justify-center text-[var(--reader-text)]">
            Signing out...
        </main>
    );
}

export default function CreatorSignOutPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center text-[var(--reader-text)]">
                    Signing out...
                </main>
            }
        >
            <SignOutContent />
        </Suspense>
    );
}
