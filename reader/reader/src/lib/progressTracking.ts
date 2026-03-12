import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  Timestamp,
  increment
} from "firebase/firestore";
import { ReadingProgress, LibraryData, StoryReference, NovelProgressReference, NovelReference, ArtPiece, Story, Novel } from "@/types";

export type NotificationType = 'like' | 'comment' | 'repost' | 'save' | 'update' | 'new_release';

export interface Notification {
  id: string;
  type: NotificationType;
  recipientId: string;
  senderId: string;
  senderName: string;
  contentId: string;
  contentType: 'art' | 'story' | 'novel' | 'chapter';
  contentTitle: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: Timestamp;
}

interface ProgressTrackingService {
  saveProgress: (
    userId: string,
    novelId: string,
    novelTitle: string,
    coverImage: string,
    authorName: string,
    chapterId: string,
    chapterTitle: string,
    currentChapterOrder: number,
    totalChapters: number
  ) => Promise<void>;
  getProgress: (userId: string, novelId: string) => Promise<ReadingProgress | null>;
  getUserLibrary: (userId: string) => Promise<LibraryData>;

  // Art Engagement
  saveArtPiece: (userId: string, art: ArtPiece) => Promise<void>;
  unsaveArtPiece: (userId: string, artId: string) => Promise<void>;
  repostArtPiece: (userId: string, art: ArtPiece) => Promise<void>;
  undoRepostArtPiece: (userId: string, artId: string) => Promise<void>;

  // Novel/Story Engagement
  likeContent: (userId: string, username: string, contentId: string, contentType: 'story' | 'novel' | 'chapter', title: string, authorId: string, coverImage?: string, authorName?: string) => Promise<void>;
  unlikeContent: (userId: string, contentId: string, contentType: 'story' | 'novel' | 'chapter', authorId: string) => Promise<void>;
  saveNovel: (userId: string, novelId: string, title: string, coverImage: string, authorName: string, authorId: string) => Promise<void>;
  unsaveNovel: (userId: string, novelId: string) => Promise<void>;

  // Notification methods
  notifyFollowers: (authorId: string, authorName: string, title: string, contentId: string, contentType: 'story' | 'novel', isNewRelease: boolean) => Promise<void>;
  triggerNotification: (config: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
}

export const progressTracking: ProgressTrackingService = {
  saveProgress: async (
    userId: string,
    novelId: string,
    novelTitle: string,
    coverImage: string,
    authorName: string,
    chapterId: string,
    chapterTitle: string,
    currentChapterOrder: number,
    totalChapters: number
  ): Promise<void> => {
    try {
      const progressRef = doc(db, "users", userId, "progress", novelId);

      // Calculate progress percentage
      const progressPercentage = totalChapters > 0
        ? Math.min(Math.round(((currentChapterOrder + 1) / totalChapters) * 100), 100)
        : 0;

      const progressData: ReadingProgress = {
        novelId,
        novelTitle,
        coverImage,
        authorName,
        currentChapterId: chapterId,
        currentChapterTitle: chapterTitle,
        progressPercentage,
        lastReadAt: Timestamp.now()
      };

      await setDoc(progressRef, progressData);
    } catch (error) {
      console.error("Error saving progress:", error);
      throw error;
    }
  },

  getProgress: async (
    userId: string,
    novelId: string
  ): Promise<ReadingProgress | null> => {
    try {
      const progressRef = doc(db, "users", userId, "progress", novelId);
      const snapshot = await getDoc(progressRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          novelId: data.novelId,
          novelTitle: data.novelTitle,
          coverImage: data.coverImage,
          authorName: data.authorName,
          currentChapterId: data.currentChapterId,
          currentChapterTitle: data.currentChapterTitle,
          progressPercentage: data.progressPercentage,
          lastReadAt: data.lastReadAt
        } as ReadingProgress;
      }

      return null;
    } catch (error) {
      console.error("Error getting progress:", error);
      return null;
    }
  },

