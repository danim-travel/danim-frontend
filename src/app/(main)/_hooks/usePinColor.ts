import { useEffect, useState } from "react";
import { getCssVar } from "@/lib/cssVar";

/** 마운트 후 CSS 토큰에서 지도 핀 색상을 읽어 반환한다. 토큰 로드 전에는 빈 문자열. */
export function usePinColor(cssVar = "--color-primary"): string {
  const [pinColor, setPinColor] = useState("");
  useEffect(() => {
    setPinColor(getCssVar(cssVar));
  }, [cssVar]);
  return pinColor;
}
