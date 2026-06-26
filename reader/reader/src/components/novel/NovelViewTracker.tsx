"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, increment, updateDoc } from "firebase/firestore";

const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || "http://localhost:3005/api";

export default function NovelViewTracker({ novelId }: { novelId: string }) {
  useEffect(() => {
    const incrementView = async () => {
      if (!novelId) return;

      // Check if localStorage is available (browser environment)
      if (typeof window === 'undefined') return;

      const storageKey = `viewed_novel_${novelId}`;
      const hasViewed = localStorage.getItem(storageKey);

      if (hasViewed) return;

      try {
        await fetch(`${MONETIZATION_API}/analytics/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId: novelId, contentType: "novel" })
        });
        localStorage.setItem(storageKey, "true");
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    incrementView();
  }, [novelId]);

  return null;
}
