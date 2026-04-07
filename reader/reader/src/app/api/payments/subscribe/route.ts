import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

/**
 * POST /api/payments/subscribe
 * Logic to update a user's subscription tier and grant bonuses.
 * Migrated from monetization-srv for unified deployment.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, tier, provider } = await req.json();

    if (!userId || !tier) {
      return NextResponse.json({ ok: false, error: "Missing userId or tier" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const expiresAt = new Date();
    
    // Set expiration based on tier (Plus: 1 week, Pro: 1 month)
    if (tier === 'plus') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (tier === 'pro') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await adminDb.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userSnap = (await transaction.get(userRef)) as unknown as admin.firestore.DocumentSnapshot;
      if (!userSnap.exists) throw new Error("User not found");

      // 1. Update Subscription Data
      const updates: any = {
        subscriptionTier: tier,
        subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        subscriptionStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // 2. Grant Bonuses
      if (tier === 'plus') {
        // Vellum Plus: 50 Inklets bonus
        updates.inkletBalance = admin.firestore.FieldValue.increment(50);
      } else if (tier === 'pro') {
        // Vellum Pro: 1 Gold Vellux bonus
        updates.vellux_gold_balance = admin.firestore.FieldValue.increment(1);
      }

      transaction.update(userRef, updates);

      // 3. Log Transaction
      const transRef = adminDb.collection("transactions").doc();
      transaction.set(transRef, {
        id: transRef.id,
        userId,
        type: 'subscription_update',
        tier,
        provider: provider || 'manual',
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[API Subscribe] Successfully updated ${userId} to ${tier}`);
    return NextResponse.json({ ok: true, message: `Subscribed to ${tier} successfully` });

  } catch (error: any) {
    console.error("[API Subscribe] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
