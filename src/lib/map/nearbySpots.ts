import type { NearPostSpot } from "@/types";

/**
 * 좌표 정규화 자릿수. 백엔드가 같은 지점을 `"127.0"` / `"127.00"`처럼 다르게 내려줘도
 * 한 그룹으로 묶이도록 문자열 원문 대신 숫자로 환산해 비교한다.
 * 소수점 6자리 ≈ 0.1m — 표기 흔들림만 흡수하고 실제로 다른 지점은 가르지 않는다.
 */
const COORD_DIGITS = 6;

/** 좌표가 같은 기록을 묶는 키. 지도 핀과 캐러셀 칩이 같은 규칙으로 선택을 맞춘다. */
export function nearbyGroupKey(spot: Pick<NearPostSpot, "x" | "y">): string {
  return `${Number(spot.x).toFixed(COORD_DIGITS)},${Number(spot.y).toFixed(COORD_DIGITS)}`;
}

export interface NearbyGroup {
  key: string;
  x: string;
  y: string;
  place_name: string;
  distance: number;
  posts: NearPostSpot[];
}

/**
 * 좌표가 같은 기록은 핀 하나로 묶는다. 겹쳐 찍히면 어느 걸 눌렀는지 고를 수가 없다.
 *
 * 입력 배열은 변형하지 않고 새 배열을 반환한다. 입력 순서는 보존된다.
 */
export function groupNearbySpots(spots: NearPostSpot[]): NearbyGroup[] {
  const grouped = new Map<string, NearbyGroup>();

  spots.forEach((spot) => {
    const key = nearbyGroupKey(spot);
    const found = grouped.get(key);

    if (!found) {
      grouped.set(key, {
        key,
        x: spot.x,
        y: spot.y,
        place_name: spot.place_name,
        distance: spot.distance,
        posts: [spot],
      });
      return;
    }

    found.posts.push(spot);
    // 같은 좌표라도 표기명이 다를 수 있다. 가장 가까운 쪽 표기를 대표로 남긴다.
    if (spot.distance < found.distance) {
      found.place_name = spot.place_name;
      found.distance = spot.distance;
    }
  });

  return [...grouped.values()];
}

/** 1km 미만은 m로 끊어야 "0.8km"보다 읽힌다. 지도 카드와 캐러셀 칩이 같은 규칙을 쓴다. */
export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
