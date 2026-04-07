import { adminDb } from '@/lib/firebase-admin';
import React from 'react';

interface JsonLdData {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  author?: {
    '@type': string;
    name: string;
  };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url?: string;
  genre?: string;
  keywords?: string;
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    ratingCount: number;
  };
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

/**
 * Generates JSON-LD structured data for SEO (Schema.org)
 * This helps Google understand content and display rich snippets
 */
export class SeoJsonLd {
  /**
   * Safely format date to ISO string
   */
  private static safeToIsoString(dateValue: any): string {
    try {
      if (!dateValue) return new Date().toISOString();
      
      // Handle Firestore Timestamp
      if (dateValue.seconds !== undefined) {
        return new Date(dateValue.seconds * 1000).toISOString();
      }
      
      // Handle Date object or ISO string or timestamp number
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  }

  /**
   * Generate structured data for a Novel
   */
  static generateNovelSchema(novel: any, chapters: any[] = []): JsonLdData {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum.app';
    const novelUrl = `${baseUrl}/novel/${novel.slug}`;
    
    const schema: JsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: novel.title,
      description: novel.description || `A captivating ${novel.genre} story by ${novel.authorName}`,
      author: {
        '@type': 'Person',
        name: novel.authorName
      },
      datePublished: this.safeToIsoString(novel.createdAt),
      dateModified: this.safeToIsoString(novel.updatedAt || novel.createdAt),
      image: novel.coverImage || `${baseUrl}/api/og/novel/${novel.slug}`,
      url: novelUrl,
      genre: novel.genre || 'Fiction',
      keywords: Array.isArray(novel.tags) ? novel.tags.join(', ') : novel.tags || ''
    };

    // Add rating if likes exist
    if (novel.likes && novel.likes > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: '4.5', // Default rating - could be calculated from likes/views
        ratingCount: novel.likes
      };
    }

    // Add pricing if premium
    if (novel.isPremium && novel.price) {
      schema.offers = {
        '@type': 'Offer',
        price: novel.price.toString(),
        priceCurrency: 'GHS', // Ghanaian Cedis
        availability: 'https://schema.org/InStock'
      };
    }

    return schema;
  }

  /**
   * Generate structured data for a Story
   */
  static generateStorySchema(story: any): JsonLdData {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum.app';
    const storyUrl = `${baseUrl}/stories/${story.id}`;
    
    const schema: JsonLdData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: story.title,
      description: story.description || `A compelling ${story.genre} story by ${story.authorName}`,
      author: {
        '@type': 'Person',
        name: story.authorName
      },
      datePublished: this.safeToIsoString(story.createdAt),
      dateModified: this.safeToIsoString(story.updatedAt || story.createdAt),
      image: story.coverImage || `${baseUrl}/api/og/story/${story.id}`,
      url: storyUrl,
      genre: story.genre || 'Fiction',
      keywords: Array.isArray(story.tags) ? story.tags.join(', ') : story.tags || ''
    };

    // Add rating if likes exist
    if (story.likes && story.likes > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: '4.5',
        ratingCount: story.likes
      };
    }

    return schema;
  }

  /**
   * Generate structured data for Author Profile
   */
  static generateAuthorSchema(author: any, works: any[] = []): JsonLdData {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum.app';
    const authorUrl = `${baseUrl}/authors/${author.id}`;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: author.displayName || author.username || 'Anonymous Author',
      description: author.bio || 'A talented author on Vellum',
      url: authorUrl,
      image: author.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.displayName}`,
      // Add works if available
      ...(works.length > 0 && {
        works: works.map(work => ({
          '@type': 'CreativeWork',
          name: work.title,
          url: `${baseUrl}/${work.type === 'novel' ? 'novel' : 'stories'}/${work.slug || work.id}`
        }))
      })
    } as JsonLdData;
  }

  /**
   * Generate breadcrumb structured data
   */
  static generateBreadcrumbSchema(breadcrumbs: Array<{name: string, url: string}>) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum.app';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${baseUrl}${crumb.url}`
      }))
    };
  }

  /**
   * Generate website schema for SEO
   */
  static generateWebsiteSchema() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum.app';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Vellum - African Literary Platform',
      description: 'Discover and read captivating stories from African authors. Support creators with our innovative Inklet economy.',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }
}

/**
 * Helper function to render JSON-LD script tag
 */
export function renderJsonLd(data: any): React.ReactElement {
  return React.createElement(
    'script',
    {
      type: 'application/ld+json',
      dangerouslySetInnerHTML: {
        __html: JSON.stringify(data, null, 2)
      }
    }
  );
}
