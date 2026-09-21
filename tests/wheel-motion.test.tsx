// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { TactileMotion } from "tactile-motion";
import { RulerPicker } from "../src";
import type { RulerPickerProps } from "../src";

const { engines } = vi.hoisted(() => ({
  engines: [] as TactileMotion[],
}));
vi.mock("tactile-motion", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("tactile-motion")>();
  return {
    ...original,
    createTactileMotion(
      options: Parameters<typeof original.createTactileMotion>[0],
    ) {
      const engine = original.createTactileMotion(options);
      for (const name of ["start", "drag", "release", "stop"] as const)
        vi.spyOn(engine, name);
      engines.push(engine);
      return engine;
    },
  };
});
let root: Root;
let host: HTMLDivElement;
const tick = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};
const wheel = async (pixels: number, momentum?: boolean) => {
  await act(async () => {
    const event = new WheelEvent("wheel", {
      deltaY: pixels,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "momentum", { value: momentum });
    host.querySelector('[role="slider"]')!.dispatchEvent(event);
  });
};
const render = async (props: Partial<RulerPickerProps> = {}) => {
  await act(async () =>
    root.render(
      <RulerPicker
        min={0}
        max={10000}
        defaultValue={500}
        wheelSensitivity={1}
        {...props}
      />,
    ),
  );
  return engines.at(-1)!;
};
beforeEach(() => {
  Object.defineProperty(WheelEvent.prototype, "momentum", {
    configurable: true,
    get: () => false,
  });
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "performance"],
  });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    null,
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  engines.length = 0;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  delete (WheelEvent.prototype as WheelEvent & { momentum?: boolean })
    .momentum;
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("starts once, injects deltas and settles after 80ms without extra inertia", async () => {
  const end = vi.fn();
  const engine = await render({ onValueChangeEnd: end });
  await wheel(8);
  await tick(20);
  await wheel(4);
  expect(engine.start).toHaveBeenCalledOnce();
  expect(
    vi.mocked(engine.drag).mock.calls.map(([delta]) => delta),
  ).toEqual([1, 0.5]);
  await tick(79);
  expect(end).not.toHaveBeenCalled();
  await tick(1);
  expect(engine.release).not.toHaveBeenCalled();
  expect(engine.getSnapshot().state).toBe("idle");
  expect(end).toHaveBeenCalledOnce();
  const settled = engine.getValue();
  await tick(2000);
  expect(engine.getValue()).toBe(settled);
  expect(end).toHaveBeenCalledOnce();
});
it("follows fast/slow/fast input and tiny reversals without moving between events", async () => {
  const change = vi.fn();
  const engine = await render({ onValueChange: change });
  for (const delta of [8, 6, 4, 2, 1, 0.2, -0.1, -0.3, 2, 4, 6, 1, -1]) {
    const before = engine.getValue();
    await wheel(delta);
    expect(engine.getValue() - before).toBeCloseTo(delta / 8);
    const after = engine.getValue();
    await tick(16);
    expect(engine.getValue()).toBe(after);
    expect(engine.getSnapshot().state).toBe("dragging");
  }
  expect(engine.start).toHaveBeenCalledOnce();
  expect(engine.release).not.toHaveBeenCalled();
  expect(
    change.mock.calls.every(([, meta]) => meta.source === "wheel"),
  ).toBe(true);
});
it("accepts a lighter second gesture immediately, even after deceleration", async () => {
  const engine = await render();
  for (const delta of [120, 100, 80, 60, 40, 20, 5]) {
    await wheel(delta);
    await tick(16);
  }
  const before = engine.getValue();
  await wheel(-0.5);
  expect(engine.getValue()).toBeCloseTo(before - 0.5 / 8);
  await tick(16);
  await wheel(0.25);
  expect(engine.getValue()).toBeCloseTo(before - 0.25 / 8);
  expect(engine.release).not.toHaveBeenCalled();
});
it("drops bursts without queuing motion or postponing settlement", async () => {
  const end = vi.fn();
  const engine = await render({ onValueChangeEnd: end });
  for (let i = 0; i < 100; i++) await wheel(10000);
  expect(engine.drag).toHaveBeenCalledOnce();
  expect(engine.drag).toHaveBeenCalledWith(2, expect.any(Number));
  await tick(80);
  expect(end).toHaveBeenCalledOnce();
});
it("limits input speed but never applies drag release tuning to wheel input", async () => {
  const change = vi.fn();
  const engine = await render({
    motion: {
      friction: 0.99,
      maxVelocity: 0.08,
      velocityMultiplier: 100,
      threshold: 0.00001,
    },
    onValueChange: change,
  });
  await wheel(100);
  expect(
    Math.abs(vi.mocked(engine.drag).mock.calls[0]![0]) * 8,
  ).toBeLessThanOrEqual((0.08 * 1000) / 60 + 1e-10);
  const changes = change.mock.calls.length;
  await tick(2000);
  expect(engine.release).not.toHaveBeenCalled();
  expect(engine.getSnapshot().state).toBe("idle");
  expect(change).toHaveBeenCalledTimes(changes);
});
it("cancels pending settlement on disable and unmount", async () => {
  const end = vi.fn();
  await render({ onValueChangeEnd: end });
  await wheel(8);
  await render({ disabled: true, onValueChangeEnd: end });
  await tick(100);
  expect(end).not.toHaveBeenCalled();
  await render({ onValueChangeEnd: end });
  await wheel(8);
  await act(async () => root.render(null));
  await tick(100);
  expect(end).not.toHaveBeenCalled();
});
it("settles boundary contact while native momentum events continue", async () => {
  const end = vi.fn();
  const engine = await render({
    defaultValue: 10000,
    onValueChangeEnd: end,
  });
  await wheel(8, false);
  for (let i = 0; i < 100; i++) {
    await wheel(8, true);
    await tick(16);
  }
  expect(end).toHaveBeenCalledExactlyOnceWith(10000);
  expect(engine.start).toHaveBeenCalledOnce();
  expect(engine.release).not.toHaveBeenCalled();
  await tick(400);
  expect(end).toHaveBeenCalledExactlyOnceWith(10000);
  expect(engine.getSnapshot().state).toBe("idle");
});
it("keeps late tiny pulses proportional instead of launching another coast", async () => {
  const change = vi.fn();
  const engine = await render({ onValueChange: change });
  for (const delta of [80, 60, 40, 20, 8, 3, 1]) {
    await wheel(delta);
    await tick(16);
  }
  for (const [delay, delta] of [
    [0, 2],
    [16, 1],
    [16, -0.5],
    [100, 1],
    [120, 0.5],
  ] as const) {
    await tick(delay);
    const before = engine.getValue();
    await wheel(delta);
    expect(engine.getValue() - before).toBeCloseTo(delta / 8);
  }
  const changes = change.mock.calls.length;
  await tick(2000);
  expect(change).toHaveBeenCalledTimes(changes);
  expect(engine.release).not.toHaveBeenCalled();
  expect(engine.getSnapshot().state).toBe("idle");
});
it("uses the calibrated gain by default", async () => {
  await act(async () =>
    root.render(<RulerPicker min={0} max={10000} defaultValue={500} />),
  );
  const engine = engines.at(-1)!;
  await wheel(8);
  expect(vi.mocked(engine.drag).mock.calls[0]![0]).toBeCloseTo(1.8);
  await tick(80);
  expect(engine.release).not.toHaveBeenCalled();
  expect(engine.getSnapshot().state).toBe("idle");
});

