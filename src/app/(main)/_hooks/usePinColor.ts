import { useState } from "react";
import { getCssVar } from "@/lib/cssVar";

export function usePinColor(cssVar = "--color-primary"): string {
  const [pinColor] = useState(() => getCssVar(cssVar));
  return pinColor;
}
