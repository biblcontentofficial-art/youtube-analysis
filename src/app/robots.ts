import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/mypage',
          '/sign-in',
          '/sign-up',
          '/sso-callback',
          '/payment',
          '/saved',
        ],
      },
    ],
    sitemap: 'https://bibllab.com/sitemap.xml',
  }
}
