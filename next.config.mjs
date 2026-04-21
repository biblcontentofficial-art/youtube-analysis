/** @type {import('next').NextConfig} */

const securityHeaders = [
  // 클릭재킹 방지
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // MIME 타입 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 레퍼러 정보 최소 노출
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // HSTS (1년, 서브도메인 포함)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // XSS 필터 (구형 브라우저)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // 불필요한 브라우저 기능 비활성화
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // CSP: YouTube 임베드, Supabase Auth, 결제 PG, OAuth 프로필 이미지 허용
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pay.toss.im https://js.tosspayments.com https://cpay.payple.kr https://testcpay.payple.kr https://t1.kakaocdn.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://i.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://lh3.googleusercontent.com https://k.kakaocdn.net https://*.kakaocdn.net",
      "frame-src 'self' https://pay.toss.im https://cpay.payple.kr https://testcpay.payple.kr https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io",
      "media-src 'self' https://www.youtube.com",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
        ],
      },
      {
        source: "/feed.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.bibllab.com" }],
        destination: "https://bibllab.com/:path*",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
