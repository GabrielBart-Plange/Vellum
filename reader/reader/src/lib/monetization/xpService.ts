import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { XPProfile } from "@/types";

// XP thresholds per level (cumulative)
// L0  L1  L2   L3   L4   L5   L6    L7    L8    L9
export const XP_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2600, 3600];

/**
 * Returns the current level (0-9) based on cumulative XP.
 * Level 10 (Chronicler) is an Ascension fee-locked state, not purely XP-based.
 */
export function getLevelFromXP(xp: number): number {
    let level = 0;
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= XP_THRESHOLDS[i]) {
            return i;
        }
    }
    return level;
}

/**
 * Calculates current progress toward the next level.
 */
export function getProgressToNextLevel(xp: number): {
    current: number;
    required: number;
    pct: number;
    isAtCap: boolean
} {
    const currentLevel = getLevelFromXP(xp);

    if (currentLevel >= XP_THRESHOLDS.length - 1) {
        return { current: 0, required: 0, pct: 100, isAtCap: true };
    }

    const currentLevelThreshold = XP_THRESHOLDS[currentLevel];
    const nextLevelThreshold = XP_THRESHOLDS[currentLevel + 1];

    const currentLevelXP = xp - currentLevelThreshold;
    const xpNeededForNext = nextLevelThreshold - currentLevelThreshold;
    const pct = Math.min(Math.round((currentLevelXP / xpNeededForNext) * 100), 100);

    return {
        current: currentLevelXP,
        required: xpNeededForNext,
        pct,
        isAtCap: false
    };
}

/**
 * Fetches the user's XP profile from Firestore.
 * Returns a default profile if the document doesn't exist.
 */
export async function getXPProfile(userId: string): Promise<XPProfile> {
    try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
            const data = snap.data();
            return {
                xp: data.xp ?? 0,
                level: data.level ?? 0,
                isChronicler: data.isChronicler ?? false,
                chroniclerStatus: data.chroniclerStatus ?? 'none',
                legacyPoints: data.legacyPoints ?? 0,
                updatedAt: data.updatedAt ?? Timestamp.now()
            };
        }

        return createDefaultXPProfile();
    } catch (error) {
        console.error("Error fetching XP profile:", error);
        return createDefaultXPProfile();
    }
}

function createDefaultXPProfile(): XPProfile {
    return {
        xp: 0,
        level: 0,
        isChronicler: false,
        chroniclerStatus: 'none',
        legacyPoints: 0,
        updatedAt: Timestamp.now()
    };
}
