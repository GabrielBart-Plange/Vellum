import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seoService } from '@/lib/seoService';
import Link from 'next/link';
import LikeButton from "@/components/interactions/LikeButton";
import NovelActions from "@/components/novel/NovelActions";
import NovelViewTracker from "@/components/novel/NovelViewTracker";
import AuthorWorks from "@/components/author/AuthorWorks";
import ViralShare from "@/components/interactions/ViralShare";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { adminDb } from '@/lib/firebase-admin';
import { SeoJsonLd, renderJsonLd } from '@/lib/seo/jsonLd';
import { Flag, ShieldAlert } from "lucide-react";
import ReportModalClient from "@/components/interactions/ReportModalClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getNovelData(slug: string) {
  if (!adminDb) return null;
  
  // 1. Try to find by ID first (backward compatibility)
  let novelDoc = await adminDb.collection('novels').doc(slug).get();

  // 2. If not found by ID, try to find by slug field or numericalId
  if (!novelDoc.exists) {
    const slugQuery = await adminDb.collection('novels')
      .where('slug', '==', slug)
      .where('published', '==', true)
      .limit(1)
      .get();
      
    if (!slugQuery.empty) {
      novelDoc = slugQuery.docs[0];
    } else {
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
  const data = novelDoc.data();
  if (!data) return null;
  
  const novel = JSON.parse(JSON.stringify(data));

  // Fetch Chapters
  const chaptersSnap = await adminDb.collection('novels').doc(novelId).collection('chapters')
    .where('published', '==', true)
    .orderBy('order', 'asc')
    .get();
    
  const chapters = JSON.parse(JSON.stringify(chaptersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))));

  return { novelId, novel, chapters };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return seoService.getMetadata('novel', slug);
}

export default async function NovelLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getNovelData(slug);

  if (!data) notFound();

  const { novelId, novel, chapters } = data;

  // Generate JSON-LD structured data
  const jsonLdSchema = SeoJsonLd.generateNovelSchema(novel, chapters);
  const breadcrumbSchema = SeoJsonLd.generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Novels', url: '/novels' },
    { name: novel.title, url: `/novel/${slug}` }
  ]);

  return (
    <>
      {renderJsonLd(jsonLdSchema)}
      {renderJsonLd(breadcrumbSchema)}
      <main className="min-h-screen text-[var(--reader-text)] font-sans pb-40">
      <div className="max-w-7xl mx-auto px-8 pt-8 relative z-[60]">
        <Breadcrumbs customLabels={{ [slug]: novel.title }} />
      </div>
      <NovelViewTracker novelId={novelId} />
      
      {/* Header / Hero */}
      <div className="relative min-h-[90vh] flex flex-col items-center justify-center py-32">
        <img
          src={novel.coverImage || "https://placehold.co/1200x800/1a1a1a/666666?text=CHAMPION"}
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105 pointer-events-none"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--reader-bg)] via-[var(--reader-bg)]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--reader-bg)]/60 via-transparent to-transparent pointer-events-none" />

        {/* Content Overlay */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-8 text-center flex flex-col items-center gap-12">
          {/* Top Badge Card */}
          <div className="inline-block glass-panel p-1 rounded-2xl transform hover:scale-105 transition-transform duration-500">
            <Link href={`/authors/${novel.authorId}`} className="relative block rounded-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={novel.coverImage}
                className="w-64 h-24 object-cover opacity-40 group-hover:opacity-60 transition-all duration-700"
                alt=""
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/80 group-hover:text-white transition-colors">{novel.authorName}</span>
              </div>
            </Link>
          </div>

          <div className="space-y-6 w-full">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="px-4 py-1.5 rounded-full glass text-[10px] uppercase tracking-[0.3em] text-[var(--reader-text-muted)] font-black">
                {novel.genre}
              </span>
              {novel.rating && (
                <span className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.3em] font-black italic ${
                  novel.rating === 'Explicit' || novel.rating === 'Mature' 
                  ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                  : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                }`}>
                  {novel.rating}
                </span>
              )}
              {novel.targetAudience && (
                <span className="px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] uppercase tracking-[0.3em] font-black italic">
                  {novel.targetAudience} Lead
                </span>
              )}
              <span className={`px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.3em] font-black italic ${novel.status === "Completed"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                }`}>
                {novel.status || "Ongoing"}
              </span>
            </div>
            
            {/* Content Warnings */}
            {novel.contentWarnings && novel.contentWarnings.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {novel.contentWarnings.map((warning: string) => (
                  <span 
                    key={warning}
                    className="text-[8px] uppercase tracking-widest text-red-400/80 font-bold px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5"
                  >
                    {warning}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[var(--reader-text)] uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] leading-[0.9]">
              {novel.title}
            </h1>

            {/* Tags */}
            {novel.tags && novel.tags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto pt-4">
                {novel.tags.map((tag: string) => {
                  const tagSlug = tag.toLowerCase().replace(/\s+/g, '-').replace(/#/g, '');
                  return (
                    <Link 
                      key={tag} 
                      href={`/tag/${tagSlug}`}
                      className="text-[8px] uppercase tracking-widest text-[var(--reader-text-subtle)] font-bold px-3 py-1 rounded-full border border-[var(--reader-border)] bg-[var(--reader-surface)] hover:border-[var(--reader-accent)]/50 hover:text-white transition-all"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-4">
            <div className="space-y-1">
              <p className="text-[var(--reader-text-subtle)] text-[8px] uppercase tracking-[0.3em] font-black italic">Content</p>
              <p className="text-[var(--reader-text)] uppercase font-black text-sm">{chapters.length} Chapters</p>
            </div>

            <div className="w-px h-8 bg-white/5" />

            <div className="space-y-1">
              <p className="text-[var(--reader-text-subtle)] text-[8px] uppercase tracking-[0.3em] font-black italic">Likes</p>
              <div className="flex items-center gap-4">
                <LikeButton
                  contentType="novel"
                  contentId={novelId || ""}
                  initialLikeCount={novel.likes || 0}
                />
                <ReportModalClient 
                  contentType="novel"
                  contentId={novelId}
                  contentTitle={novel.title}
                  authorId={novel.authorId}
                />
                <div className="h-1 w-1 bg-[var(--reader-border)] rounded-full" />
                <span className="text-[var(--reader-text)] uppercase font-black text-sm">{(novel.views || 0).toLocaleString()} Views</span>
              </div>
            </div>
          </div>

          <div className="w-full pt-4">
            <NovelActions novel={novel} novelId={novelId} slug={slug} chapters={chapters} />
          </div>
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

          <ViralShare 
            title={novel.title} 
            author={novel.authorName} 
            url={`/novel/${slug}`} 
          />

          {/* More from Author */}
          <div className="pt-16 border-t border-white/5">
            <AuthorWorks 
              authorId={novel.authorId} 
              authorName={novel.authorName} 
              currentWorkId={novelId} 
              type="novel" 
            />
          </div>
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
    </>
  );
}
