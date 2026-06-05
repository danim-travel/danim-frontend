"use client";

import { useRef, useState, useEffect, useCallback, memo } from "react";
import Script from "next/script";
import type { Post } from "@/types";
import { config } from "@/lib/config";
import { getCssVar } from "@/lib/cssVar";

type Status = "loading" | "ready" | "error";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 } as const;
const MIN_ZOOM = 1;
const MAX_ZOOM = 14;

export type BoundsData = {
  swLat: number; swLng: number;
  neLat: number; neLng: number;
};

export interface MapControls {
  zoomIn: () => void;
  zoomOut: () => void;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const makeNumberPin = (num: number, color: string, onClick?: () => void): HTMLElement => {
  const safeColor = HEX_COLOR_RE.test(color) ? color : getCssVar("--color-primary");

  const el = document.createElement("div");
  el.className = "flex flex-col items-center";
  el.style.setProperty("--pin-color", safeColor);
  if (onClick) el.style.cursor = "pointer";

  const circle = document.createElement("div");
  circle.className = "map-pin-circle";
  circle.textContent = String(num);

  const tail = document.createElement("div");
  tail.className = "map-pin-tail";

  el.appendChild(circle);
  el.appendChild(tail);

  if (onClick) {
    el.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  }
  return el;
};

interface KakaoMapProps {
  selectedPost: Post | null;
  onBoundsChange?: (bounds: BoundsData) => void;
  onPinClick?: (post: Post, pinIndex: number) => void;
  /** 지도 준비 완료 시 zoom 제어 객체를 전달한다. raw kakao.maps.Map은 외부로 노출하지 않는다. */
  onMapReady?: (controls: MapControls) => void;
  /** 사용자가 현재위치 버튼을 누르고 위치 이동이 완료됐을 때 호출된다. */
  onCurrentLocation?: () => void;
}

function KakaoMap({ selectedPost, onBoundsChange, onPinClick, onMapReady, onCurrentLocation }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const polylineRef = useRef<kakao.maps.Polyline | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [locError, setLocError] = useState("");

  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPinClickRef = useRef(onPinClick);
  const onMapReadyRef = useRef(onMapReady);
  const onCurrentLocationRef = useRef(onCurrentLocation);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPinClickRef.current = onPinClick;
    onMapReadyRef.current = onMapReady;
    onCurrentLocationRef.current = onCurrentLocation;
  }, [onBoundsChange, onPinClick, onMapReady, onCurrentLocation]);

  const mapInitializedRef = useRef(false);

  const clearGroup = useCallback(() => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
  }, []);

  const applyPost = useCallback((post: Post) => {
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

    polylineRef.current = new kakao.maps.Polyline({
      path, map,
      strokeWeight: 3,
      strokeColor: post.color,
      strokeOpacity: 0.85,
      strokeStyle: "solid",
    });

    map.setBounds(bounds, 80, 80, 80, 80);
  }, [clearGroup]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedPost) {
      applyPost(selectedPost);
    } else {
      clearGroup();
    }
  }, [selectedPost, applyPost, clearGroup]);

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
        map.setCenter(new kakao.maps.LatLng(coords.latitude, coords.longitude));
        map.setLevel(3);
        onCurrentLocationRef.current?.();
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

      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        level: 3,
      });
      mapRef.current = map;
      setStatus("ready");

      onMapReadyRef.current?.({
        zoomIn: () => map.setLevel(Math.max(MIN_ZOOM, map.getLevel() - 1)),
        zoomOut: () => map.setLevel(Math.min(MAX_ZOOM, map.getLevel() + 1)),
      });

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
    });
  };

  // SDK가 이미 로드된 상태에서 재마운트될 때 onReady가 재호출되지 않을 수 있으므로 직접 체크
  useEffect(() => {
    if (typeof kakao !== "undefined" && kakao.maps) {
      initMap();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount 시 1회만 — initMap은 mapInitializedRef로 중복 호출을 방지한다

  return (
    <div className="relative w-full h-full bg-bg">
      <Script
        id="kakao-map-sdk"
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${config.kakaoMapKey}&autoload=false&libraries=services`}
        strategy="afterInteractive"
        onReady={initMap}
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
          className="absolute bottom-8 right-3 z-10 flex items-center gap-1.5 rounded-full bg-bg-card px-4 py-2 text-base font-medium shadow-md hover:bg-bg-subtle active:scale-95 transition-transform"
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
