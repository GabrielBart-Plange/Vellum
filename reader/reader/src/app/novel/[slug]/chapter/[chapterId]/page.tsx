"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

/**
 * Legacy Redirect Component
 * Redirects /novel/[slug]/chapter/[chapterId] to /chapter/[slug]-[order]
 */
export default function ChapterRedirectPage() {
    const { slug, chapterId } = useParams<{ slug: string, chapterId: string }>();
    const router = useRouter();

    useEffect(() => {
        const performRedirect = async () => {
            if (!slug || !chapterId) return;

            try {
                // 1. Resolve Novel Identity (it might be an ID or a Slug)
                let novelSlug = slug;
                let novelId = slug;
                const novelSnap = await getDoc(doc(db, "novels", slug));

                if (!novelSnap.exists()) {
                    // Try lookup by slug field
                    const qNovel = query(collection(db, "novels"), where("slug", "==", slug));
                    const qSnapNovel = await getDocs(qNovel);
                    if (!qSnapNovel.empty) {
                        novelId = qSnapNovel.docs[0].id;
                        novelSlug = qSnapNovel.docs[0].data().slug || slug;
                    }
                } else {
                    novelSlug = novelSnap.data().slug || slug;
                }

                // 2. Fetch Chapter Metadata to get 'order'
                const chapterSnap = await getDoc(doc(db, "novels", novelId, "chapters", chapterId));
                
                if (chapterSnap.exists()) {
                    const order = chapterSnap.data()?.order;
                    if (typeof order === 'number') {
                        router.replace(`/chapter/${novelSlug}-${order}`);
                    } else {
                        router.replace(`/novel/${novelSlug}`);
                    }
                } else {
                    router.replace(`/novel/${novelSlug}`);
                }
            } catch (err) {
                console.error("Redirect error:", err);
                router.replace("/novel");
            }
        };

        performRedirect();
    }, [slug, chapterId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center text-[var(--reader-text)]/40 uppercase tracking-[0.4em] text-[10px] font-black animate-pulse">
            Re-unrolling the chronicle...
        </div>
    );
}
