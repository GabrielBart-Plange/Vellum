import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://v1-vellum.vercel.app';

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/novel',
    '/stories',
    '/ranking',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    // Dynamic Novel Routes
    const novelsRef = collection(db, 'novels');
    const novelQuery = query(novelsRef, where('published', '==', true));
    const novelSnap = await getDocs(novelQuery);
    const novelRoutes = novelSnap.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      return {
        url: `${baseUrl}/novel/${slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // Dynamic Author Routes
    const authorsRef = collection(db, 'users');
    const authorSnap = await getDocs(authorsRef);
    const authorRoutes = authorSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/authors/${doc.id}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    });

    return [...staticRoutes, ...novelRoutes, ...authorRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return staticRoutes;
  }
}
