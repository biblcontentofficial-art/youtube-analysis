import type { Metadata } from "next";
// import { Inter, JetBrains_Mono } from "next/font/google"; // Pretendard 폰트 사용

import "./globals.css";

// Pretendard 폰트 (CDN 방식)
// Next.js 14에서 @next/font/google과 함께 CDN 방식의 전역 폰트를 사용하는 경우
// layout.tsx에서 직접 <link> 태그를 추가하는 것이 적절합니다.
// 자세한 내용은 Next.js 공식 문서를 참고하세요.

export const metadata: Metadata = {
  title: "YouTube Performance Dashboard",
  description: "Search YouTube videos and analyze performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        // Geist 폰트 대신 Pretendard 적용
        className="font-sans antialiased"
      >
        {children}
      </body>
    </html>
  );
}
