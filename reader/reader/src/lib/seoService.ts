import { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Service to generate SEO and Social metadata for Viral Loops
 */
export const seoService = {
  /**
   * Generates dynamic Metadata for a Novel or Story
   */
  async getMetadata(type: 'novel' | 'story', slug: string): Promise<Metadata> {
    if (!adminDb) return { title: 'Vellum' };

    const collection = type === 'novel' ? 'novels' : 'stories';
    let doc = await adminDb.collection(collection).doc(slug).get();

    if (!doc.exists) {
      const slugQuery = await adminDb.collection(collection)
        .where('slug', '==', slug)
        .limit(1)
        .get();
      if (!slugQuery.empty) doc = slugQuery.docs[0];
    }

    if (!doc.exists) return { title: 'Not Found | Vellum' };

    const data = doc.data();
    const title = `${data?.title} | Vellum`;
    const description = data?.description?.substring(0, 160) || "Read this original chronicle on Vellum.";
    const image = data?.coverImage || 'https://vellum.app/default-og.png';
    const url = `https://vellum.app/${type}/${slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Vellum',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: data?.title,
          },
        ],
        locale: 'en_US',
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
        creator: `@${data?.authorName?.replace(/\s+/g, '')}`,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  }
};
