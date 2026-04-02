import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AuthorProfileClient from "@/components/authors/AuthorProfileClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAuthorData(id: string) {
  const userRef = adminDb.collection('users').doc(id);
  const userSnap = await userRef.get();

  if (!userSnap.exists) return null;

  const data = userSnap.data() || {};
  const authorMetadata = {
    username: data.username || data.displayName || "Unknown User",
    avatarUrl: data.avatarUrl || "",
    bannerUrl: data.bannerUrl || "",
    bio: data.bio || "This user has not yet unrolled their scroll of biography.",
    joinedDate: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : "06/01/2026",
    supportLink: data.supportLink || "",
  };

  const xpProfile = {
    xp: data.xp ?? 0,
    level: data.level ?? 0,
    isChronicler: data.isChronicler ?? false,
  };

  // Follower count
  const followersSnap = await userRef.collection('followers').get();
  const followerCount = followersSnap.size;

  // Stories
  const storiesSnap = await adminDb.collection('stories')
    .where('authorId', '==', id)
    .where('published', '==', true)
    .orderBy('publishedAt', 'desc')
    .get();
  const stories = JSON.parse(JSON.stringify(storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

  // Novels
  const novelsSnap = await adminDb.collection('novels')
    .where('authorId', '==', id)
    .where('published', '==', true)
    .orderBy('publishedAt', 'desc')
    .get();
  const novels = JSON.parse(JSON.stringify(novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

  // Art
  const artSnap = await adminDb.collection('art')
    .where('authorId', '==', id)
    .orderBy('createdAt', 'desc')
    .get();
  const art = JSON.parse(JSON.stringify(artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

  return { authorMetadata, xpProfile, followerCount, stories, novels, art };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getAuthorData(id);

  if (!data) return { title: 'Author Not Found' };

  const { authorMetadata } = data;
  const title = `${authorMetadata.username} | Vellum Profile`;
  const description = authorMetadata.bio.substring(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [authorMetadata.avatarUrl || ''],
      type: 'profile',
      username: authorMetadata.username,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [authorMetadata.avatarUrl || ''],
    },
  };
}

export default async function UserPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAuthorData(id);

  if (!data) notFound();

  const { authorMetadata, xpProfile, followerCount, stories, novels, art } = data;

  return (
    <main className="min-h-screen text-[var(--reader-text)] font-sans pb-40">
      {/* Hero Section */}
      <div className="relative min-h-[600px] w-full flex flex-col items-center justify-center pt-20 pb-12 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl px-6 text-center">
          {/* Avatar with Level Badge */}
          <div className="relative group/avatar">
            <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border border-white/5 bg-zinc-900 shadow-2xl">
              {authorMetadata.avatarUrl ? (
                <Image
                  src={authorMetadata.avatarUrl}
                  alt={authorMetadata.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black text-6xl">
                  {authorMetadata.username.charAt(0)}
                </div>
              )}
            </div>

            {/* Level Badge */}
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[var(--reader-accent)] border-4 border-[#0b0a0f] px-5 py-1.5 rounded-full shadow-[0_10px_20px_-5px_rgba(139,92,246,0.5)] rotate-3">
              <span className="text-[10px] md:text-[11px] font-black text-white italic tracking-tighter uppercase">
                SLOT {xpProfile?.level || 0}
              </span>
            </div>
          </div>

          {/* Titles & Badges */}
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-8 py-2 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] uppercase tracking-[0.4em] font-black text-purple-400 italic">
              {xpProfile?.level >= 5 ? 'Master Scribe' : 'Novice Seeker'}
            </span>
            <span className="px-8 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-[9px] uppercase tracking-[0.4em] font-black text-amber-400 italic">
              Spell-Weaver
            </span>
            <span className="px-8 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[9px] uppercase tracking-[0.4em] font-black text-emerald-400 italic">
              First Edition
            </span>
          </div>

          {/* Identity */}
          <div className="space-y-6 max-w-full overflow-hidden">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase italic leading-[0.8] break-words">
              {authorMetadata.username}
            </h1>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.6em] text-zinc-600 font-black italic">
                Joined {authorMetadata.joinedDate} &nbsp; • &nbsp; {followerCount} Followers
              </p>
              <p className="text-[9px] uppercase tracking-[0.4em] text-[var(--reader-accent)]/60 font-bold italic">
                Last seen in the archives recently
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthorProfileClient
        authorId={id}
        authorMetadata={authorMetadata}
        xpProfile={xpProfile}
        initialStories={stories}
        initialNovels={novels}
        initialArt={art as any}
        initialFollowerCount={followerCount}
      />
    </main>
  );
}
