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
export type SubscriptionTier = 'free' | 'plus' | 'pro';

export interface XPProfile {
  xp: number;
  level: number;
  isChronicler: boolean;
  chroniclerStatus: 'none' | 'pending' | 'active';
  legacyPoints: number;
  updatedAt: Timestamp;
}

export interface InkletWallet {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: Timestamp;
}

export type VelluxTier = 'gold' | 'diamond' | 'platinum';

export interface VelluxWallet {
  tier: VelluxTier;
  amount: number;
  lastReceivedAt: Timestamp;
}

export interface MonetizationProfile {
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Timestamp | null;
  xpProfile: XPProfile;
  giltBalance: number;
  inkletWallet: InkletWallet;
  velluxWallets: VelluxWallet[];
}

export interface CreatorMonetizationProfile {
  archivistTier: 'apprentice' | 'journeyman' | 'senior' | 'master' | 'grand';
  totalUniqueReaders: number;
  totalChaptersPublished: number;
  payoutBalance: number;
  inkletEarnings: number;
  isMonetizationEnabled: boolean;
}

// Reading Progress
export interface ReadingProgress {
  novelId: string;
  numericalId?: number;
  slug?: string;
  novelTitle?: string;
  coverImage?: string;
  authorName?: string;
  currentChapterId: string;
  currentChapterTitle?: string;
  chapterOrder?: number;
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
  userLevel?: number;
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
  alphanumericId?: string;
  slug?: string;
  title: string;
  coverImage: string;
  authorName: string;
  likedAt: Timestamp;
}

export interface NovelProgressReference {
  id: string;
  numericalId?: number;
  slug?: string;
  title: string;
  coverImage: string;
  authorName: string;
  currentChapterId: string;
  currentChapterTitle: string;
  chapterOrder?: number;
  progressPercentage: number;
  lastReadAt: Timestamp;
}

export interface NovelReference {
  id: string;
  numericalId?: number;
  slug?: string;
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

// Content Safety
export type ContentRating = 'Everyone' | 'Teen' | 'Mature' | 'Explicit';

export interface Story {
  id: string;
  alphanumericId?: string;
  slug?: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  coverImage?: string;
  imageUrl?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  contentWarnings?: string[];
  rating?: ContentRating;
  published: boolean;
  createdAt: Timestamp;
  publishedAt?: Timestamp;
  viewCount?: number;
  likeCount?: number;
}

export interface Novel {
  id: string;
  numericalId?: number;
  slug?: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  coverImage?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  contentWarnings?: string[];
  rating?: ContentRating;
  published: boolean;
  createdAt: Timestamp;
  publishedAt?: Timestamp;
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
