import { MetadataRoute } from 'next'
import { getSupabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bibllab.com'
  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    // 주력: 유튜브 채널 대행 (TMK STUDIO)
    {
      url: `${baseUrl}/studio`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/studio/consulting`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/studio/class/consulting`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    // 메인
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/trend-search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/channels`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools/calculator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // 정책
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-03-19'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-03-30'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date('2026-03-19'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 발행된 인사이트 글 동적 추가
  try {
    const db = getSupabase()
    if (db) {
      const { data: posts } = await db
        .from('posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(500)

      const postUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
        url: `${baseUrl}/insights/${p.slug}`,
        lastModified: new Date(p.updated_at || p.published_at || now),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      return [...staticUrls, ...postUrls]
    }
  } catch (e) {
    console.error('[sitemap] posts fetch failed', e)
  }

  return staticUrls
}
