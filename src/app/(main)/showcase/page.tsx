"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Heart, Search, Bell, Settings, Trash2, Plus } from "lucide-react";

import PostModal from "@/components/PostModal";
import { Spinner, SpinnerOverlay } from "@/components/ui/spinner";

import { Avatar }      from "@/components/common/Avatar/Avatar";
import { Badge }       from "@/components/common/Badge/Badge";
import { Button }      from "@/components/common/Button/Button";
import { Card }        from "@/components/common/Card/Card";
import { Checkbox }    from "@/components/common/Checkbox/Checkbox";
import { IconButton }  from "@/components/common/IconButton/IconButton";
import { Modal }       from "@/components/common/Modal/Modal";
import { SearchBar }   from "@/components/common/SearchBar/SearchBar";
import { Segmented }   from "@/components/common/Segmented/Segmented";
import { Stepper }     from "@/components/common/Stepper/Stepper";
import { Tabs }        from "@/components/common/Tabs/Tabs";
import { TextField }   from "@/components/common/TextField/TextField";
import { Toast }       from "@/components/common/Toast/Toast";
import { Toggle }      from "@/components/common/Toggle/Toggle";
import { EmptyState }  from "@/components/common/feedback/EmptyState";
import { LoadingState } from "@/components/common/feedback/LoadingState";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

const SECTIONS = [
  { id: "button",      label: "Button" },
  { id: "iconbutton",  label: "IconButton" },
  { id: "badge",       label: "Badge" },
  { id: "avatar",      label: "Avatar" },
  { id: "card",        label: "Card" },
  { id: "textfield",   label: "TextField" },
  { id: "searchbar",   label: "SearchBar" },
  { id: "checkbox",    label: "Checkbox" },
  { id: "toggle",      label: "Toggle" },
  { id: "segmented",   label: "Segmented" },
  { id: "tabs",        label: "Tabs" },
  { id: "stepper",     label: "Stepper" },
  { id: "modal",       label: "Modal" },
  { id: "toast",       label: "Toast" },
  { id: "emptystate",  label: "EmptyState" },
  { id: "loading",     label: "LoadingState" },
  { id: "spinner",     label: "Spinner" },
  { id: "sidenav",     label: "SideNav" },
  { id: "kakaomap",    label: "KakaoMap" },
  { id: "postmodal",   label: "PostModal" },
];

const STEPPER_STEPS = [
  { label: "기본 정보" },
  { label: "여행 경로" },
  { label: "사진 업로드" },
  { label: "완료" },
];

const TAB_ITEMS = [
  { key: "posts", label: "게시글", count: 12 },
  { key: "liked", label: "좋아요" },
  { key: "saved", label: "저장됨", count: 3 },
];

const SEGMENT_ITEMS = [
  { key: "male",   label: "남성" },
  { key: "female", label: "여성" },
];

