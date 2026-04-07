import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

/**
 * POST /api/rewards/daily-checkin
 * Grants daily Inklets to users to drive retention.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Authentication required" }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD (UTC)

    // Check if already checked in today
    if (userData?.lastCheckIn === todayStr) {
      return NextResponse.json({ 
        ok: false, 
        error: "Already manifested today's reward.",
        alreadyDone: true 
      }, { status: 400 });
    }

    const rewardAmount = 3; // Standard daily reward

    await adminDb.runTransaction(async (transaction: admin.firestore.Transaction) => {
      // 1. Update User Balance & Check-in Date
      transaction.update(userRef, {
        inkletBalance: admin.firestore.FieldValue.increment(rewardAmount),
        lastCheckIn: todayStr,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Record Transaction
      const transRef = adminDb.collection("transactions").doc();
      transaction.set(transRef, {
        id: transRef.id,
        userId,
        type: "daily_checkin",
        amount: rewardAmount,
        status: "completed",
        date: todayStr,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Create Notification
      const notifRef = userRef.collection("notifications").doc();
      transaction.set(notifRef, {
        title: "Daily Manifestation",
        message: `You've received ${rewardAmount} Inklets for returning to the archives today.`,
        type: "checkin_reward",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ 
      ok: true, 
      reward: rewardAmount,
      message: "Daily reward manifested successfully" 
    });

  } catch (error: any) {
    console.error("[API Check-in] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
