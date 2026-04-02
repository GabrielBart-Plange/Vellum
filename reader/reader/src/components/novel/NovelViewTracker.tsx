"use client";

import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, increment, updateDoc } from "firebase/firestore";

export default function NovelViewTracker({ novelId }: { novelId: string }) {
  useEffect(() => {
    const incrementView = async () => {
      if (!novelId) return;

      const storageKey = `viewed_novel_${novelId}`;
      const hasViewed = localStorage.getItem(storageKey);

      if (hasViewed) return;

      try {
        const novelRef = doc(db, "novels", novelId);
        await updateDoc(novelRef, {
          views: increment(1)
        });
        localStorage.setItem(storageKey, "true");
      } catch (error) {
        console.error("Error incrementing view:", error);
      }
    };

    incrementView();
  }, [novelId]);

  return null;
}
