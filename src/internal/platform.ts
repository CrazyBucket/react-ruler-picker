import type { RulerPlatform } from "../types";

export type ResolvedPlatform = "ios" | "android" | "harmony";

export const resolvePlatform = (
  platform: RulerPlatform,
): ResolvedPlatform | null => {
  if (platform === "auto") {
    if (typeof navigator === "undefined") {
      return null;
    }
    const ua = navigator.userAgent;
    if (/HarmonyOS|OpenHarmony/i.test(ua)) {
      return "harmony";
    }
    if (/Android/i.test(ua)) {
      return "android";
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return "ios";
    }
    return null;
  }
  return platform;
};

export const needsSnapPatch = (platform: ResolvedPlatform | null): boolean =>
  platform === "android" || platform === "harmony";

/** Keep mobile gesture streams in the native scroller, including mouse/wheel-shaped input. */
export const prefersNativeScroll = (): boolean =>
  (typeof window !== "undefined" &&
    !!window.matchMedia?.("(pointer: coarse)").matches) ||
  resolvePlatform("auto") === "harmony";
