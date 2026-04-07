/**
 * Referral Service (Archivist's Echo)
 * Handles client-side referral reward triggers and attribution.
 */

export const referralService = {
    /**
     * Awards the referral bonus to the referrer.
     * Hits the backend /api/referrals/redeem endpoint.
     */
    awardReferralBonus: async (referralCode: string, referredUserId: string) => {
        const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3000/api");
        
        try {
            const response = await fetch(`${MONETIZATION_API}/referrals/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referredUserId, referralCode })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("[ReferralService] Redemption failed:", error);
                throw new Error(error.error || "Failed to redeem referral");
            }

            return await response.json();
        } catch (error) {
            console.error("[ReferralService] Error awarding bonus:", error);
            throw error;
        }
    }
};