  getUserLibrary: async (userId: string): Promise<LibraryData> => {
    try {
      // Get liked stories from user library
      const likedStoriesRef = collection(db, "users", userId, "likedStories");
      const likedStoriesQuery = query(likedStoriesRef, orderBy("likedAt", "desc"));
      const likedStoriesSnapshot = await getDocs(likedStoriesQuery);

      const likedStories: StoryReference[] = likedStoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        coverImage: doc.data().coverImage,
        authorName: doc.data().authorName,
        likedAt: doc.data().likedAt || Timestamp.now()
      }));

      // Get saved novels
      const savedNovelsRef = collection(db, "users", userId, "savedNovels");
      const savedNovelsQuery = query(savedNovelsRef, orderBy("savedAt", "desc"));
      const savedNovelsSnapshot = await getDocs(savedNovelsQuery);

      const savedNovels: NovelReference[] = savedNovelsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        coverImage: doc.data().coverImage,
        authorName: doc.data().authorName,
        savedAt: doc.data().savedAt || Timestamp.now()
      }));

      // Get novels in progress
      const progressRef = collection(db, "users", userId, "progress");
      const progressSnapshot = await getDocs(progressRef);

      const novelsInProgress: NovelProgressReference[] = progressSnapshot.docs.map(progressDoc => {
        const progressData = progressDoc.data() as ReadingProgress;
        return {
          id: progressDoc.id,
          title: progressData.novelTitle || "Unknown Novel",
          coverImage: progressData.coverImage || "",
          authorName: progressData.authorName || "Unknown Author",
          currentChapterId: progressData.currentChapterId,
          currentChapterTitle: progressData.currentChapterTitle || "Unknown Chapter",
          progressPercentage: progressData.progressPercentage,
          lastReadAt: progressData.lastReadAt
        };
      });

      // Get saved art
      const savedArtRef = collection(db, "users", userId, "savedArt");
      const savedArtSnapshot = await getDocs(query(savedArtRef, orderBy("savedAt", "desc")));
      const savedArt: ArtPiece[] = savedArtSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().savedAt // mapping for simplicity in UI
      } as any));

      // Get reposted art
      const repostedArtRef = collection(db, "users", userId, "reposts");
      const repostedArtSnapshot = await getDocs(query(repostedArtRef, orderBy("repostedAt", "desc")));
      const repostedArt: ArtPiece[] = repostedArtSnapshot.docs.map(d => ({
        id: d.data().artId,
        title: d.data().artTitle,
        imageUrl: d.data().artImageUrl,
        authorName: d.data().authorName,
        createdAt: d.data().repostedAt
      } as any));

      return {
        likedStories,
        savedNovels,
        novelsInProgress,
        savedArt,
        repostedArt
      };
    } catch (error) {
      console.error("Error getting user library:", error);
      return {
        likedStories: [],
        savedNovels: [],
        novelsInProgress: [],
        savedArt: [],
        repostedArt: []
      };
    }
  },

  saveArtPiece: async (userId: string, art: ArtPiece): Promise<void> => {
    try {
      const userRef = doc(db, "users", userId, "savedArt", art.id);
      await setDoc(userRef, {
        ...art,
        savedAt: Timestamp.now()
      });

      const artRef = doc(db, "art", art.id);
      await setDoc(artRef, { saveCount: increment(1) }, { merge: true });

      if (art.authorId && art.authorId !== userId) {
        await progressTracking.triggerNotification({
          recipientId: art.authorId,
          senderId: userId,
          senderName: "Someone",
          type: 'save',
          contentId: art.id,
          contentType: 'art',
          contentTitle: art.title,
          message: `saved your art piece "${art.title}"`,
          link: `/art`
        });
      }
    } catch (error) {
      console.error("Error saving art piece:", error);
      throw error;
    }
  },

  unsaveArtPiece: async (userId: string, artId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "users", userId, "savedArt", artId));
      const artRef = doc(db, "art", artId);
      await setDoc(artRef, { saveCount: increment(-1) }, { merge: true });
    } catch (error) {
      console.error("Error unsaving art piece:", error);
      throw error;
    }
  },

  repostArtPiece: async (userId: string, art: ArtPiece): Promise<void> => {
    try {
      const userRef = doc(db, "users", userId, "reposts", art.id);
      await setDoc(userRef, {
        artId: art.id,
        artTitle: art.title,
        artImageUrl: art.imageUrl,
        authorName: art.authorName || "Unknown",
        repostedAt: Timestamp.now()
      });

      const artRef = doc(db, "art", art.id);
      await setDoc(artRef, { repostCount: increment(1) }, { merge: true });

      if (art.authorId && art.authorId !== userId) {
        await progressTracking.triggerNotification({
          recipientId: art.authorId,
          senderId: userId,
          senderName: "Someone",
          type: 'repost',
          contentId: art.id,
          contentType: 'art',
          contentTitle: art.title,
          message: `reposted your art piece "${art.title}"`,
          link: `/authors/${userId}?tab=reposts`
        });
      }
    } catch (error) {
      console.error("Error reposting art piece:", error);
      throw error;
    }
  },

  undoRepostArtPiece: async (userId: string, artId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "users", userId, "reposts", artId));
      const artRef = doc(db, "art", artId);
      await setDoc(artRef, { repostCount: increment(-1) }, { merge: true });
    } catch (error) {
      console.error("Error undoing repost:", error);
      throw error;
    }
  },

  likeContent: async (userId, username, contentId, contentType, title, authorId, coverImage, authorName) => {
    try {
      const path = contentType === 'story' ? `stories/${contentId}/likes/${userId}` : `novels/${contentId}/likes/${userId}`;
      await setDoc(doc(db, path), { userId, likedAt: Timestamp.now() });

      const parentRef = doc(db, contentType === 'story' ? "stories" : "novels", contentId);
      await setDoc(parentRef, { likes: increment(1) }, { merge: true });

      // If it's a story, add to likedStories in user library
      if (contentType === 'story') {
        await setDoc(doc(db, "users", userId, "likedStories", contentId), {
          title,
          coverImage: coverImage || "",
          authorName: authorName || "Unknown Author",
          likedAt: Timestamp.now()
        }, { merge: true });
      }

      if (authorId && authorId !== userId) {
        await progressTracking.triggerNotification({
          recipientId: authorId,
          senderId: userId,
          senderName: username,
          type: 'like',
          contentId,
          contentType,
          contentTitle: title,
          message: `liked your ${contentType} "${title}"`,
          link: `/${contentType}s/${contentId}`
        });
      }
    } catch (error) {
      console.error("Error liking content:", error);
      throw error;
    }
  },

  unlikeContent: async (userId, contentId, contentType, authorId) => {
    try {
      const path = contentType === 'story' ? `stories/${contentId}/likes/${userId}` : `novels/${contentId}/likes/${userId}`;
      await deleteDoc(doc(db, path));
      const parentRef = doc(db, contentType === 'story' ? "stories" : "novels", contentId);
      await setDoc(parentRef, { likes: increment(-1) }, { merge: true });
    } catch (error) {
      console.error("Error unliking content:", error);
      throw error;
    }
  },

  saveNovel: async (userId, novelId, title, coverImage, authorName, authorId) => {
    try {
      await setDoc(doc(db, "users", userId, "savedNovels", novelId), {
        title,
        coverImage,
        authorName,
        savedAt: Timestamp.now()
      });

      if (authorId && authorId !== userId) {
        await progressTracking.triggerNotification({
          recipientId: authorId,
          senderId: userId,
          senderName: "Someone",
          type: 'save',
          contentId: novelId,
          contentType: 'novel',
          contentTitle: title,
          message: `added your novel "${title}" to their library`,
          link: `/novels/${novelId}`
        });
      }
    } catch (error) {
      console.error("Error saving novel:", error);
      throw error;
    }
  },

  unsaveNovel: async (userId, novelId) => {
    try {
      await deleteDoc(doc(db, "users", userId, "savedNovels", novelId));
    } catch (error) {
      console.error("Error unsaving novel:", error);
      throw error;
    }
  },

  notifyFollowers: async (authorId: string, authorName: string, title: string, contentId: string, contentType: 'story' | 'novel', isNewRelease: boolean) => {
    try {
      const followersRef = collection(db, "users", authorId, "followers");
      const followersSnap = await getDocs(followersRef);

      const type: NotificationType = isNewRelease ? 'new_release' : 'update';
      const message = isNewRelease
        ? `"${title}" has been published. Read it now!`
        : `"${title}" has been updated with new content.`;

      const promises = followersSnap.docs.map(followerDoc => {
        return progressTracking.triggerNotification({
          recipientId: followerDoc.id,
          senderId: authorId,
          senderName: authorName,
          type,
          contentId,
          contentType,
          contentTitle: title,
          message,
          link: `/${contentType}s/${contentId}`
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Error notifying followers:", error);
    }
  },

  triggerNotification: async (config) => {
    try {
      const notifRef = doc(collection(db, "users", config.recipientId, "notifications"));
      await setDoc(notifRef, {
        ...config,
        id: notifRef.id,
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error triggering notification:", error);
    }
  }
};

// Utility functions
export const calculateProgressPercentage = (
  currentChapterOrder: number,
  totalChapters: number
): number => {
  return Math.min(Math.round((currentChapterOrder / totalChapters) * 100), 100);
};

export const isNovelCompleted = (progressPercentage: number): boolean => {
  return progressPercentage >= 100;
};
