import { MetadataRoute } from 'next'

const DISALLOW = [
  '/admin',
  '/api/',
  '/mypage',
  '/sign-in',
  '/sign-up',
  '/sso-callback',
  '/payment',
  '/saved',
  '/maintenance',
  '/tmkstudio', // redirect-only route — index /studio instead
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 구글봇 (가장 우선)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: DISALLOW,
      },
      // 네이버봇
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: DISALLOW,
      },
      // 빙
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: DISALLOW,
      },
      // 다음(카카오)
      {
        userAgent: 'Daum',
        allow: '/',
        disallow: DISALLOW,
      },
      // 기타 모든 봇
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: [
      'https://bibllab.com/sitemap.xml',
      'https://bibllab.com/feed.xml',
    ],
    host: 'https://bibllab.com',
  }
}
