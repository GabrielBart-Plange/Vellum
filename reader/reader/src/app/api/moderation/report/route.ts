import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { discordService } from "@/lib/discordService";

/**
 * POST /api/moderation/report
 * Handles content reporting and sends Discord notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    const { 
        reporterId, 
        reporterEmail, 
        contentType, 
        contentId, 
        contentTitle, 
        authorId, 
        reason, 
        details 
    } = report;

    if (!reason || !contentType || !contentId) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized" }, { status: 500 });
    }

    // 1. Save report to Firestore
    const reportRef = adminDb.collection("reports").doc();
    await reportRef.set({
        id: reportRef.id,
        reporterId: reporterId || "anonymous",
        reporterEmail: reporterEmail || "anonymous",
        contentType,
        contentId,
        contentTitle: contentTitle || "Untitled",
        authorId: authorId || "unknown",
        reason,
        details: details || "",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Notify Discord (in the background)
    discordService.reportInDiscord({
        contentType,
        contentId,
        contentTitle: contentTitle || "Untitled",
        reason,
        reporterEmail: reporterEmail || "anonymous"
    }).catch(err => console.error("[Moderation API] Discord notification failed:", err));

    return NextResponse.json({ 
      ok: true, 
      id: reportRef.id,
      message: "Report received. The Scribes have been alerted." 
    });

  } catch (error: any) {
    console.error("[Moderation API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