it("replaces native momentum once with engine inertia and ignores its tail", async () => {
  const engine = await render();
  await wheel(8, false);
  await tick(16);
  await wheel(8, false);
  const velocity = engine.getSnapshot().velocity;
  await tick(16);
  await wheel(100, true);
  expect(engine.release).toHaveBeenCalledOnce();
  expect(engine.getSnapshot().state).toBe("animating");
  expect(engine.getSnapshot().velocity).toBeCloseTo(velocity);
  const position = engine.getValue();
  const drags = vi.mocked(engine.drag).mock.calls.length;
  await wheel(1000, true);
  expect(engine.getValue()).toBe(position);
  expect(engine.drag).toHaveBeenCalledTimes(drags);
  await tick(16);
  expect(engine.getValue()).toBeGreaterThan(position);
  const speed = engine.getSnapshot().velocity;
  expect(speed).toBeLessThan(velocity);
  await tick(2000);
  const rested = engine.getValue();
  await wheel(1, true);
  expect(engine.getValue()).toBe(rested);
  expect(engine.start).toHaveBeenCalledOnce();
  await wheel(-0.5, false);
  expect(engine.getValue()).toBeCloseTo(rested - 0.5 / 8);
  expect(engine.getSnapshot().state).toBe("dragging");
});
it("never releases during real fast/slow/fast input, even at an edge", async () => {
  const end = vi.fn();
  const engine = await render({
    defaultValue: 10000,
    onValueChangeEnd: end,
  });
  for (const delta of [8, 6, 4, 2, 1, 0.2, 0.5, 2, 4, 8]) {
    await wheel(delta, false);
    await tick(16);
  }
  expect(engine.release).not.toHaveBeenCalled();
  expect(end).not.toHaveBeenCalled();
  await wheel(4, true);
  expect(engine.release).not.toHaveBeenCalled();
  await tick(320);
  expect(end).toHaveBeenCalledExactlyOnceWith(10000);
  await wheel(8, false);
  expect(engine.getSnapshot().state).toBe("dragging");
  await wheel(4, true);
  await tick(320);
  expect(end).toHaveBeenCalledTimes(2);
});
