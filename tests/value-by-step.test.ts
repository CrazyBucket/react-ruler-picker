import { describe, expect, it } from "vitest";

import {
  clampValueByStep,
  formatValueByStep,
  getStepPrecision,
} from "../src/internal/value-by-step";

describe("getStepPrecision", () => {
  it("derives decimal precision from step", () => {
    expect(getStepPrecision(1)).toBe(0);
    expect(getStepPrecision(0.1)).toBe(1);
    expect(getStepPrecision(0.01)).toBe(2);
  });
});

describe("formatValueByStep", () => {
  it("keeps integers without trailing zeros", () => {
    expect(formatValueByStep(120, 1)).toBe("120");
  });

  it("pads decimals according to step precision", () => {
    expect(formatValueByStep(36, 0.1)).toBe("36.0");
    expect(formatValueByStep(36.56, 0.1)).toBe("36.6");
    expect(formatValueByStep(36.5, 0.01)).toBe("36.50");
  });
});

describe("clampValueByStep", () => {
  it("clamps to the range", () => {
    expect(clampValueByStep(300, 1, 34, 42)).toBe(42);
    expect(clampValueByStep(10, 1, 34, 42)).toBe(34);
  });

  it("snaps to the nearest step", () => {
    expect(clampValueByStep(36.66, 0.1, 34, 42)).toBe(36.7);
    expect(clampValueByStep(36.64, 0.1, 34, 42)).toBe(36.6);
  });

  it("falls back safely when step is invalid", () => {
    expect(clampValueByStep(36.66, 0, 34, 42)).toBe(36.66);
  });
});

describe("range and precision regressions", () => {
  it("supports exponent notation", () => {
    expect(getStepPrecision(1e-7)).toBe(7);
    expect(getStepPrecision(2.5e-7)).toBe(8);
    expect(formatValueByStep(3e-7, 1e-7)).toBe("0.0000003");
    expect(clampValueByStep(3.4e-7, 1e-7, 0, 1e-6)).toBe(3e-7);
  });
  it("preserves an offset min with finer precision than step", () => {
    expect(clampValueByStep(0.26, 0.1, 0.05, 1)).toBe(0.25);
    expect(clampValueByStep(2.1, 1, 0.5, 4)).toBe(2.5);
  });
  it("never creates a partial step at max", () => {
    expect(clampValueByStep(10, 3, 0, 10)).toBe(9);
    expect(clampValueByStep(1, 0.3, 0, 1)).toBe(0.9);
  });
  it("normalizes reversed bounds and NaN input", () => {
    expect(clampValueByStep(4.1, 1, 10, 0)).toBe(4);
    expect(clampValueByStep(NaN, 1, 2, 10)).toBe(2);
    expect(clampValueByStep(Infinity, 1, 2, 10)).toBe(10);
  });
  it("retains an exactly aligned floating-point upper bound", () => {
    expect(clampValueByStep(0.3, 0.1, 0, 0.3)).toBe(0.3);
    expect(clampValueByStep(-0.1, 0.1, -0.3, 0.3)).toBe(-0.1);
  });
});
