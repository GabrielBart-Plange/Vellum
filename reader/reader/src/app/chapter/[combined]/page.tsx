import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import ChapterReaderClient from "@/components/reader/ChapterReaderClient";

interface PageProps {
  params: Promise<{ combined: string }>;
}

async function getChapterData(combined: string) {
  if (!adminDb) return null;
  
  const lastHyphenIndex = combined.lastIndexOf("-");
  if (lastHyphenIndex === -1) return null;
  
  const novelIdentifier = combined.substring(0, lastHyphenIndex);
  const chapterNumStr = combined.substring(lastHyphenIndex + 1);
  const chapterOrder = parseInt(chapterNumStr);

  if (isNaN(chapterOrder)) return null;

  // 1. Find Novel
  let novelId = novelIdentifier;
  let novelDoc = await adminDb.collection('novels').doc(novelId).get();

  if (!novelDoc.exists) {
    const qSlug = await adminDb.collection('novels')
      .where('slug', '==', novelIdentifier)
      .where('published', '==', true)
      .limit(1)
      .get();
      
    if (!qSlug.empty) {
      novelDoc = qSlug.docs[0];
      novelId = novelDoc.id;
    } else {
      const maybeNum = parseInt(novelIdentifier);
      if (!isNaN(maybeNum)) {
        const qNum = await adminDb.collection('novels')
          .where('numericalId', '==', maybeNum)
          .where('published', '==', true)
          .limit(1)
          .get();
        if (!qNum.empty) {
          novelDoc = qNum.docs[0];
          novelId = novelDoc.id;
        }
      }
    }
  }

  if (!novelDoc.exists) return null;

  // 2. Find Chapter
  const chapSnap = await adminDb.collection('novels').doc(novelId).collection('chapters')
    .where('order', '==', chapterOrder)
    .where('published', '==', true)
    .limit(1)
    .get();

  if (chapSnap.empty) return null;

  const novelData = novelDoc.data();
  const chapterDoc = chapSnap.docs[0];
  const chapterData = chapterDoc.data();

  return {
    novelId,
    chapterId: chapterDoc.id,
    novel: JSON.parse(JSON.stringify(novelData)),
    chapter: JSON.parse(JSON.stringify(chapterData)),
    chapterOrder
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { combined } = await params;
  const data = await getChapterData(combined);

  if (!data) return { title: 'Chapter Not Found' };

  const { novel, chapter, chapterOrder } = data;
  const title = `Chapter ${chapterOrder}: ${chapter.title} - ${novel.title} | Vellum`;
  const description = chapter.content?.substring(0, 160).replace(/[#*`]/g, '') || `Read chapter ${chapterOrder} of ${novel.title} on Vellum.`;

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

export default async function UnifiedChapterPage({ params }: PageProps) {
  const { combined } = await params;
  const data = await getChapterData(combined);

  if (!data) notFound();

  return (
    <ChapterReaderClient 
      combined={combined}
      initialNovel={data.novel}
      initialChapter={data.chapter}
      initialNovelId={data.novelId}
      initialChapterId={data.chapterId}
    />
  );
}
