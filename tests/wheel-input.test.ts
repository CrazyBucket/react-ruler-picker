import { expect, it } from "vitest";
import { createWheelInput } from "../src/internal/wheel-input";

it.each([30, 60, 120, 240, 1000])(
  "bounds high-frequency input at %i Hz",
  (hz) => {
    const input = createWheelInput();
    let distance = 0;
    for (let time = 0; time < 1000; time += 1000 / hz)
      distance += input.take(1000, time, 8, 3);
    expect(distance).toBeLessThanOrEqual(16 + 1000 * 8 * 0.08);
  },
);
it("preserves precision input through acceleration, decay and small reversals", () => {
  const input = createWheelInput();
  [8, 6, 4, 2, 1, 0.2, -0.1, -0.3, 2, 4, 6, 1, 0.5].forEach(
    (delta, i) => {
      expect(input.take(delta, i * 16, 8, 3)).toBeCloseTo(delta);
    },
  );
});
it("continues accepting intentional long input without a per-gesture cutoff", () => {
  const input = createWheelInput();
  let distance = 0;
  for (let time = 0; time < 10000; time += 16)
    distance += input.take(2, time, 8, 3);
  expect(distance).toBeCloseTo(1250);
  expect(input.take(0.25, 10000, 8, 3)).toBe(0.25);
});
it("honors a low speed cap including zero", () => {
  const input = createWheelInput();
  expect(input.take(100, 0, 8, 0.05)).toBeCloseTo((0.05 * 1000) / 60);
  expect(input.take(100, 10, 8, 0.05)).toBeCloseTo(0.5);
  expect(input.take(100, 20, 8, 0)).toBe(0);
});
it("shares credit across simultaneous events, including direction changes", () => {
  const input = createWheelInput();
  let distance = 0;
  for (let i = 0; i < 100; i++)
    distance += Math.abs(input.take(i % 2 ? -100 : 100, 0, 8, 3));
  expect(distance).toBe(16);
  // Excess is dropped, so subsequent precision input has no backlog.
  expect(input.take(-0.25, 16, 8, 3)).toBe(-0.25);
});
it.each([0.1, 1, 1.8, 10])(
  "scales small input by sensitivity %s",
  (gain) => {
    const input = createWheelInput();
    [0.1, 0.5, -0.25, 0.2].forEach((delta, i) => {
      expect(input.take(delta, i * 16, 8, 3, gain)).toBeCloseTo(
        delta * gain,
      );
    });
  },
);
it("resets input credit after idle or explicit interruption", () => {
  const input = createWheelInput();
  expect(input.take(100, 0, 8, 3)).toBe(16);
  expect(input.take(100, 0, 8, 3)).toBe(0);
  expect(input.take(100, 80, 8, 3)).toBe(16);
  input.reset();
  expect(input.take(-100, 80, 8, 3)).toBe(-16);
});
