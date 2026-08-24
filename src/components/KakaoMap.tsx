"use client";

import { useRef, useState, useEffect, memo } from "react";
import Script from "next/script";
import type { NearPostSpot, Post } from "@/types";
import { config } from "@/lib/config";

type Status = "loading" | "ready" | "error";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 } as const;

export type BoundsData = {
  swLat: number; swLng: number;
  neLat: number; neLng: number;
};

const makeNumberPin = (num: number, color: string, onClick?: () => void): HTMLElement => {
  const el = document.createElement("div");
  el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:${onClick ? "pointer" : "default"};`;
  el.innerHTML = `
    <div style="width:34px;height:34px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;font-family:sans-serif;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);">${num}</div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};margin-top:-1px;"></div>
  `;
  if (onClick) {
    el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  }
  return el;
};

// 게시글 핀(zIndex 3)보다 항상 아래. 선택된 도트만 그 사이로 올린다.
const NEARBY_Z = 1;
const NEARBY_SELECTED_Z = 2;

/** 거리 라벨. 1km 미만은 m로 끊어야 "0.8km"보다 읽힌다. */
const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

/**
 * 주변 기록 도트. 게시글 번호 핀(34px)보다 확실히 작아야 위계가 잡힌다.
 * CustomOverlay가 DOM을 요구해 인라인 style이 불가피하다 — 색은 하드코딩하지 않고
 * 전역 CSS 변수를 참조한다.
 */
const makeDotPin = (spot: NearPostSpot, selected: boolean, onClick: () => void): HTMLElement => {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;";

  const size = selected ? 18 : 12;
  const label = selected
    ? `<div style="padding:2px 8px;border-radius:9999px;background:var(--color-bg-card);color:var(--color-text);font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${spot.place_name} · ${formatDistance(spot.distance)}</div>`
    : "";

  el.innerHTML = `
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--color-primary);border:2px solid var(--color-bg-card);box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
    ${label}
  `;
  el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return el;
};

interface KakaoMapProps {
  selectedPost: Post | null;
  onBoundsChange?: (bounds: BoundsData) => void;
  onPinClick?: (post: Post, pinIndex: number) => void;
  onCurrentLocation?: () => void;
  /**
   * 지도가 알아낸 현재 위치. 초기 마운트와 "현재위치" 버튼 양쪽에서 호출된다.
   * `onCurrentLocation`(포커스 해제용)과 의미가 다르므로 분리한다 —
   * 초기 마운트에서 포커스를 해제하면 안 되기 때문.
   */
  onLocationResolved?: (coords: { lat: number; lng: number }) => void;
  /** 내 주변 기록 도트. 게시글이 포커스된 동안에는 호출부가 빈 배열을 넘긴다. */
  nearbySpots?: NearPostSpot[];
  selectedNearbyId?: string | null;
  onNearbySpotClick?: (postId: string) => void;
  /** 지도 빈 곳 클릭 — 주변 기록 선택 해제용. */
  onMapClick?: () => void;
  /** 하단 캐러셀이 떠 있는 동안 "현재위치" 버튼을 그 위로 올린다. */
  liftControls?: boolean;
}

