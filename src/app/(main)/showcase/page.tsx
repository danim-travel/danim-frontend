"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PostModal from "@/components/PostModal";
import { Spinner, SpinnerOverlay } from "@/components/ui/spinner";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

const SECTIONS = [
  { id: "sidenav", label: "SideNav" },
  { id: "spinner", label: "Spinner" },
  { id: "kakaomap", label: "KakaoMap" },
  { id: "postmodal", label: "PostModal" },
];

export default function ShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-10">
          <h1 className="text-page-title font-bold text-text">컴포넌트 쇼케이스</h1>
          <p className="text-body text-text-disabled mt-1">공통 컴포넌트 목록 및 동작 확인</p>
          <div className="flex gap-2 mt-4">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1 rounded-full text-caption font-medium bg-bg-card border border-border text-text-body hover:border-primary hover:text-primary transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* SideNav */}
        <section id="sidenav" className="mb-14">
          <SectionHeader
            title="SideNav"
            path="src/components/SideNav.tsx"
            description="좌측 고정 68px 네비게이션. (main) 레이아웃에 포함되어 자동 렌더링."
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 text-body text-text-disabled">
            현재 화면 왼쪽에 표시 중
          </div>
        </section>

        {/* Spinner */}
        <section id="spinner" className="mb-14">
          <SectionHeader
            title="Spinner"
            path="src/components/ui/spinner.tsx"
            description="로딩 인디케이터. Spinner(인라인)와 SpinnerOverlay(영역 중앙 배치) 두 가지 제공."
            props={[
              { name: "size?", type: '"sm" | "md" | "lg"', desc: "스피너 크기 (기본값: md)" },
              { name: "className?", type: "string", desc: "추가 스타일" },
            ]}
          />
          <div className="space-y-4">
            {/* 사이즈별 인라인 */}
            <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 flex items-center justify-center gap-10">
              {(["sm", "md", "lg"] as const).map((size) => (
                <div key={size} className="flex flex-col items-center gap-3">
                  <Spinner size={size} />
                  <span className="text-caption text-text-disabled font-mono">{size}</span>
                </div>
              ))}
            </div>

            {/* SpinnerOverlay — 영역 중앙 배치 확인 */}
            <div className="bg-bg-card rounded-2xl border border-border-subtle overflow-hidden h-40">
              <SpinnerOverlay />
            </div>
            <p className="text-caption text-text-disabled">SpinnerOverlay — w-full h-full 컨테이너 내 중앙 배치</p>
          </div>
        </section>

        {/* KakaoMap */}
        <section id="kakaomap" className="mb-14">
          <SectionHeader
            title="KakaoMap"
            path="src/components/KakaoMap.tsx"
            description="카카오맵 SDK 기반 지도. SSR 비활성화 필수 (dynamic import)."
            props={[
              { name: "selectedPost", type: "Post | null", desc: "선택된 게시물 (핀 하이라이트)" },
              { name: "onBoundsChange?", type: "(bounds) => void", desc: "지도 영역 변경 콜백" },
              { name: "onPinClick?", type: "(post, pinIndex) => void", desc: "핀 클릭 콜백" },
            ]}
          />
          <div className="rounded-2xl overflow-hidden border border-border-subtle h-[400px]">
            <KakaoMap selectedPost={null} />
          </div>
        </section>

        {/* PostModal */}
        <section id="postmodal" className="mb-14">
          <SectionHeader
            title="PostModal"
            path="src/components/PostModal.tsx"
            description="게시글 상세 모달. postId로 내부 fetch (GET /v1/posts/:postId)."
            props={[
              { name: "postId", type: "string", desc: "조회할 게시물 ID" },
              { name: "onClose", type: "() => void", desc: "모달 닫기 콜백" },
              { name: "onGoToMain?", type: "() => void", desc: "홈 이동 콜백" },
              { name: "showGoToMain?", type: "boolean", desc: "홈 이동 버튼 노출 여부" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 flex items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-text-inverse text-body font-semibold hover:opacity-90 transition-opacity"
            >
              PostModal 열기
            </button>
            <span className="text-caption text-text-disabled">postId: &quot;showcase-post&quot; (MSW mock)</span>
          </div>
        </section>
      </div>

      {modalOpen && (
        <PostModal postId="showcase-post" onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

function SectionHeader({
  title,
  path,
  description,
  props,
}: {
  title: string;
  path: string;
  description: string;
  props?: { name: string; type: string; desc: string }[];
}) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-card-title font-bold text-text">{title}</h2>
        <code className="text-caption text-text-disabled font-mono">{path}</code>
      </div>
      <p className="text-body text-text-muted mb-3">{description}</p>
      {props && (
        <div className="overflow-x-auto">
          <table className="w-full text-caption border-collapse">
            <thead>
              <tr className="bg-bg-subtle">
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle rounded-tl-lg">prop</th>
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle">type</th>
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle rounded-tr-lg">설명</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p) => (
                <tr key={p.name} className="border-b border-border-subtle">
                  <td className="px-3 py-2 font-mono text-primary border border-border-subtle">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-text-muted border border-border-subtle">{p.type}</td>
                  <td className="px-3 py-2 text-text-body border border-border-subtle">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
