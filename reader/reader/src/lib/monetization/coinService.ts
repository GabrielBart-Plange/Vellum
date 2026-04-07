import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { InkletWallet, VelluxWallet, VelluxTier, SubscriptionTier } from "@/types";

const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3000/api");
export const GILT_EXCHANGE_RATIO = 10;

/**
 * Fetches the user's Inklet wallet from Firestore.
 */
export async function getInkletWallet(userId: string): Promise<InkletWallet> {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            return {
                balance: data.inkletBalance ?? 0,
                lifetimeEarned: data.lifetimeEarned ?? 0,
                lifetimeSpent: data.lifetimeSpent ?? 0,
                updatedAt: data.updatedAt ?? Timestamp.now(),
                _raw: data // Pass raw data for AuthContext to pick up Gilt/Vellux
            } as any;
        }

        return createDefaultInkletWallet();
    } catch (error) {
        console.error("Error fetching inklet wallet:", error);
        return createDefaultInkletWallet();
    }
}

/**
 * Initiates an Inklet purchase.
 */
export async function purchaseInklets(userId: string, amount: number, provider: string = 'mock'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/inklets/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, provider })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Purchase error:", error);
        return false;
    }
}

/**
 * Initiates a Vellux purchase.
 */
export async function purchaseVellux(userId: string, tier: VelluxTier, provider: string = 'mock'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/vellux/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, tier, provider })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Vellux purchase error:", error);
        return false;
    }
}

/**
 * Initiates a Gilt purchase.
 */
export async function purchaseGilt(userId: string, amount: number, provider: string = 'mock'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/gilt/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, provider })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Gilt purchase error:", error);
        return false;
    }
}

/**
 * Initiates a subscription purchase/update.
 */
export async function subscribeToTier(userId: string, tier: SubscriptionTier, provider: string = 'mock'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, tier, provider })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Subscription error:", error);
        return false;
    }
}

/**
 * Sends a tip to a creator.
 */
export async function tipCreator(userId: string, username: string, creatorId: string, amount: number, currency: 'gilt' | 'inklets' = 'gilt'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/creators/${creatorId}/tip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, username, amount, currency })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Tip error:", error);
        return false;
    }
}

/**
 * Checks if a chapter is locked for a user.
 */
export async function getChapterStatus(userId: string, novelId: string, chapterId: string): Promise<{ locked: boolean; price: number }> {
    try {
        const response = await fetch(`${MONETIZATION_API}/chapters/status/${userId}/${novelId}/${chapterId}`);
        const data = await response.json();
        return {
            locked: data.locked ?? false,
            price: data.price ?? 0
        };
    } catch (error) {
        console.error("Status check error:", error);
        return { locked: false, price: 0 };
    }
}

/**
 * Unlocks a chapter for a user.
 */
export async function unlockChapter(userId: string, novelId: string, chapterId: string, currency: 'gilt' | 'inklets' = 'inklets'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/chapters/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, novelId, chapterId, currency })
        });
        const data = await response.json();
        return data.ok && data.success;
    } catch (error) {
        console.error("Unlock error:", error);
        return false;
    }
}

/**
 * Checks if a story is locked for a user.
 */
export async function getStoryStatus(userId: string, storyId: string): Promise<{ locked: boolean; price: number }> {
    try {
        const response = await fetch(`${MONETIZATION_API}/stories/status/${userId}/${storyId}`);
        const data = await response.json();
        return {
            locked: data.locked ?? false,
            price: data.price ?? 0
        };
    } catch (error) {
        console.error("Story status check error:", error);
        return { locked: false, price: 0 };
    }
}

/**
 * Unlocks a story for a user.
 */
export async function unlockStory(userId: string, storyId: string, currency: 'gilt' | 'inklets' = 'inklets'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/stories/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, storyId, currency })
        });
        const data = await response.json();
        return data.ok && data.success;
    } catch (error) {
        console.error("Story unlock error:", error);
        return false;
    }
}

/**
 * Verifies a Paystack payment with the backend.
 */
export async function verifyPaystackPayment(reference: string, userId: string, amount: number, currencyAmount: number, type: string): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/paystack/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference, userId, amount, currencyAmount, type })
        });
        const data = await response.json();
        return data.ok && data.success;
    } catch (error) {
        console.error("Payment verification error:", error);
        return false;
    }
}

function createDefaultInkletWallet(): InkletWallet {
    return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        updatedAt: Timestamp.now()
    };
}

export function createDefaultVelluxWallet(tier: VelluxTier): VelluxWallet {
    return {
        tier,
        amount: 0,
        lastReceivedAt: Timestamp.now()
    };
}

