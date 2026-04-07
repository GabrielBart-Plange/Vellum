"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            // Store referral ID in session storage to persist until signup
            // We use session storage because it's safer for one-off referrals
            // but persistent enough for a single session signup.
            if (typeof window !== "undefined") {
                sessionStorage.setItem("vellum_referral_id", ref);
                console.log(`[Referral Tracker] Captured referral code: ${ref}`);
            }
        }
    }, [searchParams]);

    return null; // This component doesn't render anything
}