export default function ShowcasePage() {
  const [postModalOpen,  setPostModalOpen]  = useState(false);
  const [commonModalOpen, setCommonModalOpen] = useState(false);
  const [checked,        setChecked]        = useState(false);
  const [toggled,        setToggled]        = useState(false);
  const [tabValue,       setTabValue]       = useState("posts");
  const [segValue,       setSegValue]       = useState("male");
  const [searchValue,    setSearchValue]    = useState("");
  const [stepperCurrent, setStepperCurrent] = useState(1);

  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* 헤더 + 목차 */}
        <div className="mb-10">
          <h1 className="text-page-title font-bold text-text">컴포넌트 쇼케이스</h1>
          <p className="text-body text-text-disabled mt-1">공통 컴포넌트 목록 및 동작 확인</p>
          <div className="flex flex-wrap gap-2 mt-4">
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

        {/* ── Button ─────────────────────────────── */}
        <section id="button" className="mb-14">
          <SectionHeader
            title="Button"
            path="src/components/common/Button/Button.tsx"
            description="주요 액션 버튼. variant 3가지 × size 3가지. loading · disabled 상태 지원."
            props={[
              { name: "variant?",   type: '"primary" | "secondary" | "outline"', desc: "버튼 스타일 (기본: primary)" },
              { name: "size?",      type: '"sm" | "md" | "lg"',                  desc: "버튼 크기 (기본: md)" },
              { name: "fullWidth?", type: "boolean",                             desc: "부모 너비 전체 차지" },
              { name: "loading?",   type: "boolean",                             desc: "처리 중 상태 (비활성화 + 텍스트 변경)" },
              { name: "leftIcon?",  type: "ReactNode",                           desc: "왼쪽 아이콘" },
              { name: "rightIcon?", type: "ReactNode",                           desc: "오른쪽 아이콘" },
            ]}
          />
          <div className="space-y-4">
            {/* variant */}
            <Preview label="variant">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
            </Preview>
            {/* size */}
            <Preview label="size">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </Preview>
            {/* icon */}
            <Preview label="icon">
              <Button leftIcon={<Heart size={16} />}>좋아요</Button>
              <Button variant="secondary" rightIcon={<Plus size={16} />}>추가</Button>
            </Preview>
            {/* disabled / loading */}
            <Preview label="disabled · loading">
              <Button disabled>Primary</Button>
              <Button variant="secondary" disabled>Secondary</Button>
              <Button variant="outline" disabled>Outline</Button>
              <Button loading>처리 중</Button>
            </Preview>
          </div>
        </section>

        {/* ── IconButton ─────────────────────────── */}
        <section id="iconbutton" className="mb-14">
          <SectionHeader
            title="IconButton"
            path="src/components/common/IconButton/IconButton.tsx"
            description="아이콘 전용 버튼. aria-label 필수."
            props={[
              { name: "icon",       type: "ReactNode",           desc: "표시할 아이콘" },
              { name: "aria-label", type: "string",              desc: "접근성 레이블 (필수)" },
              { name: "variant?",   type: '"ghost" | "filled"',  desc: "버튼 스타일 (기본: ghost)" },
              { name: "size?",      type: '"sm" | "md"',         desc: "버튼 크기 (기본: md)" },
            ]}
          />
          <Preview label="variant · size">
            <IconButton icon={<Heart size={20} />} aria-label="좋아요" variant="ghost" />
            <IconButton icon={<Bell size={20} />}  aria-label="알림"   variant="filled" />
            <IconButton icon={<Settings size={18} />} aria-label="설정" size="sm" />
            <IconButton icon={<Trash2 size={20} />}   aria-label="삭제" disabled />
          </Preview>
        </section>

        {/* ── Badge ──────────────────────────────── */}
        <section id="badge" className="mb-14">
          <SectionHeader
            title="Badge"
            path="src/components/common/Badge/Badge.tsx"
            description="태그·필터 칩. filter variant는 selected 상태 지원."
            props={[
              { name: "variant?",  type: '"tag" | "filter"', desc: "뱃지 종류 (기본: tag)" },
              { name: "selected?", type: "boolean",          desc: "선택 상태 (filter variant 전용)" },
              { name: "leftIcon?", type: "ReactNode",        desc: "왼쪽 아이콘" },
            ]}
          />
          <Preview label="tag · filter">
            <Badge variant="tag">제주도</Badge>
            <Badge variant="tag" leftIcon={<span>📍</span>}>부산</Badge>
            <Badge variant="filter">전체</Badge>
            <Badge variant="filter" selected>맛집</Badge>
            <Badge variant="filter">카페</Badge>
          </Preview>
        </section>

        {/* ── Avatar ─────────────────────────────── */}
        <section id="avatar" className="mb-14">
          <SectionHeader
            title="Avatar"
            path="src/components/common/Avatar/Avatar.tsx"
            description="사용자 프로필 이미지 또는 이니셜 아바타."
            props={[
              { name: "src?",     type: "string",                    desc: "프로필 이미지 URL" },
              { name: "initial?", type: "string",                    desc: "이미지 없을 때 표시할 이니셜" },
              { name: "size?",    type: '"sm" | "md" | "lg" | "xl"', desc: "크기 (기본: md)" },
              { name: "colorClass?", type: "string",                    desc: 'Tailwind bg 클래스. 예: "bg-primary"' },
              { name: "ring?",       type: "boolean",                   desc: "스토리 링 표시" },
            ]}
          />
          <Preview label="size · ring">
            <Avatar size="sm" initial="김" colorClass="bg-primary" />
            <Avatar size="md" initial="이" colorClass="bg-amber-400" />
            <Avatar size="lg" initial="박" colorClass="bg-indigo-500" />
            <Avatar size="xl" initial="정" colorClass="bg-pink-500" />
            <Avatar size="md" initial="링" ring />
          </Preview>
        </section>

        {/* ── Card ───────────────────────────────── */}
        <section id="card" className="mb-14">
          <SectionHeader
            title="Card"
            path="src/components/common/Card/Card.tsx"
            description="콘텐츠 컨테이너. padding · interactive 옵션."
            props={[
              { name: "padding?",     type: '"md" | "sm" | "none"', desc: "내부 패딩 (기본: md)" },
              { name: "interactive?", type: "boolean",              desc: "hover 시 shadow 상승 효과" },
            ]}
          />
          <Preview label="padding · interactive">
            <Card padding="sm" className="text-body text-text-muted">padding sm</Card>
            <Card padding="md" className="text-body text-text-muted">padding md</Card>
            <Card interactive className="text-body text-text-muted cursor-pointer">interactive hover</Card>
          </Preview>
        </section>

        {/* ── TextField ──────────────────────────── */}
        <section id="textfield" className="mb-14">
          <SectionHeader
            title="TextField"
            path="src/components/common/TextField/TextField.tsx"
            description="레이블·에러·helper 텍스트 포함 인풋."
            props={[
              { name: "label?",      type: "string",    desc: "입력 필드 레이블" },
              { name: "helperText?", type: "string",    desc: "하단 도움말 텍스트" },
              { name: "error?",      type: "string",    desc: "에러 메시지 (border 빨간색)" },
              { name: "required?",   type: "boolean",   desc: "필수 여부 표시" },
              { name: "rightSlot?",  type: "ReactNode", desc: "오른쪽 슬롯 (버튼 등)" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="이메일" placeholder="이메일을 입력하세요" required />
            <TextField label="비밀번호" type="password" placeholder="비밀번호" helperText="8자 이상 입력해주세요" />
            <TextField label="이름" placeholder="이름" error="이미 사용 중인 이름입니다" />
            <TextField label="인증번호" placeholder="6자리" rightSlot={<Button size="sm">인증 요청</Button>} />
          </div>
        </section>

        {/* ── SearchBar ──────────────────────────── */}
        <section id="searchbar" className="mb-14">
          <SectionHeader
            title="SearchBar"
            path="src/components/common/SearchBar/SearchBar.tsx"
            description="검색 인풋. pill · panel 두 가지 형태."
            props={[
              { name: "value",    type: "string",      desc: "입력값 (controlled)" },
              { name: "onClear?", type: "() => void",  desc: "입력값 지우기 콜백" },
              { name: "variant?", type: '"pill" | "panel"', desc: "형태 (기본: pill)" },
            ]}
          />
          <div className="space-y-3 max-w-sm">
            <SearchBar
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
              placeholder="장소를 검색해보세요"
              variant="pill"
            />
            <SearchBar
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
              placeholder="장소를 검색해보세요"
              variant="panel"
            />
          </div>
        </section>

        {/* ── Checkbox ───────────────────────────── */}
        <section id="checkbox" className="mb-14">
          <SectionHeader
            title="Checkbox"
            path="src/components/common/Checkbox/Checkbox.tsx"
            description="커스텀 체크박스."
            props={[
              { name: "checked",    type: "boolean",                  desc: "체크 상태" },
              { name: "onChange",   type: "(next: boolean) => void",  desc: "상태 변경 콜백" },
              { name: "label?",     type: "ReactNode",                desc: "체크박스 레이블" },
              { name: "disabled?",  type: "boolean",                  desc: "비활성화" },
            ]}
          />
          <Preview label="checked · disabled">
            <Checkbox checked={checked} onChange={setChecked} label="개인정보 처리에 동의합니다" />
            <Checkbox checked={true}  onChange={() => {}} label="항상 동의됨" disabled />
            <Checkbox checked={false} onChange={() => {}} label="비활성화" disabled />
          </Preview>
        </section>

        {/* ── Toggle ─────────────────────────────── */}
        <section id="toggle" className="mb-14">
          <SectionHeader
            title="Toggle"
            path="src/components/common/Toggle/Toggle.tsx"
            description="on/off 스위치."
            props={[
              { name: "checked",   type: "boolean",                 desc: "켜짐 상태" },
              { name: "onChange",  type: "(next: boolean) => void", desc: "상태 변경 콜백" },
              { name: "disabled?", type: "boolean",                 desc: "비활성화" },
            ]}
          />
          <Preview label="on · off · disabled">
            <div className="flex items-center gap-3">
              <Toggle checked={toggled} onChange={setToggled} />
              <span className="text-body text-text-muted">{toggled ? "켜짐" : "꺼짐"}</span>
            </div>
            <Toggle checked={true}  onChange={() => {}} disabled />
            <Toggle checked={false} onChange={() => {}} disabled />
          </Preview>
        </section>

        {/* ── Segmented ──────────────────────────── */}
        <section id="segmented" className="mb-14">
          <SectionHeader
            title="Segmented"
            path="src/components/common/Segmented/Segmented.tsx"
            description="세그먼트 버튼 그룹. 하나의 옵션을 선택."
            props={[
              { name: "items",      type: "SegmentedItem[]",          desc: "{ key, label } 배열" },
              { name: "value",      type: "string",                   desc: "선택된 key" },
              { name: "onChange",   type: "(key: string) => void",    desc: "선택 변경 콜백" },
              { name: "fullWidth?", type: "boolean",                  desc: "부모 너비 전체 차지" },
              { name: "disabled?",  type: "boolean",                  desc: "비활성화" },
            ]}
          />
          <div className="space-y-3 max-w-sm">
            <Segmented items={SEGMENT_ITEMS} value={segValue} onChange={setSegValue} fullWidth />
            <Segmented items={[{ key: "a", label: "옵션 A" }, { key: "b", label: "옵션 B" }, { key: "c", label: "옵션 C" }]} value="a" onChange={() => {}} fullWidth />
            <Segmented items={SEGMENT_ITEMS} value="male" onChange={() => {}} fullWidth disabled />
          </div>
        </section>

        {/* ── Tabs ───────────────────────────────── */}
        <section id="tabs" className="mb-14">
          <SectionHeader
            title="Tabs"
            path="src/components/common/Tabs/Tabs.tsx"
            description="탭 네비게이션. count · icon 지원."
            props={[
              { name: "items",    type: "TabItem[]",               desc: "{ key, label, count?, icon? } 배열" },
              { name: "value",    type: "string",                  desc: "선택된 탭 key" },
              { name: "onChange", type: "(key: string) => void",   desc: "탭 변경 콜백" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle overflow-hidden">
            <Tabs items={TAB_ITEMS} value={tabValue} onChange={setTabValue} />
            <div className="p-6 text-body text-text-muted">
              선택된 탭: <span className="font-semibold text-text">{tabValue}</span>
            </div>
          </div>
        </section>

        {/* ── Stepper ────────────────────────────── */}
        <section id="stepper" className="mb-14">
          <SectionHeader
            title="Stepper"
            path="src/components/common/Stepper/Stepper.tsx"
            description="단계 진행 표시기."
            props={[
              { name: "steps",   type: "StepperStep[]", desc: "{ label } 배열" },
              { name: "current", type: "number",        desc: "현재 단계 인덱스 (0부터 시작)" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 space-y-4">
            <Stepper steps={STEPPER_STEPS} current={stepperCurrent} />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={stepperCurrent === 0} onClick={() => setStepperCurrent((p) => p - 1)}>이전</Button>
              <Button size="sm" disabled={stepperCurrent === STEPPER_STEPS.length - 1} onClick={() => setStepperCurrent((p) => p + 1)}>다음</Button>
            </div>
          </div>
        </section>

        {/* ── Modal ──────────────────────────────── */}
        <section id="modal" className="mb-14">
          <SectionHeader
            title="Modal"
            path="src/components/common/Modal/Modal.tsx"
            description="center · bottom 두 가지 배치. title · footer 슬롯."
            props={[
              { name: "open",       type: "boolean",    desc: "열림 상태" },
              { name: "onClose",    type: "() => void", desc: "닫기 콜백 (배경 클릭 포함)" },
              { name: "title?",     type: "string",     desc: "모달 제목" },
              { name: "footer?",    type: "ReactNode",  desc: "하단 버튼 영역" },
              { name: "placement?", type: '"center" | "bottom"', desc: "배치 위치 (기본: center)" },
            ]}
          />
          <Preview label="열기">
            <Button onClick={() => setCommonModalOpen(true)}>Modal 열기</Button>
          </Preview>
          <Modal
            open={commonModalOpen}
            onClose={() => setCommonModalOpen(false)}
            title="여행 기록 삭제"
            footer={
              <>
                <Button variant="secondary" fullWidth onClick={() => setCommonModalOpen(false)}>취소</Button>
                <Button fullWidth onClick={() => setCommonModalOpen(false)}>삭제</Button>
              </>
            }
          >
            <p className="text-body text-text-muted">이 여행 기록을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
          </Modal>
        </section>

        {/* ── Toast ──────────────────────────────── */}
        <section id="toast" className="mb-14">
          <SectionHeader
            title="Toast"
            path="src/components/common/Toast/Toast.tsx"
            description="인라인 토스트 메시지. variant 3가지."
            props={[
              { name: "variant?", type: '"default" | "success" | "error"', desc: "토스트 종류 (기본: default)" },
              { name: "icon?",    type: "ReactNode",                       desc: "왼쪽 아이콘" },
            ]}
          />
          <div className="flex flex-col items-start gap-3">
            <Toast variant="default">저장되었습니다</Toast>
            <Toast variant="success">게시글이 업로드되었습니다 🎉</Toast>
            <Toast variant="error">업로드에 실패했습니다. 다시 시도해주세요.</Toast>
          </div>
        </section>

        {/* ── EmptyState ─────────────────────────── */}
        <section id="emptystate" className="mb-14">
          <SectionHeader
            title="EmptyState"
            path="src/components/common/feedback/EmptyState.tsx"
            description="데이터 없음 상태 표시."
            props={[
              { name: "title",        type: "string",    desc: "메인 메시지 (필수)" },
              { name: "icon?",        type: "ReactNode", desc: "상단 아이콘" },
              { name: "description?", type: "string",    desc: "보조 설명" },
              { name: "action?",      type: "ReactNode", desc: "하단 액션 버튼" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle">
            <EmptyState
              icon={<Search size={40} />}
              title="검색 결과가 없습니다"
              description="다른 키워드로 검색해보세요"
              action={<Button variant="secondary" size="sm">전체 보기</Button>}
            />
          </div>
        </section>

        {/* ── LoadingState ───────────────────────── */}
        <section id="loading" className="mb-14">
          <SectionHeader
            title="LoadingState / Skeleton"
            path="src/components/common/feedback/LoadingState.tsx"
            description="리스트 스켈레톤 로딩 UI."
            props={[
              { name: "rows?",   type: "number",                      desc: "스켈레톤 행 수 (기본: 3)" },
              { name: "width?",  type: "number | string",             desc: "Skeleton 너비 (기본: 100%)" },
              { name: "height?", type: "number | string",             desc: "Skeleton 높이 (기본: 16)" },
              { name: "radius?", type: '"control" | "card" | "full"', desc: "모서리 (기본: control)" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle p-6">
            <LoadingState rows={3} />
          </div>
        </section>

        {/* ── Spinner ────────────────────────────── */}
        <section id="spinner" className="mb-14">
          <SectionHeader
            title="Spinner"
            path="src/components/ui/spinner.tsx"
            description="로딩 인디케이터. Spinner(인라인)와 SpinnerOverlay(영역 중앙 배치) 두 가지."
            props={[
              { name: "size?",      type: '"sm" | "md" | "lg"', desc: "크기 (기본: md)" },
              { name: "className?", type: "string",             desc: "추가 클래스" },
            ]}
          />
          <div className="space-y-4">
            <Preview label="size">
              {(["sm", "md", "lg"] as const).map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <Spinner size={size} />
                  <span className="text-caption text-text-disabled font-mono">{size}</span>
                </div>
              ))}
            </Preview>
            <div className="bg-bg-card rounded-2xl border border-border-subtle overflow-hidden h-40">
              <SpinnerOverlay />
            </div>
          </div>
        </section>

        {/* ── SideNav ────────────────────────────── */}
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

        {/* ── KakaoMap ───────────────────────────── */}
        <section id="kakaomap" className="mb-14">
          <SectionHeader
            title="KakaoMap"
            path="src/components/KakaoMap.tsx"
            description="카카오맵 SDK 기반 지도. SSR 비활성화 필수 (dynamic import)."
            props={[
              { name: "selectedPost",   type: "Post | null",              desc: "선택된 게시물 (핀 하이라이트)" },
              { name: "onBoundsChange?",type: "(bounds) => void",         desc: "지도 영역 변경 콜백" },
              { name: "onPinClick?",    type: "(post, pinIndex) => void", desc: "핀 클릭 콜백" },
            ]}
          />
          <div className="rounded-2xl overflow-hidden border border-border-subtle h-[400px]">
            <KakaoMap selectedPost={null} />
          </div>
        </section>

        {/* ── PostModal ──────────────────────────── */}
        <section id="postmodal" className="mb-14">
          <SectionHeader
            title="PostModal"
            path="src/components/PostModal.tsx"
            description="게시글 상세 모달. postId로 내부 fetch (GET /v1/posts/:postId)."
            props={[
              { name: "postId",       type: "string",    desc: "조회할 게시물 ID" },
              { name: "onClose",      type: "() => void",desc: "모달 닫기 콜백" },
              { name: "onGoToMain?",  type: "() => void",desc: "홈 이동 콜백" },
              { name: "showGoToMain?",type: "boolean",   desc: "홈 이동 버튼 노출 여부" },
            ]}
          />
          <div className="bg-bg-card rounded-2xl border border-border-subtle p-6 flex items-center gap-4">
            <Button onClick={() => setPostModalOpen(true)}>PostModal 열기</Button>
            <span className="text-caption text-text-disabled">postId: &quot;showcase-post&quot; (MSW mock)</span>
          </div>
        </section>

      </div>

      {postModalOpen && (
        <PostModal postId="showcase-post" onClose={() => setPostModalOpen(false)} />
      )}
    </div>
  );
}

/* ── 유틸 컴포넌트 ──────────────────────────────── */

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
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle">prop</th>
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle">type</th>
                <th className="text-left px-3 py-2 font-semibold text-text-muted border border-border-subtle">설명</th>
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

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card rounded-2xl border border-border-subtle p-6">
      <p className="text-caption text-text-disabled font-mono mb-4">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
