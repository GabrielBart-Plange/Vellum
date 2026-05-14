import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const PAYOUT_THRESHOLD_GHS = 200;

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data()!;
        const currentBalance = userData.payoutBalance ?? 0;

        // Enforce minimum threshold
        if (currentBalance < PAYOUT_THRESHOLD_GHS) {
            return NextResponse.json({
                ok: false,
                error: `Minimum payout threshold is GHS ${PAYOUT_THRESHOLD_GHS}. Current balance: GHS ${currentBalance.toFixed(2)}.`
            }, { status: 400 });
        }

        // Check for an existing pending request
        const existingRequests = await db.collection('payout_requests')
            .where('authorId', '==', userId)
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (!existingRequests.empty) {
            return NextResponse.json({ ok: false, error: 'You already have a pending withdrawal request.' }, { status: 409 });
        }

        // Fetch payout details from vault
        const payoutSnap = await userRef.collection('private').doc('payout').get();
        const payoutData = payoutSnap.data() || {};

        // Atomically create request and zero-out balance
        await db.runTransaction(async (transaction) => {
            // Re-read balance inside transaction to be safe
            const freshUser = await transaction.get(userRef);
            const freshBalance = freshUser.data()?.payoutBalance ?? 0;

            if (freshBalance < PAYOUT_THRESHOLD_GHS) {
                throw new Error(`Insufficient balance: GHS ${freshBalance.toFixed(2)}`);
            }

            const requestRef = db.collection('payout_requests').doc();
            transaction.set(requestRef, {
                authorId: userId,
                amount: freshBalance,
                status: 'pending',
                requestedAt: FieldValue.serverTimestamp(),
                mobileMoneyNumber: payoutData.mobileMoneyNumber ?? null,
                mobileMoneyProvider: payoutData.mobileMoneyProvider ?? null,
            });

            // Zero out the balance — it's now "locked in" for payout
            transaction.update(userRef, {
                payoutBalance: 0,
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({ ok: true, success: true });
    } catch (error: any) {
        console.error('Payout request error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
