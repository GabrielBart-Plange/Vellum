import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import LikeButton from "@/components/interactions/LikeButton";
import NovelActions from "@/components/novel/NovelActions";
import NovelViewTracker from "@/components/novel/NovelViewTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getNovelData(slug: string) {
  // 1. Try to find by ID first (backward compatibility)
  let novelDoc = await adminDb.collection('novels').doc(slug).get();

  // 2. If not found by ID, try to find by slug field or numericalId
  if (!novelDoc.exists) {
    // 2a. Try slug
    const slugQuery = await adminDb.collection('novels')
      .where('slug', '==', slug)
      .where('published', '==', true)
      .limit(1)
      .get();
      
    if (!slugQuery.empty) {
      novelDoc = slugQuery.docs[0];
    } else {
      // 2b. Try numericalId
      const maybeNum = parseInt(slug);
      if (!isNaN(maybeNum)) {
        const numQuery = await adminDb.collection('novels')
          .where('numericalId', '==', maybeNum)
          .where('published', '==', true)
          .limit(1)
          .get();
        if (!numQuery.empty) {
          novelDoc = numQuery.docs[0];
        }
      }
    }
  }

  if (!novelDoc.exists) return null;

  const novelId = novelDoc.id;
  const novel = JSON.parse(JSON.stringify(novelDoc.data()));
  if (!novel) return null;

  // Fetch Chapters
  const chaptersSnap = await adminDb.collection('novels').doc(novelId).collection('chapters')
    .where('published', '==', true)
    .orderBy('order', 'asc')
    .get();
    
  const chapters = JSON.parse(JSON.stringify(chaptersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

  return { novelId, novel, chapters };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNovelData(slug);

  if (!data) return { title: 'Novel Not Found' };

  const { novel } = data;
  const title = `${novel.title} | Vellum`;
  const description = novel.description?.substring(0, 160) || "Read this original chronicle on Vellum.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [novel.coverImage || ''],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [novel.coverImage || ''],
    },
  };
}

export default async function NovelLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getNovelData(slug);

  if (!data) notFound();

  const { novelId, novel, chapters } = data;

  return (
    <main className="min-h-screen text-[var(--reader-text)] font-sans pb-40">
      <NovelViewTracker novelId={novelId} />
      
      {/* Header / Hero */}
      <div className="relative h-[90vh] overflow-hidden flex items-center justify-center">
        <img
          src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--reader-bg)]/60 via-transparent to-transparent" />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center space-y-12">
          {/* Top Badge Card */}
          <div className="inline-block glass-panel p-1 rounded-2xl mb-8 transform translate-y-[-20px]">
            <div className="relative rounded-xl overflow-hidden group cursor-pointer" title="View Author Profile">
              <img
                src={novel.coverImage}
                className="w-64 h-24 object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                alt=""
              />
              <div className="absolute inset-0 bg-[var(--reader-bg)]/40 flex items-center justify-center">
                <span className="text-[12px] uppercase tracking-[0.3em] font-black text-[var(--reader-text-muted)]">{novel.authorName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full glass text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-black">
                {novel.genre}
              </span>
              <span className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.3em] font-black italic ${novel.status === "Completed"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                }`}>
                {novel.status || "Ongoing"}
              </span>
            </div>
            {/* Tags */}
            {novel.tags && novel.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {novel.tags.map((tag: string) => (
                  <span key={tag} className="text-[9px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-bold px-2 py-0.5 rounded border border-[var(--reader-border)] bg-[var(--reader-surface)]">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-[var(--reader-text)] uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              {novel.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 pt-8">
            <Link href={`/authors/${novel.authorId}`} className="group space-y-2">
              <p className="text-[var(--reader-text-subtle)] text-[9px] uppercase tracking-[0.3em] font-black italic">Scribed By</p>
              <p className="text-[var(--reader-text)] group-hover:text-[var(--reader-accent)] transition-colors uppercase font-black text-sm">{novel.authorName}</p>
            </Link>

            <div className="w-px h-12 bg-white/5" />

            <div className="space-y-2">
              <p className="text-[var(--reader-text-subtle)] text-[9px] uppercase tracking-[0.3em] font-black italic">Content</p>
              <p className="text-[var(--reader-text)] uppercase font-black text-sm">{chapters.length} Chapters</p>
            </div>

            <div className="w-px h-12 bg-white/5" />

            <div className="space-y-2">
              <p className="text-[var(--reader-text-subtle)] text-[9px] uppercase tracking-[0.3em] font-black italic">Likes</p>
              <div className="flex items-center gap-6">
                <LikeButton
                  contentType="novel"
                  contentId={novelId || ""}
                  initialLikeCount={novel.likes || 0}
                />
                <div className="h-1 w-1 bg-[var(--reader-border)] rounded-full" />
                <span className="text-[var(--reader-text)] uppercase font-black text-sm">{(novel.views || 0).toLocaleString()} Views</span>
              </div>
            </div>
          </div>

          <NovelActions novel={novel} novelId={novelId} slug={slug} chapters={chapters} />
        </div>
      </div>

      {/* Synopsis & Author Section */}
      <div className="max-w-4xl mx-auto px-8 pt-32 grid grid-cols-1 md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-text-subtle)] font-black italic">The Unrolling</p>
            <div className="h-px w-24 bg-[var(--reader-accent)]/30" />
          </div>
          <p className="text-[var(--reader-text-muted)] leading-relaxed text-lg font-light italic">
            {novel.description || "The archives are currently being unrolled for this chronicle. Check back soon for the full synopsis."}
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.6em] text-[var(--reader-text-subtle)] font-black italic">The Author</p>
            <div className="h-px w-12 bg-[var(--reader-accent)]/30" />
          </div>

          <Link href={`/authors/${novel.authorId}`} className="block group">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden glass-panel border border-white/5 group-hover:border-[var(--reader-accent)]/30 transition-all">
                <img
                  src={novel.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${novel.authorName}`}
                  alt={novel.authorName}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-widest group-hover:text-[var(--reader-accent)] transition-colors">{novel.authorName}</p>
                <p className="text-[10px] text-[var(--reader-text-subtle)] uppercase tracking-tighter font-bold">View Profile</p>
              </div>
            </div>
          </Link>

          <p className="text-sm text-[var(--reader-text-muted)] leading-relaxed italic">
            {novel.authorBio || "This chronicler prefers to let their work speak for itself."}
          </p>
        </div>
      </div>
    </main>
  );
}
