import { expect, it } from "vitest";
import { rubberBand, returnEdge } from "../src/internal/edge";
it("resists displacement symmetrically and saturates at 72 CSS pixels", () => {
  expect(rubberBand(0)).toBe(0);
  for (const input of [1, 10, 100, 1000]) {
    expect(rubberBand(input)).toBeGreaterThan(0);
    expect(rubberBand(input)).toBeLessThan(Math.min(input, 72));
    expect(rubberBand(-input)).toBe(-rubberBand(input));
  }
});
it("returns exactly to zero and gives collisions a continuous outward phase", () => {
  expect(returnEdge(80, 0, 0)).toBe(80);
  expect(returnEdge(80, 0, 1)).toBe(0);
  expect(returnEdge(80, 0, 0.5)).toBeLessThan(returnEdge(80, 0, 0.25));
  expect(returnEdge(0, 60, 0)).toBe(0);
  expect(returnEdge(0, 60, 0.25)).toBeCloseTo(60);
  expect(returnEdge(0, 60, 1)).toBe(0);
});
