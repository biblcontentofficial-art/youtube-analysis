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
  // CSP: YouTube 임베드, Clerk, 결제 PG 허용
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.bibllab.com https://*.clerk.accounts.dev https://pay.toss.im https://js.tosspayments.com https://cpay.payple.kr https://testcpay.payple.kr",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://i.ytimg.com https://yt3.ggpht.com https://yt3.googleusercontent.com https://img.clerk.com",
      "frame-src 'self' https://pay.toss.im https://cpay.payple.kr https://testcpay.payple.kr https://accounts.google.com",
      "connect-src 'self' https://clerk.bibllab.com https://*.clerk.accounts.dev https://api.clerk.com https://*.supabase.co wss://*.supabase.co https://*.upstash.io",
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
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
