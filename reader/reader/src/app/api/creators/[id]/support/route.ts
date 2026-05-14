import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Vellux token base GHS values (as per monetization_strategy.md)
const VELLUX_GHS_VALUES: Record<string, number> = {
    gold: 50,
    diamond: 100,
    platinum: 250,
};

const AUTHOR_VELLUX_SPLIT = 0.30; // 30% to author

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const creatorId = params.id;
        const { userId, username, tier } = await request.json();

        if (!userId || !tier) {
            return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
        }

        const tierLower = tier.toLowerCase();
        const tokenGHSValue = VELLUX_GHS_VALUES[tierLower];

        if (!tokenGHSValue) {
            return NextResponse.json({ ok: false, error: `Invalid Vellux tier: ${tier}. Must be gold, diamond, or platinum.` }, { status: 400 });
        }

        const velluxField = `vellux_${tierLower}_balance`;
        const creatorRef = db.collection('users').doc(creatorId);
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
            const [userDoc, creatorDoc] = await Promise.all([
                transaction.get(userRef),
                transaction.get(creatorRef),
            ]);

            if (!userDoc.exists || !creatorDoc.exists) {
                throw new Error('User or Creator not found');
            }

            const userData = userDoc.data();
            const userVelluxBalance = userData?.[velluxField] || 0;

            if (userVelluxBalance < 1) {
                throw new Error(`Insufficient ${tier} Vellux tokens`);
            }

            // Deduct token from gifter
            transaction.update(userRef, {
                [velluxField]: FieldValue.increment(-1),
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Route 30% GHS value to author's payoutBalance
            const authorShareGHS = tokenGHSValue * AUTHOR_VELLUX_SPLIT;
            transaction.update(creatorRef, {
                payoutBalance: FieldValue.increment(authorShareGHS),
                lifetimeVelluxReceived: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
            });

            // Log the transaction
            const logRef = db.collection('transactions').doc();
            transaction.set(logRef, {
                type: 'vellux_support',
                from: userId,
                fromName: username,
                to: creatorId,
                tier: tierLower,
                tokenGHSValue,
                authorShareGHS,
                timestamp: FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({ ok: true, success: true });
    } catch (error: any) {
        console.error('Vellux support error:', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
