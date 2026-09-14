import { afterEach, describe, expect, it, vi } from "vitest";
import { needsSnapPatch, resolvePlatform } from "../src/internal/platform";

afterEach(() => vi.unstubAllGlobals());

describe("platform auto detection", () => {
  it.each([
    ["Mozilla/5.0 (Phone; HarmonyOS 4.0; Android 12)", "harmony"],
    ["Mozilla/5.0 (Phone; OpenHarmony 5.0) AppleWebKit/537.36", "harmony"],
    ["Mozilla/5.0 (Linux; Android 14)", "android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "ios"],
    ["Mozilla/5.0 (X11; Linux x86_64)", null],
  ] as const)("resolves %s as %s", (userAgent, expected) => {
    vi.stubGlobal("navigator", { userAgent });
    const platform = resolvePlatform("auto");
    expect(platform).toBe(expected);
    expect(needsSnapPatch(platform)).toBe(expected === "android" || expected === "harmony");
  });
  it("honors explicit overrides", () => {
    vi.stubGlobal("navigator", { userAgent: "OpenHarmony" });
    for (const platform of ["ios", "android", "harmony"] as const) {
      expect(resolvePlatform(platform)).toBe(platform);
    }
  });
  it("does not require navigator during SSR", () => {
    vi.stubGlobal("navigator", undefined);
    expect(resolvePlatform("auto")).toBeNull();
  });
});
