"use client";

import { useRef, useState, useEffect, memo } from "react";
import Script from "next/script";
import type { Post } from "@/types";
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

interface KakaoMapProps {
  selectedPost: Post | null;
  onBoundsChange?: (bounds: BoundsData) => void;
  onPinClick?: (post: Post, pinIndex: number) => void;
}

function KakaoMap({ selectedPost, onBoundsChange, onPinClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const polylineRef = useRef<kakao.maps.Polyline | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [locError, setLocError] = useState("");

  // 렌더마다 최신값 유지 — 이벤트 핸들러 stale closure 방지
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onPinClickRef = useRef(onPinClick);
  const selectedPostRef = useRef(selectedPost);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
    onPinClickRef.current = onPinClick;
    selectedPostRef.current = selectedPost;
  });

  // initMap 중복 호출 방지
  const mapInitializedRef = useRef(false);

  const clearGroup = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
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

    polylineRef.current = new kakao.maps.Polyline({
      path, map,
      strokeWeight: 3,
      strokeColor: post.color,
      strokeOpacity: 0.85,
      strokeStyle: "solid",
    });

    map.setBounds(bounds, 80, 80, 80, 80);
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedPost) {
      applyPost(selectedPost);
    } else {
      clearGroup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPost]);

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

      // 기본: 현재 위치로 이동
      // geolocation은 비동기 — 콜백 시점에 selectedPost가 생겼으면 덮어쓰지 않음
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
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
          <p className="text-body text-text-muted">지도를 불러오는 중...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg gap-2">
          <p className="text-card-title font-semibold text-text-secondary">지도를 불러올 수 없습니다</p>
          <p className="text-body text-text-muted">
            카카오 개발자 콘솔 → 플랫폼 키 → JavaScript SDK 도메인에{" "}
            <code className="bg-border px-1 rounded">http://localhost:3000</code> 을 추가해주세요.
          </p>
        </div>
      )}

      {status === "ready" && (
        <button
          onClick={goToCurrentLocation}
          className="absolute bottom-8 right-3 z-10 flex items-center gap-1.5 rounded-full bg-bg-card px-4 py-2 text-body font-medium shadow-md hover:bg-bg-subtle active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          현재위치
        </button>
      )}

      {locError && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 rounded-lg bg-error px-4 py-2 text-body text-text-inverse shadow-lg whitespace-nowrap">
          {locError}
        </div>
      )}
    </div>
  );
}

export default memo(KakaoMap);
