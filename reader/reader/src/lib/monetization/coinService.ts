import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { EssenceWallet } from "@/types";

const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || "http://localhost:3001/api";

/**
 * Fetches the user's Essence (Coin) wallet from Firestore.
 */
export async function getEssenceWallet(userId: string): Promise<EssenceWallet> {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            return {
                balance: data.essenceBalance ?? 0,
                lifetimeEarned: data.lifetimeEarned ?? 0,
                lifetimeSpent: data.lifetimeSpent ?? 0,
                updatedAt: data.updatedAt ?? Timestamp.now()
            };
        }

        return createDefaultWallet();
    } catch (error) {
        console.error("Error fetching essence wallet:", error);
        return createDefaultWallet();
    }
}

/**
 * Initiates a coin purchase.
 */
export async function purchaseCoins(userId: string, amount: number, provider: string = 'mock'): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/payments/coins/purchase`, {
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
 * Sends a tip to a creator.
 */
export async function tipCreator(userId: string, username: string, creatorId: string, amount: number): Promise<boolean> {
    try {
        const response = await fetch(`${MONETIZATION_API}/creators/${creatorId}/tip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, username, amount })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error("Tip error:", error);
        return false;
    }
}

function createDefaultWallet(): EssenceWallet {
    return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        updatedAt: Timestamp.now()
    };
}

