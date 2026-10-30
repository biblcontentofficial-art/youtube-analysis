import { MetadataRoute } from 'next'
import { getSupabase } from '@/lib/supabase'

// 칼럼 새 글이 들어오도록 한 시간마다 다시 만든다(빌드 때 한 번 굳지 않게)
export const revalidate = 3600

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
    // 비블 bibl 칼럼(공개 게시판, 2026-10-30 색인 허용). 옛 /insights 는 여기로 리다이렉트되므로 싣지 않는다
    {
      url: `${baseUrl}/community?cat=column`,
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

  // 비블 bibl 칼럼 글 동적 추가 (커뮤니티 column 게시판, 게시된 글). 옛 posts 테이블·/insights/[slug] 는 리다이렉트라 뺀다
  try {
    const db = getSupabase()
    if (db) {
      const { data: board } = await db
        .from('community_boards')
        .select('id')
        .eq('slug', 'column')
        .eq('is_active', true)
        .maybeSingle()
      if (board) {
        const { data: posts } = await db
          .from('community_posts')
          .select('id, created_at, updated_at')
          .eq('board_id', board.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1000)

        const postUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
          url: `${baseUrl}/community/column/${p.id}`,
          lastModified: new Date(p.updated_at || p.created_at || now),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
        return [...staticUrls, ...postUrls]
      }
    }
  } catch (e) {
    console.error('[sitemap] column posts fetch failed', e)
  }

  return staticUrls
}
