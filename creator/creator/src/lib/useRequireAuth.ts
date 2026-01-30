"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "./firebase";
import { User } from "firebase/auth";

export function useRequireAuth() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((user: User | null) => {
            if (!user) {
                router.replace("/login");
                return;
            }

            if (!user.emailVerified) {
                router.replace("/verify-email");
                return;
            }

            setReady(true);
        });

        return () => unsub();
    }, [router]);

    return ready;
}
