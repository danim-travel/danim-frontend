"use client";

import { useRef, useState, useEffect, memo } from "react";
import Script from "next/script";
import type { Post } from "@/types";
import { config } from "@/lib/config";
import { GEO_OPTIONS, GEO_OPTIONS_FRESH, geoErrorMessage } from "@/lib/map/geolocation";
import { createMyLocationDot } from "@/lib/map/myLocationOverlay";
import {
  createNearbyPinRoot,
  updateNearbyPinContent,
} from "@/lib/map/nearbyPinOverlay";
import type { NearbyGroup } from "@/lib/map/nearbySpots";
import { MAP_Z } from "@/lib/map/overlayZIndex";

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
    <div style="width:34px;height:34px;border-radius:50%;background:${color};color:var(--color-text-inverse);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--text-card-title);font-family:sans-serif;border:2.5px solid var(--color-bg-card);box-shadow:var(--shadow-map-card);">${num}</div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid ${color};margin-top:-1px;"></div>
  `;
  if (onClick) {
    el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  }
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
  /**
   * 내 주변 장소 핀. 좌표가 같은 기록은 호출부가 미리 하나로 묶어서 넘긴다.
   * 게시글이 포커스된 동안에는 빈 배열이 온다.
   */
  nearbyGroups?: NearbyGroup[];
  /** 선택된 그룹의 키(좌표). post_id가 아니라 그룹 단위다. */
  selectedNearbyKey?: string | null;
  /** 핀을 눌렀을 때 — "선택"만 한다. 여는 건 카드의 썸네일이 담당한다. */
  onNearbyGroupSelect?: (groupKey: string) => void;
  /** 선택된 핀의 카드에서 썸네일을 눌렀을 때 — 해당 게시글을 연다. */
  onNearbyPostOpen?: (postId: string) => void;
  /** 핀이 아닌 지도 빈 곳 클릭 — 주변 장소 선택 해제용. */
  onEmptyMapClick?: () => void;
}

function KakaoMap({
  selectedPost,
  onBoundsChange,
  onPinClick,
  onCurrentLocation,
  onLocationResolved,
  nearbyGroups,
  selectedNearbyKey,
  onNearbyGroupSelect,
  onNearbyPostOpen,
  onEmptyMapClick,
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
  const onNearbyGroupSelectRef = useRef(onNearbyGroupSelect);
  const onNearbyPostOpenRef = useRef(onNearbyPostOpen);
  const onEmptyMapClickRef = useRef(onEmptyMapClick);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPinClickRef.current = onPinClick;
    selectedPostRef.current = selectedPost;
    onLocationResolvedRef.current = onLocationResolved;
    onNearbyGroupSelectRef.current = onNearbyGroupSelect;
    onNearbyPostOpenRef.current = onNearbyPostOpen;
    onEmptyMapClickRef.current = onEmptyMapClick;
  }, [onBoundsChange, onPinClick, selectedPost, onLocationResolved, onNearbyGroupSelect, onNearbyPostOpen, onEmptyMapClick]);

  // 언마운트 뒤 도착한 geolocation 콜백이 죽은 지도에 오버레이를 만들지 않도록 막는다.
  const mountedRef = useRef(true);
  useEffect(() => {
    // StrictMode는 마운트 → 언마운트 → 재마운트로 이펙트를 두 번 돌린다.
    // 여기서 true로 되돌리지 않으면 첫 cleanup의 false가 그대로 굳어,
    // 뒤늦게 도착한 geolocation 콜백이 전부 무시된다(= 주변 장소 조회가 아예 안 나감).
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // initMap 중복 호출 방지
  const mapInitializedRef = useRef(false);

  // 활성 게시글의 path를 ref로 보관 — 컨테이너 리사이즈 시 setBounds 재호출용
  const activeBoundsRef = useRef<kakao.maps.LatLngBounds | null>(null);

  const clearGroup = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    // 여기서 안 비우면 이후 리사이즈가 사라진 게시글의 bounds로 setBounds를 다시 걸어
    // 내 위치와 주변 핀이 화면 밖으로 밀린다.
    activeBoundsRef.current = null;
  };

  // 주변 장소 핀은 게시글 핀과 생명주기가 완전히 다르다.
  // clearGroup()이 핀까지 지우면 게시글을 열고 닫을 때마다 핀이 사라진다.
  const nearbyOverlaysRef = useRef<Map<string, kakao.maps.CustomOverlay>>(new Map());
  // 마크업만 교체할 수 있도록 루트 엘리먼트를 따로 들고 있는다.
  const nearbyRootsRef = useRef<Map<string, HTMLElement>>(new Map());
  // 직전에 그린 선택 키 — 실제로 바뀐 핀만 다시 그리기 위한 기준.
  const paintedNearbyKeyRef = useRef<string | null>(null);
  // 직전에 지도를 옮겨간 선택 키. 핀이 다시 만들어졌다고 지도까지 되돌리면 안 되므로
  // 그리기 기준과 분리한다.
  const pannedNearbyKeyRef = useRef<string | null>(null);
  // 내 위치 점은 하나뿐이라 재생성하지 않고 좌표만 옮긴다.
  //
  // ⚠ 여기에 언마운트 cleanup을 붙이지 말 것. 이 오버레이는 이펙트가 아니라 geolocation
  // 콜백이 만든다 — 소유자가 이펙트 생명주기 밖이라, cleanup을 달면 StrictMode의 가짜
  // 언마운트에서 지워지고 아무도 다시 만들지 않는다(초기 요청은 mapInitializedRef에 막힘).
  // 정리하고 싶다면 좌표를 state로 올려 오버레이를 이펙트 소유로 바꾸는 게 정공법이다.
  const myLocationRef = useRef<kakao.maps.CustomOverlay | null>(null);

  const clearNearby = () => {
    nearbyOverlaysRef.current.forEach((o) => o.setMap(null));
    nearbyOverlaysRef.current.clear();
    nearbyRootsRef.current.clear();
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
          zIndex: MAP_Z.postPin,
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

  // 핀 생성 — 선택 상태는 아래 이펙트가 입힌다.
  // 여기서 함께 처리하면 선택이 바뀔 때마다 오버레이를 통째로 다시 만들게 된다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    clearNearby();
    nearbyGroups?.forEach((group) => {
      const root = createNearbyPinRoot(
        () => onNearbyGroupSelectRef.current?.(group.key),
        (postId) => onNearbyPostOpenRef.current?.(postId),
      );
      updateNearbyPinContent(root, group, false);

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(Number(group.y), Number(group.x)),
        content: root,
        map,
        // 루트 박스 아래 중앙 = 핀 끝점. 카드는 박스 밖으로 넘치므로 크기에 영향 없다.
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: MAP_Z.nearbyPin,
        // 없으면 카드 위 mousedown이 지도 드래그로 잡혀 클릭이 통째로 유실된다.
        clickable: true,
      });
      nearbyOverlaysRef.current.set(group.key, overlay);
      nearbyRootsRef.current.set(group.key, root);
    });
    paintedNearbyKeyRef.current = null;
    // 목록에서 사라진 키는 pan 기록에서도 지운다. 나중에 다시 나타나면 그때는 옮겨가야 한다.
    const panned = pannedNearbyKeyRef.current;
    if (panned && !nearbyGroups?.some((group) => group.key === panned)) {
      pannedNearbyKeyRef.current = null;
    }

    // clearNearby는 ref만 건드리는 안정 동작이라 의존성에 넣지 않는다.
    // 넣으면 렌더마다 재생성돼 핀 전체가 계속 다시 만들어진다.
    return clearNearby;
  }, [nearbyGroups, status]);

  // 선택 상태 반영 — setContent를 쓰지 않고 루트의 innerHTML만 갱신한다(리스너 유지).
  // 전부 다시 그리면 목록이 리팩치될 때마다 카드의 <img>가 새 노드로 교체돼 깜빡인다.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    const next = selectedNearbyKey ?? null;

    const repaint = (key: string | null, selected: boolean) => {
      if (!key) return;
      const overlay = nearbyOverlaysRef.current.get(key);
      const root = nearbyRootsRef.current.get(key);
      const group = nearbyGroups?.find((g) => g.key === key);
      if (!overlay || !root || !group) return;
      updateNearbyPinContent(root, group, selected);
      overlay.setZIndex(selected ? MAP_Z.nearbyPinSelected : MAP_Z.nearbyPin);
    };

    if (paintedNearbyKeyRef.current !== next) {
      repaint(paintedNearbyKeyRef.current, false);
      repaint(next, true);
      paintedNearbyKeyRef.current = next;
    }

    // 선택된 곳으로 이동. setBounds가 아니라 panTo — 줌 레벨을 유지해야 한다.
    // 선택이 "실제로 바뀐" 경우에만 옮긴다. 목록이 갱신돼 핀을 다시 만들었다고 해서
    // 사용자가 옮겨 둔 지도를 되돌리면 안 된다.
    if (!next) {
      pannedNearbyKeyRef.current = null;
    } else if (pannedNearbyKeyRef.current !== next) {
      const selected = nearbyGroups?.find((g) => g.key === next);
      // 그룹이 아직 목록에 없으면 기록하지 않는다. 여기서 갱신해 버리면 나중에 그룹이
      // 도착해도 "이미 옮겼다"고 판단해 영영 이동하지 않는다.
      if (selected) {
        map.panTo(new kakao.maps.LatLng(Number(selected.y), Number(selected.x)));
        pannedNearbyKeyRef.current = next;
      }
    }
  }, [nearbyGroups, selectedNearbyKey, status]);

  // 초기 마운트 실패도 알리게 되면서 토스트가 사용자 조작 없이 뜬다.
  // 계속 남아 지도를 가리지 않도록 스스로 걷힌다.
  useEffect(() => {
    if (!locError) return;
    const id = setTimeout(() => setLocError(""), 5000);
    return () => clearTimeout(id);
  }, [locError]);

  /** 내 위치 점을 찍거나 옮긴다. 지도가 준비되기 전이면 조용히 넘긴다. */
  const showMyLocation = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const position = new kakao.maps.LatLng(lat, lng);
    const existing = myLocationRef.current;
    if (existing) {
      existing.setPosition(position);
      return;
    }
    myLocationRef.current = new kakao.maps.CustomOverlay({
      position,
      content: createMyLocationDot(),
      map,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: MAP_Z.myLocation,
    });
  };

  const goToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("위치 서비스를 지원하지 않는 브라우저입니다.");
      return;
    }
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const map = mapRef.current;
        if (!map || !mountedRef.current) return;
        clearGroup();
        map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
        map.setLevel(3);
        showMyLocation(coords.latitude, coords.longitude);
        onLocationResolved?.({ lat: coords.latitude, lng: coords.longitude });
        onCurrentLocation?.();
      },
      (error) => { if (mountedRef.current) setLocError(geoErrorMessage(error)); },
      GEO_OPTIONS_FRESH,
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
        onEmptyMapClickRef.current?.();
      });

      // 기본: 현재 위치로 이동
      // geolocation은 비동기 — 콜백 시점에 selectedPost가 생겼으면 덮어쓰지 않음
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (!mountedRef.current) return;
            // 지도 이동은 건너뛰더라도 좌표 자체는 항상 올린다.
            // 주변 장소 조회가 이 좌표에 의존하고, 여기서 안 올리면
            // 사용자가 "현재위치" 버튼을 누를 때까지 핀이 뜨지 않는다.
            onLocationResolvedRef.current?.({ lat: coords.latitude, lng: coords.longitude });
            showMyLocation(coords.latitude, coords.longitude);
            if (selectedPostRef.current) return;
            map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
          },
          // 조용히 삼키면 지도가 기본 좌표(시청)에 머무는데도 사용자는 그게
          // 자기 위치인 줄 안다. 주변 장소가 왜 비었는지도 알 수 없다.
          (error) => { if (mountedRef.current) setLocError(geoErrorMessage(error)); },
          GEO_OPTIONS,
        );
      }
    });
  };

  useEffect(() => {
    if (typeof kakao !== "undefined" && kakao.maps) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      initMap();
    }
    // 지도 초기화는 마운트당 한 번뿐이다(initMap 자체가 mapInitializedRef로 재진입을 막는다).
    // initMap을 의존성에 넣으면 렌더마다 재생성돼 이펙트가 계속 돈다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        map.relayout();
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
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-bg-card px-4 py-2 text-base font-medium shadow-md hover:bg-bg-subtle active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-my-location" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          현재위치
        </button>
      )}

      {locError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-error px-4 py-2 text-base text-text-inverse shadow-lg whitespace-nowrap">
          {locError}
        </div>
      )}
    </div>
  );
}

export default memo(KakaoMap);
