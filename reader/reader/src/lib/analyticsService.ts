import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, increment, updateDoc, writeBatch } from "firebase/firestore";

export interface AnalyticsEvent {
    type: 'chapter_view' | 'story_view' | 'author_view';
    novelId?: string;
    chapterId?: string;
    storyId?: string;
    authorId: string;
    userId?: string;
    timestamp?: any;
    metadata?: Record<string, any>;
}

/**
 * Analytics Service for tracking user engagement and author performance.
 */
export const analyticsService = {
    /**
     * Logs an engagement event. 
     * Uses a lightweight approach to avoid blocking the main UI thread.
     */
    logEvent: async (event: AnalyticsEvent) => {
        try {
            const eventRef = collection(db, "analytics_events");
            
            // 1. Log the individual event
            await addDoc(eventRef, {
                ...event,
                timestamp: serverTimestamp()
            });

            // 2. Increment aggregate counters (Author specific)
            const authorRef = doc(db, "users", event.authorId);
            const authorUpdate: any = {};
            
            if (event.type === 'chapter_view' || event.type === 'story_view') {
                authorUpdate.totalViews = increment(1);
            }
            
            if (Object.keys(authorUpdate).length > 0) {
                await updateDoc(authorRef, authorUpdate);
            }

        } catch (error) {
            // Silently fail analytics to prevent user experience disruption
            console.error("[AnalyticsService] Error logging event:", error);
        }
    },

    /**
     * Specialized logger for chapter views.
     */
    trackChapterView: async (params: { novelId: string, chapterId: string, authorId: string, userId?: string }) => {
        return analyticsService.logEvent({
            type: 'chapter_view',
            novelId: params.novelId,
            chapterId: params.chapterId,
            authorId: params.authorId,
            userId: params.userId
        });
    },

    /**
     * Specialized logger for story views.
     */
    trackStoryView: async (params: { storyId: string, authorId: string, userId?: string }) => {
        return analyticsService.logEvent({
            type: 'story_view',
            storyId: params.storyId,
            authorId: params.authorId,
            userId: params.userId
        });
    }
};
