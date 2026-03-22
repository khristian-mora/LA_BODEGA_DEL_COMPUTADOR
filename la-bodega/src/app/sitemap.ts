import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const staticPages = [
    { url: baseUrl, priority: 1.0, changefreq: 'daily' as const },
    { url: `${baseUrl}/products`, priority: 0.9, changefreq: 'daily' as const },
    { url: `${baseUrl}/sales`, priority: 0.8, changefreq: 'weekly' as const },
    { url: `${baseUrl}/services`, priority: 0.8, changefreq: 'weekly' as const },
    { url: `${baseUrl}/auth/login`, priority: 0.5, changefreq: 'monthly' as const },
    { url: `${baseUrl}/auth/register`, priority: 0.5, changefreq: 'monthly' as const },
    { url: `${baseUrl}/legal/privacy`, priority: 0.3, changefreq: 'monthly' as const },
    { url: `${baseUrl}/legal/terms`, priority: 0.3, changefreq: 'monthly' as const },
  ];

  return staticPages.map((page) => ({
    url: page.url,
    lastModified: new Date(),
    changeFrequency: page.changefreq,
    priority: page.priority,
  }));
}
