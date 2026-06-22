import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "@/providers";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: "Danim · 여행자들의 이야기",
  description: "여행의 모든 순간을 기록하세요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <head>
        {/* 외부 이미지 호스트와 TLS·DNS 핸드셰이크를 미리 시작해 첫 이미지의 LCP 단축 */}
        <link rel="preconnect" href="https://s3.ap-northeast-2.amazonaws.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://s3.ap-northeast-2.amazonaws.com" />
        {/* 카카오맵 SDK 호스트 — Script가 afterInteractive 인 만큼 미리 연결 */}
        <link rel="preconnect" href="https://dapi.kakao.com" />
        <link rel="dns-prefetch" href="https://dapi.kakao.com" />
      </head>
      <body className="h-full">
        <Providers>
          <NuqsAdapter>
            {children}
            {modal}
          </NuqsAdapter>
        </Providers>
      </body>
    </html>
  );
}
