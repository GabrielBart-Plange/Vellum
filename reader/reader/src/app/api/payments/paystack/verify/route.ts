import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
  const { reference, userId, amount, currencyAmount, priceGHS, type } = await req.json();
  const finalCurrencyAmount = currencyAmount || priceGHS;

  if (!reference || !userId) {
    return NextResponse.json({ ok: false, error: 'Missing reference or userId' }, { status: 400 });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'Paystack secret key not configured' }, { status: 500 });
  }

  try {
    // 1. Verify with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const paystackJson = await paystackRes.json();

    if (!paystackJson.status || paystackJson.data?.status !== 'success') {
      return NextResponse.json({ ok: false, error: 'Payment verification failed' }, { status: 400 });
    }

    const paystackData = paystackJson.data;

    // 2. Amount sanity check (Paystack returns amount in pesewas)
    if (finalCurrencyAmount && Math.abs(paystackData.amount - Math.round(finalCurrencyAmount * 100)) > 1) {
      return NextResponse.json({ ok: false, error: 'Amount mismatch' }, { status: 400 });
    }

    // 3. Update Firestore via Admin SDK
    const userRef = adminDb.collection('users').doc(userId);

    await adminDb.runTransaction(async (tx: any) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('User not found');

      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (type === 'gilt') {
        updates.giltBalance = admin.firestore.FieldValue.increment(amount);
      } else if (type === 'inklets') {
        updates.inkletBalance = admin.firestore.FieldValue.increment(amount);
      } else if (type?.startsWith('sub_')) {
        const tier = type.replace('sub_', '');
        const expiresAt = new Date();
        if (tier === 'prime') expiresAt.setDate(expiresAt.getDate() + 7);
        else if (tier === 'nexus') expiresAt.setMonth(expiresAt.getMonth() + 1);
        updates.subscriptionTier = tier;
        updates.subscriptionStatus = 'active';
        updates.subscriptionExpiresAt = admin.firestore.Timestamp.fromDate(expiresAt);
        updates.subscriptionUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      tx.update(userRef, updates);

      // Record transaction (idempotent — keyed by reference)
      const txRef = adminDb.collection('transactions').doc(reference);
      tx.set(txRef, {
        userId,
        amount,
        currencyAmount: finalCurrencyAmount,
        reference,
        type: type || 'inklets',
        provider: 'paystack',
        status: 'success',
        paystackData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    console.error('[API /payments/paystack/verify]', error.message);
    return NextResponse.json({ ok: false, error: 'Internal verification error' }, { status: 500 });
  }
}
