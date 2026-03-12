import { Timestamp } from "firebase/firestore";

// Authentication
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Reader Profile
export interface ReaderProfile {
  email: string;
  username: string;
  createdAt: Timestamp;
  monetization?: MonetizationProfile;
}

// Monetization Types
export type SubscriptionTier = 'free' | 'prime' | 'nexus';

export interface XPProfile {
  xp: number;
  level: number;
  isChronicler: boolean;
  chroniclerStatus: 'none' | 'pending' | 'active';
  legacyPoints: number;
  updatedAt: Timestamp;
}

export interface EssenceWallet {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: Timestamp;
}

export interface MonetizationProfile {
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Timestamp | null;
  xpProfile: XPProfile;
  essenceWallet: EssenceWallet;
}

export interface CreatorMonetizationProfile {
  archivistTier: 'apprentice' | 'journeyman' | 'senior' | 'master' | 'grand';
  totalUniqueReaders: number;
  totalChaptersPublished: number;
  payoutBalance: number;
  coinEarnings: number;
  isMonetizationEnabled: boolean;
}

// Reading Progress
export interface ReadingProgress {
  novelId: string;
  novelTitle?: string;
  coverImage?: string;
  authorName?: string;
  currentChapterId: string;
  currentChapterTitle?: string;
  progressPercentage: number;
  lastReadAt: Timestamp;
}

// Social Interactions
export interface Like {
  userId: string;
  likedAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Timestamp;
}

// Library
export interface LibraryData {
  likedStories: StoryReference[];
  savedNovels: NovelReference[];
  novelsInProgress: NovelProgressReference[];
  savedArt: ArtPiece[];
  repostedArt: ArtPiece[];
}

export interface StoryReference {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  likedAt: Timestamp;
}

export interface NovelProgressReference {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  currentChapterId: string;
  currentChapterTitle: string;
  progressPercentage: number;
  lastReadAt: Timestamp;
}

export interface NovelReference {
  id: string;
  title: string;
  coverImage: string;
  authorName: string;
  savedAt: Timestamp;
}

export interface ArtPiece {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  createdAt: Timestamp;
  saveCount?: number;
  repostCount?: number;
  category?: string;
  tags?: string[];
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  coverImage?: string;
  imageUrl?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  published: boolean;
  createdAt: Timestamp;
  viewCount?: number;
  likeCount?: number;
}

export interface Novel {
  id: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  coverImage?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  published: boolean;
  createdAt: Timestamp;
  viewCount?: number;
  likeCount?: number;
  chapterCount?: number;
}

export interface Repost {
  id: string;
  artId: string;
  userId: string;
  repostedAt: Timestamp;
  artTitle: string;
  artImageUrl: string;
  authorName: string;
}
