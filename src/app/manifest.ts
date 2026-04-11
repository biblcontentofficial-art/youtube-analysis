import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '비블랩 (bibl lab) - 유튜브 키워드·채널 분석 도구',
    short_name: '비블랩',
    description: '유튜브 키워드 분석, 채널 찾기, 영상 반응도 분석. 크리에이터를 위한 데이터 인사이트.',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#2dd4bf',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  }
}
