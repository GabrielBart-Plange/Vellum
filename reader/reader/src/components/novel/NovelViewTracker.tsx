"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, increment, updateDoc } from "firebase/firestore";

const MONETIZATION_API = process.env.NEXT_PUBLIC_MONETIZATION_API || (typeof window !== "undefined" ? `${window.location.origin}/api` : "http://localhost:3000/api");

export default function NovelViewTracker({ novelId }: { novelId: string }) {
  useEffect(() => {
    const incrementView = async () => {
      if (!novelId) return;

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