function KakaoMap({
  selectedPost,
  onBoundsChange,
  onPinClick,
  onCurrentLocation,
  onLocationResolved,
  nearbySpots,
  selectedNearbyId,
  onNearbySpotClick,
  onMapClick,
  liftControls = false,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const polylinesRef = useRef<kakao.maps.Polyline[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [locError, setLocError] = useState("");

  // 렌더마다 최신값 유지 — 이벤트 핸들러 stale closure 방지
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPinClickRef = useRef(onPinClick);
  const selectedPostRef = useRef(selectedPost);
  const onLocationResolvedRef = useRef(onLocationResolved);
  const onNearbySpotClickRef = useRef(onNearbySpotClick);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPinClickRef.current = onPinClick;
    selectedPostRef.current = selectedPost;
    onLocationResolvedRef.current = onLocationResolved;
    onNearbySpotClickRef.current = onNearbySpotClick;
    onMapClickRef.current = onMapClick;
  }, [onBoundsChange, onPinClick, selectedPost, onLocationResolved, onNearbySpotClick, onMapClick]);

  // initMap 중복 호출 방지
  const mapInitializedRef = useRef(false);

  const clearGroup = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
  };

  // 활성 게시글의 path를 ref로 보관 — 컨테이너 리사이즈 시 setBounds 재호출용
  const activeBoundsRef = useRef<kakao.maps.LatLngBounds | null>(null);

  // 주변 기록 도트는 게시글 핀과 생명주기가 완전히 다르다.
  // clearGroup()이 도트까지 지우면 게시글을 열고 닫을 때마다 도트가 사라진다.
  const nearbyOverlaysRef = useRef<Map<string, kakao.maps.CustomOverlay>>(new Map());

  const clearNearby = () => {
    nearbyOverlaysRef.current.forEach((o) => o.setMap(null));
    nearbyOverlaysRef.current.clear();
  };

  const applyPost = (post: Post) => {
    const map = mapRef.current;
    if (!map) return;

    clearGroup();

    const bounds = new kakao.maps.LatLngBounds();
    const path: kakao.maps.LatLng[] = [];

    post.pins.forEach(({ lat, lng }, i) => {
      const latlng = new kakao.maps.LatLng(lat, lng);
      path.push(latlng);
      bounds.extend(latlng);
      overlaysRef.current.push(
        new kakao.maps.CustomOverlay({
          position: latlng,
          content: makeNumberPin(i + 1, post.color, () => onPinClickRef.current?.(post, i)),
          map,
          yAnchor: 1,
          zIndex: 3,
        })
      );
    });

    for (let i = 0; i < path.length - 1; i++) {
      polylinesRef.current.push(
        new kakao.maps.Polyline({
          path: [path[i], path[i + 1]],
          map,
          strokeWeight: 3,
          strokeColor: post.color,
          strokeOpacity: 1,
          strokeStyle: "solid",
        })
      );
    }

    // 오버레이가 덮고 있는 동안 즉시 이동 — 줌 애니메이션 없음
    activeBoundsRef.current = bounds;
    map.setBounds(bounds, 80, 80, 80, 80);
  };

  useEffect(() => {
    // status를 의존성에 포함 — 초기 마운트 시 selectedPost가 이미 존재할 때(예: /?solo=...),
    // mapRef가 채워지기 전(이펙트 1차 실행)에는 적용을 못 하므로 ready 직후 재실행으로 보정
    if (!mapRef.current || status !== "ready") return;
    if (selectedPost) {
      applyPost(selectedPost);
    } else {
      clearGroup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPost, status]);

  // 도트 생성 — 선택 상태는 아래 이펙트가 입힌다.
  // 여기서 함께 처리하면 선택이 바뀔 때마다 오버레이를 통째로 다시 만들게 된다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    clearNearby();
    nearbySpots?.forEach((spot) => {
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(Number(spot.y), Number(spot.x)),
        content: makeDotPin(spot, false, () => onNearbySpotClickRef.current?.(spot.post_id)),
        map,
        yAnchor: 1,
        zIndex: NEARBY_Z,
      });
      nearbyOverlaysRef.current.set(spot.post_id, overlay);
    });

    return clearNearby;
  }, [nearbySpots, status]);

  // 선택 상태 반영 — 오버레이를 재생성하지 않고 내용·순서만 교체한다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || !nearbySpots) return;

    nearbySpots.forEach((spot) => {
      const overlay = nearbyOverlaysRef.current.get(spot.post_id);
      if (!overlay) return;
      const isSelected = spot.post_id === selectedNearbyId;
      overlay.setContent(
        makeDotPin(spot, isSelected, () => onNearbySpotClickRef.current?.(spot.post_id)),
      );
      overlay.setZIndex(isSelected ? NEARBY_SELECTED_Z : NEARBY_Z);
    });

    // 선택된 곳으로 이동. setBounds가 아니라 panTo — 줌 레벨을 유지해야 한다.
    const selected = nearbySpots.find((s) => s.post_id === selectedNearbyId);
    if (selected) {
      map.panTo(new kakao.maps.LatLng(Number(selected.y), Number(selected.x)));
    }
  }, [nearbySpots, selectedNearbyId, status]);

  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("위치 서비스를 지원하지 않는 브라우저입니다.");
      return;
    }
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = mapRef.current;
        if (!map) return;
        clearGroup();
        map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
        map.setLevel(3);
        onLocationResolved?.({ lat: coords.latitude, lng: coords.longitude });
        onCurrentLocation?.();
      },
      () => setLocError("위치 권한이 거부되었습니다.")
    );
  };

  const initMap = () => {
    if (mapInitializedRef.current) return;
    mapInitializedRef.current = true;

    if (typeof kakao === "undefined") {
      setStatus("error");
      return;
    }

    kakao.maps.load(() => {
      if (!containerRef.current) return;

      const defaultCenter = new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      const map = new kakao.maps.Map(containerRef.current, {
        center: defaultCenter,
        level: 3,
      });
      mapRef.current = map;
      setStatus("ready");

      kakao.maps.event.addListener(map, "idle", () => {
        if (!onBoundsChangeRef.current) return;
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        onBoundsChangeRef.current({
          swLat: sw.getLat(), swLng: sw.getLng(),
          neLat: ne.getLat(), neLng: ne.getLng(),
        });
      });

      kakao.maps.event.addListener(map, "click", () => {
        onMapClickRef.current?.();
      });

      // 기본: 현재 위치로 이동
      // geolocation은 비동기 — 콜백 시점에 selectedPost가 생겼으면 덮어쓰지 않음
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            // 지도 이동은 건너뛰더라도 좌표 자체는 항상 올린다.
            // 주변 기록 조회가 이 좌표에 의존하고, 여기서 안 올리면
            // 사용자가 "현재위치" 버튼을 누를 때까지 도트가 뜨지 않는다.
            onLocationResolvedRef.current?.({ lat: coords.latitude, lng: coords.longitude });
            if (selectedPostRef.current) return;
            map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
          },
          () => {}
        );
      }
    });
  };

  useEffect(() => {
    if (typeof kakao !== "undefined" && kakao.maps) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      initMap();
    }
  }, []);

  // 컨테이너 크기 변화 시 카카오맵 캔버스 재계산
  // (모바일 바텀시트 드래그로 높이가 바뀔 때 회색 영역이 남거나 중심이 어긋나는 문제 방지)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId = 0;
    const ro = new ResizeObserver(() => {
      const map = mapRef.current;
      if (!map) return;
      // 연속 리사이즈를 한 프레임으로 모음
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // 카카오맵 타입 정의에 relayout이 빠져있어 캐스팅 — 공식 SDK는 지원
        (map as kakao.maps.Map & { relayout: () => void }).relayout();
        // 활성 게시글이 있으면 컨테이너 크기에 맞춰 다시 fit (모바일 첫 마운트 시
        // 컨테이너 크기가 안정되기 전 호출된 setBounds로 마커가 화면 밖에 있는 문제 보정)
        if (activeBoundsRef.current) {
          map.setBounds(activeBoundsRef.current, 80, 80, 80, 80);
        } else {
          map.setCenter(map.getCenter());
        }
      });
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-bg">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.kakaoMapKey}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setStatus("error")}
      />

      <div ref={containerRef} className="w-full h-full bg-border" />

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-warning border-t-transparent animate-spin" />
          <p className="text-base text-text-muted">지도를 불러오는 중...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg gap-2">
          <p className="text-card-title font-semibold text-text-secondary">지도를 불러올 수 없습니다</p>
          <p className="text-base text-text-muted">
            카카오 개발자 콘솔 → 플랫폼 키 → JavaScript SDK 도메인에{" "}
            <code className="bg-border px-1 rounded">http://localhost:3000</code> 을 추가해주세요.
          </p>
        </div>
      )}

      {status === "ready" && (
        <button
          onClick={goToCurrentLocation}
          // 캐러셀(96px)이 떠 있으면 그 위로 올린다.
          // Tailwind JIT가 잡으려면 런타임 조합이 아닌 정적 클래스여야 한다.
          className={`absolute right-3 z-10 flex items-center gap-1.5 rounded-full bg-bg-card px-4 py-2 text-base font-medium shadow-md hover:bg-bg-subtle active:scale-95 transition-[transform,bottom] ${liftControls ? "bottom-32" : "bottom-8"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          현재위치
        </button>
      )}

      {locError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-error px-4 py-2 text-base text-text-inverse shadow-lg whitespace-nowrap">
          {locError}
        </div>
      )}
    </div>
  );
}

export default memo(KakaoMap);
