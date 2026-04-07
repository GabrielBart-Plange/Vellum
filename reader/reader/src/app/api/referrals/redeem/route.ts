import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

/**
 * POST /api/referrals/redeem
 * Awards Inklets to a referrer when a new user signs up.
 * Migrated from monetization-srv for unified deployment.
 */
export async function POST(req: NextRequest) {
  try {
    const { referredUserId, referralCode } = await req.json();

    if (!referredUserId || !referralCode) {
      return NextResponse.json({ ok: false, error: "Missing referredUserId or referralCode" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 1. Find the referrer
    const referrerQuery = await adminDb.collection("users").where("referralId", "==", referralCode).limit(1).get();
    
    if (referrerQuery.empty) {
      return NextResponse.json({ ok: false, error: "Referral code not found" }, { status: 404 });
    }

    const referrerDoc = referrerQuery.docs[0];
    const referrerData = referrerDoc.data();
    const referrerId = referrerDoc.id;
    const referrerTier = referrerData.subscriptionTier || 'free';
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';

    // 2. Prevent self-referral
    if (referrerId === referredUserId) {
      return NextResponse.json({ ok: false, error: "Self-referral is not allowed" }, { status: 400 });
    }

    // 3. Anti-Fraud: Limit rewards per IP (preventing script farming)
    if (clientIp !== 'unknown') {
        const ipUsageQuery = await adminDb.collection("transactions")
            .where("type", "==", "referral_reward")
            .where("ip", "==", clientIp)
            .get();
        
        if (ipUsageQuery.size >= 5) {
            console.warn(`[API Referrals] Blocked suspicious referral activity from IP: ${clientIp}`);
            return NextResponse.json({ 
                ok: false, 
                error: "Suspicious activity detected. Multiple referrals from the same network are restricted." 
            }, { status: 403 });
        }
    }

    // 4. Enforce Tier-Based Limits (Pro: 50, Plus: 25, Free: 10)
    const rewardCountQuery = await adminDb.collection("transactions")
      .where("userId", "==", referrerId)
      .where("type", "==", "referral_reward")
      .get();

    const currentCount = rewardCountQuery.size;
    let limit = 10;
    if (referrerTier === 'plus') limit = 25;
    else if (referrerTier === 'pro') limit = 50;

    if (currentCount >= limit) {
      return NextResponse.json({ 
        ok: false, 
        error: `Referral reward limit reached for ${referrerTier} tier (Max ${limit})` 
      }, { status: 403 });
    }

    // 4. Check if this reward was already granted for this specific pair
    const existingReward = await adminDb.collection("transactions")
      .where("userId", "==", referrerId)
      .where("type", "==", "referral_reward")
      .where("refereeId", "==", referredUserId)
      .get();

    if (!existingReward.empty) {
      return NextResponse.json({ ok: true, message: "Reward already granted" });
    }

    // 5. Award 50 Inklets via Transaction to BOTH parties
    const rewardAmount = 50;
    await adminDb.runTransaction(async (transaction: admin.firestore.Transaction) => {
      // Update Referrer Balance
      transaction.set(referrerDoc.ref, {
        inkletBalance: admin.firestore.FieldValue.increment(rewardAmount),
        referralCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Update Referred User Balance (Welcome Bonus)
      const referredUserRef = adminDb.collection("users").doc(referredUserId);
      transaction.set(referredUserRef, {
        inkletBalance: admin.firestore.FieldValue.increment(rewardAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Create Transaction Record for Referrer
      const transRef = adminDb.collection("transactions").doc();
      transaction.set(transRef, {
        id: transRef.id,
        userId: referrerId,
        refereeId: referredUserId,
        type: "referral_reward",
        amount: rewardAmount,
        status: "completed",
        ip: clientIp,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create Transaction Record for Referee (Welcome Bonus)
      const welcomeTransRef = adminDb.collection("transactions").doc();
      transaction.set(welcomeTransRef, {
        id: welcomeTransRef.id,
        userId: referredUserId,
        type: "referral_welcome_bonus",
        amount: rewardAmount,
        status: "completed",
        ip: clientIp,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 6. Create Notifications
      const referrerNotifRef = adminDb.collection("users").doc(referrerId).collection("notifications").doc();
      transaction.set(referrerNotifRef, {
        title: "Referral Manifested",
        message: `A new seeker has joined the archives using your link! You've manifested ${rewardAmount} Inklets.`,
        type: "referral_reward",
        read: false,
        link: "/library",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const refereeNotifRef = adminDb.collection("users").doc(referredUserId).collection("notifications").doc();
      transaction.set(refereeNotifRef, {
        title: "Welcome Bonus Manifested",
        message: `Welcome to Vellum! You've received ${rewardAmount} Inklets for joining via a referral link.`,
        type: "welcome_bonus",
        read: false,
        link: "/library",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`[API Referrals] Successfully rewarded ${referrerId} for referring ${referredUserId}`);
    return NextResponse.json({ ok: true, message: "Referral reward granted successfully" });

  } catch (error: any) {
    console.error("[API Referrals] Redemption error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
