/**
 * geolocation 기본값(`enableHighAccuracy: false`)은 GPS를 아예 쓰지 않고 IP·와이파이
 * 기반으로 답한다. 데스크탑에서는 통신사 기지국 좌표가 잡혀 도심에서 수 km까지 어긋난다.
 * 주변 장소 조회가 이 좌표에 통째로 의존하므로 정확도를 요구한다.
 *
 * `timeout`이 없으면(기본 Infinity) 실패해도 에러 콜백이 영영 안 와서
 * "위치를 못 잡았다"는 사실조차 알 수 없다.
 */
export const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

/** 사용자가 버튼을 눌렀다는 건 "지금" 위치를 원한다는 뜻 — 캐시된 좌표를 쓰면 안 된다. */
export const GEO_OPTIONS_FRESH: PositionOptions = { ...GEO_OPTIONS, maximumAge: 0 };

/** 실패 원인을 뭉뚱그리면 권한을 줬는데도 "권한 거부"라고 뜬다. */
export function geoErrorMessage(error: GeolocationPositionError): string {
  // HTTP(비보안 출처)에서는 브라우저가 권한을 묻지도 않고 PERMISSION_DENIED로 답한다.
  // 그대로 "권한 거부"라고 띄우면 기기 설정만 계속 뒤지게 된다.
  if (!window.isSecureContext) {
    return "HTTPS 또는 localhost에서만 위치를 사용할 수 있습니다.";
  }
  if (error.code === error.PERMISSION_DENIED) return "위치 권한이 거부되었습니다.";
  if (error.code === error.TIMEOUT) return "현재 위치를 확인하는 데 너무 오래 걸립니다.";
  return "현재 위치를 확인할 수 없습니다.";
}
