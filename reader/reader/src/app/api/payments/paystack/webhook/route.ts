import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { paystackService } from '@/lib/monetization/paystackService';

/**
 * POST /api/payments/paystack/webhook
 * Handles asynchronous payment notifications from Paystack.
 * This is crucial for reliability if the user closes the browser before client-side verification.
 */
export async function POST(req: NextRequest) {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    
    if (!PAYSTACK_SECRET_KEY) {
        console.error("[Paystack Webhook] Secret key not configured");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 1. Verify Signature
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text(); // Need raw body for signature verification
    
    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(body)
        .digest('hex');

    if (hash !== signature) {
        console.warn("[Paystack Webhook] Invalid signature detected");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse Event
    const event = JSON.parse(body);
    
    // 3. Handle charge.success
    if (event.event === 'charge.success') {
        const data = event.data;
        const reference = data.reference;
        const metadata = data.metadata;
        
        // Extract our custom fields from metadata
        // metadata was sent as { custom_fields: [{variable_name: 'type', value: 'inklets'}, ...] }
        const customFields = metadata?.custom_fields || [];
        const typeField = customFields.find((f: any) => f.variable_name === 'type');
        const amountField = customFields.find((f: any) => f.variable_name === 'amount');
        
        const type = typeField?.value;
        const amount = amountField?.value;
        
        // We also need the userId. In our client flow, we didn't explicitly put it in custom_fields, 
        // but we can deduce it if we add it to metadata during checkout.
        // Let's assume we update the checkout to include userId in metadata.
        const userId = metadata?.userId || data.customer?.metadata?.userId;

        if (!userId || !type || !amount) {
            console.error("[Paystack Webhook] Missing required metadata in successful charge:", { reference, userId, type, amount });
            // Even if metadata is missing, we acknowledge the webhook to stop retries
            return NextResponse.json({ ok: true, message: "Acknowledged but incomplete metadata" });
        }

        try {
            console.log(`[Paystack Webhook] Processing successful charge: ${reference} for User: ${userId}`);
            
            await paystackService.processVerifiedPayment({
                reference,
                userId,
                amount: Number(amount),
                currencyAmount: data.amount / 100, // convert back to GHS from pesewas
                type,
                metadata: data.metadata
            });

            return NextResponse.json({ ok: true, status: "processed" });
        } catch (error: any) {
            console.error(`[Paystack Webhook] Error processing successful charge ${reference}:`, error.message);
            return NextResponse.json({ error: "Processing error" }, { status: 500 });
        }
    }

    // 4. Acknowledge other events (but do nothing for now)
    return NextResponse.json({ ok: true });
}
