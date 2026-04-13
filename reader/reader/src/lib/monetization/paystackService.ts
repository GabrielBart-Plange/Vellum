import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export interface PaystackTransactionParams {
    reference: string;
    userId: string;
    amount: number; // The logic-side amount (e.g. 100 Inklets)
    currencyAmount: number; // The actual money paid (e.g. 2.00 GHS)
    type: string; // 'gilt', 'inklets', 'sub_plus', 'sub_pro'
    metadata?: any;
}

/**
 * Core service for processing verified Paystack payments.
 * Shared between client-side verification and webhooks.
 */
export const paystackService = {
    /**
     * Processes a verified transaction and updates user balances.
     * This is idempotent based on the Paystack reference.
     */
    processVerifiedPayment: async (params: PaystackTransactionParams) => {
        const { reference, userId, amount, currencyAmount, type, metadata } = params;

        const userRef = adminDb.collection('users').doc(userId);
        const txRef = adminDb.collection('transactions').doc(reference);

        try {
            return await adminDb.runTransaction(async (tx: admin.firestore.Transaction) => {
                // 1. Check if transaction already processed
                const txSnap = (await tx.get(txRef)) as unknown as admin.firestore.DocumentSnapshot;
                if (txSnap.exists) {
                    return { success: true, alreadyProcessed: true };
                }

                // 2. Get user profile
                const userSnap = (await tx.get(userRef)) as unknown as admin.firestore.DocumentSnapshot;
                if (!userSnap.exists) {
                    throw new Error(`User ${userId} not found`);
                }

                const updates: any = {
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };

                // 3. Determine reward based on type
                if (type === 'gilt') {
                    updates.giltBalance = admin.firestore.FieldValue.increment(amount);
                } else if (type === 'inklets') {
                    updates.inkletBalance = admin.firestore.FieldValue.increment(amount);
                } else if (type?.startsWith('sub_')) {
                    const tier = type.replace('sub_', '');
                    const expiresAt = new Date();
                    
                    if (tier === 'plus') {
                        expiresAt.setDate(expiresAt.getDate() + 7);
                        // Vellum Plus Bonus: 50 Inklets
                        updates.inkletBalance = admin.firestore.FieldValue.increment(50);
                    } else if (tier === 'pro') {
                        expiresAt.setMonth(expiresAt.getMonth() + 1);
                        // Vellum Pro Bonus: 1 Gold Vellux
                        updates.vellux_gold_balance = admin.firestore.FieldValue.increment(1);
                    }
                    
                    updates.subscriptionTier = tier;
                    updates.subscriptionStatus = 'active';
                    updates.subscriptionExpiresAt = admin.firestore.Timestamp.fromDate(expiresAt);
                    updates.subscriptionUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
                }

                // 4. Update User
                tx.update(userRef, updates);

                // 5. Record Transaction
                tx.set(txRef, {
                    id: reference,
                    userId,
                    amount,
                    currencyAmount,
                    currency: 'GHS',
                    reference,
                    type: type || 'inklets',
                    provider: 'paystack',
                    status: 'completed',
                    metadata: metadata || {},
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // 6. Log Global Activity
                const activityRef = adminDb.collection('global_activity').doc();
                const activityType = type?.startsWith('sub_') ? 'subscription_purchase' : (type === 'gilt' ? 'gilt_purchase' : 'inklet_purchase');
                
                tx.set(activityRef, {
                    type: activityType,
                    userId,
                    user: userSnap.data()?.username || 'A Seeker',
                    target: type === 'gilt' ? `${amount} Gilt` : (type === 'inklets' ? `${amount} Inklets` : `${type.replace('sub_', '').toUpperCase()} Access`),
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });

                return { success: true };
            });
        } catch (error) {
            console.error(`[PaystackService] Error processing payment ${reference}:`, error);
            throw error;
        }
    }
};
