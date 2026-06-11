import { getCssVar } from "@/lib/cssVar";

const PIN_COLOR_VARS = [
  "--color-pin-1",
  "--color-pin-2",
  "--color-pin-3",
  "--color-pin-4",
  "--color-pin-5",
];

export function usePinColor(postIndex: number): string {
  const cssVar = PIN_COLOR_VARS[postIndex % PIN_COLOR_VARS.length];
  return getCssVar(cssVar);
}
