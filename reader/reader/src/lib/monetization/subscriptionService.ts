import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { SubscriptionTier } from "@/types";

/**
 * Fetches the user's subscription tier from Firestore.
 * Defaults to 'free' if no tier is found or an error occurs.
 */
export async function getSubscriptionTier(userId: string): Promise<{
    tier: SubscriptionTier;
    expiresAt: Timestamp | null;
}> {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            return {
                tier: (data.subscriptionTier as SubscriptionTier) ?? 'free',
                expiresAt: data.subscriptionExpiresAt ?? null
            };
        }

        return { tier: 'free', expiresAt: null };
    } catch (error) {
        console.error("Error fetching subscription tier:", error);
        return { tier: 'free', expiresAt: null };
    }
}

/**
 * Helper to check if a tier has ad-free benefits.
 */
export function isAdFree(tier: SubscriptionTier): boolean {
    return tier === 'prime' || tier === 'nexus';
}

/**
 * Helper to check if a tier has early access benefits.
 */
export function hasEarlyAccess(tier: SubscriptionTier): boolean {
    return tier === 'prime' || tier === 'nexus';
}

/**
 * Gets the XP multiplier based on the subscription tier.
 */
export function getXPMultiplier(tier: SubscriptionTier): number {
    switch (tier) {
        case 'nexus': return 2.0;
        case 'prime': return 1.5;
        default: return 1.0;
    }
}

/**
 * Gets the monthly Essence Coin bonus for a tier.
 */
export function getMonthlyCoinBonus(tier: SubscriptionTier): number {
    switch (tier) {
        case 'nexus': return 60;
        case 'prime': return 20;
        default: return 0;
    }
}
