import type { NextConfig } from "next";

// eslint-disable-next-line no-restricted-syntax
if (process.env.NODE_ENV === 'production') {
  const required = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_KAKAO_MAP_KEY', 'NEXT_PUBLIC_SITE_URL']
  // eslint-disable-next-line no-restricted-syntax
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`[빌드 실패] 환경변수 누락: ${missing.join(', ')}`)
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] },
  },
  devIndicators: false,
  // 외부 가변 도메인 (S3 presigned, picsum) 사용 환경에서는 Next의 on-the-fly
  // 최적화를 강제할 수 없지만, 향후 동일 origin 또는 등록된 remote pattern에
  // 대해서는 AVIF/WebP·resize·캐싱이 동작하도록 unoptimized=true 를 제거한다.
  // 만약 next/image가 잡지 못하는 가변 도메인이 추가되면 onError fallback 또는
  // unoptimized prop을 컴포넌트 단위로 지정한다.
  images: {
    unoptimized: true, // Vercel Hobby 플랜 이미지 최적화 할당량 초과 방지
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' }, // MSW mock 이미지 (개발 환경)
      { protocol: 'https', hostname: '*.s3.ap-northeast-2.amazonaws.com' },
    ],
  },
  // 빌드 캐시 압축 — 빌드 결과물 크기 절감
  compress: true,
};

export default nextConfig;
