import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

/**
 * GET /api/creator/analytics
 * Fetches real-time analytics data for the authenticated author.
 */
export async function GET(req: NextRequest) {
  try {
    const authorId = req.nextUrl.searchParams.get("authorId");

    if (!authorId) {
      return NextResponse.json({ ok: false, error: "Author ID required" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized" }, { status: 500 });
    }

    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // 1. Fetch 24h views
    const views24hQuery = await adminDb.collection("analytics_events")
        .where("authorId", "==", authorId)
        .where("timestamp", ">=", admin.firestore.Timestamp.fromMillis(twentyFourHoursAgo))
        .get();
    
    // 2. Fetch 7d views
    const views7dQuery = await adminDb.collection("analytics_events")
        .where("authorId", "==", authorId)
        .where("timestamp", ">=", admin.firestore.Timestamp.fromMillis(sevenDaysAgo))
        .get();

    // 3. Aggregate results
    const views24h = views24hQuery.size;
    const views7d = views7dQuery.size;

    // 4. (Optional) Top performing chapters/stories in last 7d
    const topPerformers: Record<string, number> = {};
    views7dQuery.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        const contentId = data.chapterId || data.storyId || "unknown";
        topPerformers[contentId] = (topPerformers[contentId] || 0) + 1;
    });

    return NextResponse.json({ 
      ok: true, 
      views24h,
      views7d,
      topPerformers
    });

  } catch (error: any) {
    console.error("[Creator Analytics API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
