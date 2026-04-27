import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StoryReaderClient from "@/components/stories/StoryReaderClient";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import AuthorWorks from "@/components/author/AuthorWorks";
import { SeoJsonLd, renderJsonLd } from '@/lib/seo/jsonLd';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getStoryData(id: string) {
  if (!adminDb) return null;
  
  let storyDoc = await adminDb.collection('stories').doc(id).get();

  if (!storyDoc.exists) {
    // Check alphanumericId
    const alphaQuery = await adminDb.collection('stories')
      .where('alphanumericId', '==', id.toUpperCase())
      .where('published', '==', true)
      .limit(1)
      .get();
      
    if (!alphaQuery.empty) {
      storyDoc = alphaQuery.docs[0];
    } else {
      // Check slug
      const slugQuery = await adminDb.collection('stories')
        .where('slug', '==', id)
        .where('published', '==', true)
        .limit(1)
        .get();
      if (!slugQuery.empty) {
        storyDoc = slugQuery.docs[0];
      }
    }
  }

  if (!storyDoc.exists) return null;

  const data = storyDoc.data();
  if (!data?.published) return null;

  return { id: storyDoc.id, story: JSON.parse(JSON.stringify(data)) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getStoryData(id);

  if (!data) return { title: 'Story Not Found' };

  const { story } = data;
  const title = `${story.title} | Vellum`;
  const description = story.description?.substring(0, 160) || "Read this short story excerpt on Vellum.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [story.coverImage || ''],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [story.coverImage || ''],
    },
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getStoryData(id);

  if (!data) notFound();

  const { id: storyId, story } = data;

  // Generate JSON-LD structured data
  const jsonLdSchema = SeoJsonLd.generateStorySchema(story);
  const breadcrumbSchema = SeoJsonLd.generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Stories', url: '/stories' },
    { name: story.title, url: `/stories/${id}` }
  ]);

  return (
    <>
      {renderJsonLd(jsonLdSchema)}
      {renderJsonLd(breadcrumbSchema)}
      <main className="min-h-screen px-6 py-24 bg-[var(--reader-bg)] font-sans relative">
      <div className="max-w-4xl mx-auto mb-8 relative z-50">
        <Breadcrumbs customLabels={{ [id]: story.title }} />
      </div>
      <StoryReaderClient 
        storyId={storyId} 
        story={story} 
        initialLocked={story.isPremium || false} 
        unlockPrice={story.price || 10} 
      />

      {/* More from Author */}
      <div className="max-w-4xl mx-auto pt-24 mt-24 border-t border-white/5">
        <AuthorWorks 
          authorId={story.authorId} 
          authorName={story.authorName} 
          currentWorkId={storyId} 
          type="story" 
        />
      </div>
      
      {/* Footer / Credits can stay on server */}
      <footer className="pt-24 text-center max-w-4xl mx-auto">
        <div className="h-px w-16 bg-[var(--reader-accent)] mx-auto mb-10 opacity-30" />
        <p className="text-[11px] uppercase tracking-[0.8em] opacity-40 font-black italic">END OF CHRONICLE</p>
      </footer>
      </main>
    </>
  );
}
