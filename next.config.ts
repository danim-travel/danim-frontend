import type { NextConfig } from "next";

// eslint-disable-next-line no-restricted-syntax
if (process.env.NODE_ENV === 'production') {
  const required = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_KAKAO_MAP_KEY']
  // eslint-disable-next-line no-restricted-syntax
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`[빌드 실패] 환경변수 누락: ${missing.join(', ')}`)
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '*.s3.ap-northeast-2.amazonaws.com' },
    ],
  },
};

export default nextConfig;
