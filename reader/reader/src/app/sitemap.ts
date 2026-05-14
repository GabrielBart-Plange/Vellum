import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const revalidate = 3600; // Regenerate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Default to vellum-alpha as per current environment, but allow override via NEXT_PUBLIC_SITE_URL
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vellum-alpha.vercel.app';
  const baseUrl = rawUrl.replace('v1-vellum.vercel.app', 'vellum-alpha.vercel.app');

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

  const genres = ['litrpg', 'progression-fantasy', 'cultivation', 'xianxia', 'system', 'fantasy', 'sci-fi', 'romance'];
  const genreRoutes = genres.map(slug => ({
    url: `${baseUrl}/genre/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  try {
    // 1. Dynamic Novel Routes
    const novelsRef = collection(db, 'novels');
    const novelQuery = query(novelsRef, where('published', '==', true));
    const novelSnap = await getDocs(novelQuery);
    
    const novelRoutes: any[] = [];
    const chapterRoutes: any[] = [];

    for (const novelDoc of novelSnap.docs) {
      const data = novelDoc.data();
      const slug = data.slug || novelDoc.id;
      const novelId = novelDoc.id;

      novelRoutes.push({
        url: `${baseUrl}/novel/${slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });

      // 2. Fetch Chapters for each novel
      const chaptersRef = collection(db, `novels/${novelId}/chapters`);
      const chapterQuery = query(chaptersRef, where('published', '==', true));
      const chapterSnap = await getDocs(chapterQuery);
      
      chapterSnap.docs.forEach(chapterDoc => {
        const cData = chapterDoc.data();
        chapterRoutes.push({
          url: `${baseUrl}/chapter/${novelId}-${chapterDoc.id}`,
          lastModified: cData.updatedAt?.toDate() || new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.4,
        });
      });
    }

    // 3. Dynamic Story Routes
    const storiesRef = collection(db, 'stories');
    const storyQuery = query(storiesRef, where('published', '==', true));
    const storySnap = await getDocs(storyQuery);
    const storyRoutes = storySnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/stories/${doc.id}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 4. Dynamic Author Routes
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

    return [
      ...staticRoutes, 
      ...genreRoutes,
      ...novelRoutes, 
      ...chapterRoutes, 
      ...storyRoutes, 
      ...authorRoutes
    ];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [...staticRoutes, ...genreRoutes];
  }
}
