import { NextRequest, NextResponse } from 'next/server';
import { paystackService } from '@/lib/monetization/paystackService';

export async function POST(req: NextRequest) {
  // Only extract the reference to check with Paystack. Do not trust other fields.
  const { reference, userId } = await req.json();

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
    const metadata = paystackData.metadata;

    // 2. Extract verified parameters directly from Paystack metadata
    const customFields = metadata?.custom_fields || [];
    const typeField = customFields.find((f: any) => f.variable_name === 'type');
    const amountField = customFields.find((f: any) => f.variable_name === 'amount');

    const verifiedType = typeField?.value;
    const verifiedAmount = amountField?.value;
    const verifiedCurrencyAmount = paystackData.amount / 100; // Convert from pesewas to GHS

    if (!verifiedType || !verifiedAmount) {
      return NextResponse.json({ ok: false, error: 'Missing secure metadata in transaction' }, { status: 400 });
    }

    // 3. Process and update Firestore via Service
    await paystackService.processVerifiedPayment({
      reference,
      userId, // We keep the user session id
      amount: Number(verifiedAmount),
      currencyAmount: verifiedCurrencyAmount,
      type: verifiedType,
      metadata: metadata
    });

    return NextResponse.json({ ok: true, success: true });
  } catch (error: any) {
    console.error('[API /payments/paystack/verify]', error.message);
    return NextResponse.json({ ok: false, error: 'Internal verification error' }, { status: 500 });
  }
}
