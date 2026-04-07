import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/monetization/paystackService';

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

    // 3. Process and update Firestore via Service (Transaction + Idempotent)
    await paystackService.processVerifiedPayment({
      reference,
      userId,
      amount,
      currencyAmount: finalCurrencyAmount,
      type,
      metadata: paystackData.metadata
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    console.error('[API /payments/paystack/verify]', error.message);
    return NextResponse.json({ ok: false, error: 'Internal verification error' }, { status: 500 });
  }
}
