// @vitest-environment happy-dom
import { act, createRef, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RulerPicker } from "../src";
import type { RulerPickerProps, RulerPickerRef } from "../src";
let host: HTMLDivElement;
let root: Root;
const ctx = {
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
};
const slider = () =>
  host.querySelector('[role="slider"]') as HTMLDivElement;
const value = () => Number(slider().getAttribute("aria-valuenow"));
const tick = async (ms = 200) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};
const render = async (
  props: Partial<RulerPickerProps> = {},
  ref = createRef<RulerPickerRef>(),
) => {
  await act(async () =>
    root.render(
      <RulerPicker
        min={0}
        max={100}
        defaultValue={50}
        wheelSensitivity={1}
        {...props}
        ref={ref}
      />,
    ),
  );
  return ref;
};
const key = async (name: string) => {
  await act(async () =>
    slider().dispatchEvent(
      new KeyboardEvent("keydown", { key: name, bubbles: true }),
    ),
  );
};
const wheel = async (deltaY: number, options: WheelEventInit & { momentum?: boolean } = {}) => {
  const event = new WheelEvent("wheel", {
    deltaY,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  Object.defineProperty(event, "momentum", { value: options.momentum });
  // happy-dom WheelEvent extends UIEvent and omits MouseEvent modifier fields.
  Object.defineProperty(event, "ctrlKey", {
    value: options.ctrlKey ?? false,
  });
  await act(async () => slider().dispatchEvent(event));
  return event;
};
const pointer = async (
  type: string,
  x = 200,
  options: PointerEventInit = {},
) => {
  await act(async () =>
    slider().dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        isPrimary: true,
        clientX: x,
        clientY: x,
        ...options,
      }),
    ),
  );
};
const fling = async (distance = 80, options: PointerEventInit = {}) => {
  await pointer("pointerdown", 200, options);
  await tick(50);
  await pointer("pointermove", 200 - distance, options);
  await pointer("pointerup", 200 - distance, options);
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
    ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    400,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
    240,
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: () => true,
  });
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

describe("pointer physics", () => {
  it("does not report a scroll session for a stationary click", async () => {
    const start = vi.fn();
    const end = vi.fn();
    await render({ onScrollStart: start, onValueChangeEnd: end });
    await pointer("pointerdown");
    await tick(20);
    await pointer("pointerup");
    await tick();
    expect(start).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });

  it.each(["mouse", "touch", "pen"])(
    "uses the same engine for %s",
    async (pointerType) => {
      const change = vi.fn();
      const end = vi.fn();
      const start = vi.fn();
      await render({
        max: 1000,
        onValueChange: change,
        onValueChangeEnd: end,
        onScrollStart: start,
      });
      await fling(80, { pointerType });
      expect(value()).toBe(60);
      await tick(2000);
      expect(value()).toBeGreaterThan(60);
      expect(value()).toBeLessThanOrEqual(120);
      expect(
        change.mock.calls.some(([, meta]) => meta.source === "momentum"),
      ).toBe(true);
      expect(change).toHaveBeenCalledWith(60, { source: "drag" });
      expect(end).toHaveBeenCalledExactlyOnceWith(value());
      expect(start).toHaveBeenCalledOnce();
    },
  );
  it.each(["horizontal", "vertical"] as const)(
    "maps %s reverse input",
    async (orientation) => {
      await render({
        orientation,
        reverse: true,
        motion: { velocityMultiplier: 0 },
      });
      await fling(80);
      expect(value()).toBe(40);
      expect(slider().scrollLeft).toBe(0);
      expect(slider().scrollTop).toBe(0);
    },
  );
  it("holds until release and forgets an old fling after a pause", async () => {
    const end = vi.fn();
    await render({ onValueChangeEnd: end });
    await pointer("pointerdown");
    await tick(50);
    await pointer("pointermove", 120);
    await tick(400);
    expect(end).not.toHaveBeenCalled();
    await pointer("pointerup", 120);
    await tick(2000);
    expect(value()).toBe(60);
    expect(end).toHaveBeenCalledOnce();
  });
  it("clamps bounds and allows reversing away from the edge", async () => {
    await render({ defaultValue: 99, motion: { friction: 0 } });
    await pointer("pointerdown");
    await tick(50);
    await pointer("pointermove", 0);
    expect(value()).toBe(100);
    await tick(50);
    await pointer("pointermove", 16);
    expect(value()).toBe(100);
    await pointer("pointermove", 216);
    expect(value()).toBe(97);
    await pointer("pointerup", 216);
  });
  it.each(["pointercancel", "lostpointercapture"])(
    "stops without inertia on %s",
    async (event) => {
      const end = vi.fn();
      await render({ onValueChangeEnd: end });
      await pointer("pointerdown");
      await tick(50);
      await pointer("pointermove", 120);
      await pointer(event, 120);
      await tick(2000);
      expect(value()).toBe(60);
      expect(end).toHaveBeenCalledOnce();
    },
  );
  it("ignores secondary pointers and unrelated releases", async () => {
    await render({ motion: { friction: 0 } });
    await pointer("pointerdown");
    await tick(50);
    await pointer("pointermove", 50, { pointerId: 2, isPrimary: false });
    expect(value()).toBe(50);
    await pointer("pointerup", 50, { pointerId: 2 });
    await pointer("pointermove", 120);
    expect(value()).toBe(60);
    await pointer("pointerup", 120);
  });
  it("new input interrupts inertia", async () => {
    await render();
    await fling();
    await tick(100);
    const held = value();
    await pointer("pointerdown");
    await tick(2000);
    expect(value()).toBe(held);
    await pointer("pointerup");
  });
  it("pixel velocity cap yields consistent pixel travel across spacing", async () => {
    const end = vi.fn();
    const props = {
      max: 1000,
      onValueChangeEnd: end,
      motion: { friction: 0.9, maxVelocity: 0.8 },
    };
    await render(props);
    await fling(80);
    await tick(2000);
    const first = value();
    await render({ ...props, value: 50, tickSpacing: 16 });
    await fling(160);
    await tick(2000);
    const second = end.mock.calls.at(-1)![0];
    expect(
      Math.abs((first - 60) * 8 - (second - 60) * 16),
    ).toBeLessThanOrEqual(16);
    expect(first).toBeLessThanOrEqual(76);
  });
  it("honors reduced motion for released gestures", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    await render();
    await fling();
    await tick(2000);
    expect(value()).toBe(60);
  });
  it("compensates for CSS-scaled input", async () => {
    await render({ motion: { friction: 0 } });
    vi.spyOn(slider(), "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 480,
    } as DOMRect);
    await fling(80);
    expect(value()).toBe(55);
  });
});

describe("wheel adapter", () => {
  it("injects wheel displacement and settles once after input becomes idle", async () => {
    const change = vi.fn();
    const end = vi.fn();
    const start = vi.fn();
    await render({
      motion: { friction: 0 },
      onValueChange: change,
      onValueChangeEnd: end,
      onScrollStart: start,
    });
    expect((await wheel(11)).defaultPrevented).toBe(true);
    await wheel(10);
    expect(value()).toBe(52);
    await tick(79);
    expect(end).not.toHaveBeenCalled();
    await tick(1);
    expect(end).toHaveBeenCalledExactlyOnceWith(52);
    expect(start).toHaveBeenCalledOnce();
    expect(change).toHaveBeenLastCalledWith(52, { source: "wheel" });
  });
  it.each([
    [8, 0, 51],
    [1, 1, 52],
    [1, 2, 52],
  ])(
    "normalizes delta %i in mode %i before limiting input",
    async (delta, mode, expected) => {
      await render({ motion: { friction: 0 } });
      await wheel(delta!, { deltaMode: mode! });
      expect(value()).toBe(expected);
    },
  );
  it("uses dominant horizontal and vertical axes", async () => {
    await render();
    await wheel(1, { deltaX: 8 });
    expect(value()).toBe(51);
    await render({ orientation: "vertical" });
    await wheel(8, { deltaX: 80 });
    expect(value()).toBe(52);
  });
  it("supports sensitivity, zero, zoom bypass, and boundary overscroll", async () => {
    await render({ wheelSensitivity: 0.5 });
    await wheel(16);
    expect(value()).toBe(51);
    expect((await wheel(40, { ctrlKey: true })).defaultPrevented).toBe(
      false,
    );
    await render({ wheelSensitivity: 0 });
    expect((await wheel(16)).defaultPrevented).toBe(false);
    await render({ value: 100 });
    expect((await wheel(16)).defaultPrevented).toBe(true);
  });
  it("handles mouse wheels on coarse-pointer and Harmony devices too", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("HarmonyOS");
    await render();
    expect((await wheel(16)).defaultPrevented).toBe(true);
    expect(value()).toBe(52);
  });
});

describe("controlled values and lifecycle", () => {
  it("initializes silently with accessible semantics and a working ref", async () => {
    const change = vi.fn();
    const ref = await render({
      "aria-label": "Height",
      onValueChange: change,
    });
    expect(ref.current?.getValue()).toBe(50);
    expect(slider().getAttribute("aria-label")).toBe("Height");
    expect(change).not.toHaveBeenCalled();
  });
  it("preserves motion with synchronous controlled feedback through final settlement", async () => {
    const end = vi.fn();
    function Controlled() {
      const [v, setV] = useState(50);
      return (
        <RulerPicker
          min={0}
          max={1000}
          value={v}
          onValueChange={setV}
          onValueChangeEnd={end}
        />
      );
    }
    await act(async () =>
      root.render(
        <StrictMode>
          <Controlled />
        </StrictMode>,
      ),
    );
    await fling();
    await tick(2000);
    expect(value()).toBeGreaterThan(60);
    expect(end).toHaveBeenCalledExactlyOnceWith(value());
  });
  it("does not rewind earlier controlled feedback during newer motion", async () => {
    await render({ value: 50 });
    await pointer("pointerdown", 200);
    await pointer("pointermove", 184);
    await pointer("pointermove", 168);
    expect(value()).toBe(54);
    await render({ value: 52 });
    expect(value()).toBe(54);
    await render({ value: 54 });
    await pointer("pointerup", 168);
    await tick(1500);
    expect(value()).toBe(54);
  });
  it("restores rejected controlled proposals after settlement", async () => {
    const end = vi.fn();
    await render({
      value: 50,
      motion: { friction: 0 },
      onValueChangeEnd: end,
    });
    await wheel(8);
    expect(value()).toBe(51);
    await tick(1500);
    expect(value()).toBe(50);
    expect(end).toHaveBeenCalledExactlyOnceWith(51);
  });
  it("external value changes interrupt silently", async () => {
    const change = vi.fn();
    const end = vi.fn();
    await render({
      value: 50,
      onValueChange: change,
      onValueChangeEnd: end,
    });
    await fling();
    change.mockClear();
    await render({
      value: 20,
      onValueChange: change,
      onValueChangeEnd: end,
    });
    await tick(2000);
    expect(value()).toBe(20);
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
  it("geometry changes realign and cancel motion", async () => {
    const end = vi.fn();
    await render({ onValueChangeEnd: end });
    await fling();
    await render({
      min: 65,
      max: 70,
      reverse: true,
      orientation: "vertical",
      onValueChangeEnd: end,
    });
    await tick(2000);
    expect(value()).toBe(65);
    expect(end).not.toHaveBeenCalled();
  });
  it("disabling stops pending work and ignores wheel, pointer, keyboard and ref", async () => {
    const end = vi.fn();
    const change = vi.fn();
    const ref = await render({
      onValueChange: change,
      onValueChangeEnd: end,
    });
    await fling();
    await render(
      { disabled: true, onValueChange: change, onValueChangeEnd: end },
      ref,
    );
    const at = value();
    change.mockClear();
    await wheel(20);
    await key("ArrowRight");
    await fling();
    await act(async () => ref.current?.scrollToValue(0));
    await tick(2000);
    expect(value()).toBe(at);
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
    expect(slider().tabIndex).toBe(-1);
  });
  it.each(["wheel", "pointer", "ref"])(
    "cleans up %s work on unmount",
    async (mode) => {
      const end = vi.fn();
      const ref = await render({ onValueChangeEnd: end });
      if (mode === "wheel") await wheel(16);
      else if (mode === "pointer") await fling();
      else
        await act(async () =>
          ref.current?.scrollToValue(90, { animated: true }),
        );
      await act(async () => root.render(null));
      await tick(2000);
      expect(end).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );
});

describe("keyboard, ref and rendering", () => {
  it("does not interpret navigation keys", async () => {
    const change = vi.fn();
    const end = vi.fn();
    await render({ onValueChange: change, onValueChangeEnd: end });
    for (const name of [
      "ArrowRight",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
    ]) {
      const event = new KeyboardEvent("keydown", {
        key: name,
        bubbles: true,
        cancelable: true,
      });
      await act(async () => slider().dispatchEvent(event));
      expect(event.defaultPrevented).toBe(false);
    }
    await tick();
    expect(value()).toBe(50);
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
  it("forwards keyboard handlers so consumers can opt in", async () => {
    const ref = createRef<RulerPickerRef>();
    const up = vi.fn();
    const change = vi.fn();
    const down = vi.fn((event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        ref.current?.scrollToValue(ref.current.getValue() + 5);
      }
    });
    await render(
      { onKeyDown: down, onKeyUp: up, onValueChange: change },
      ref,
    );
    await key("ArrowRight");
    await act(async () =>
      slider().dispatchEvent(
        new KeyboardEvent("keyup", { key: "ArrowRight", bubbles: true }),
      ),
    );
    await tick();
    expect(value()).toBe(55);
    expect(down).toHaveBeenCalledOnce();
    expect(up).toHaveBeenCalledOnce();
    expect(change).toHaveBeenLastCalledWith(55, {
      source: "programmatic",
    });
  });
  it("does not emit for idle no-op ref and key calls", async () => {
    const change = vi.fn();
    const end = vi.fn();
    const ref = await render({
      defaultValue: 100,
      onValueChange: change,
      onValueChangeEnd: end,
    });
    await key("ArrowUp");
    await act(async () => ref.current?.scrollToValue(100));
    await tick();
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
  it("animates ref navigation and reports intermediate programmatic values", async () => {
    const change = vi.fn();
    const end = vi.fn();
    const ref = await render({
      onValueChange: change,
      onValueChangeEnd: end,
    });
    await act(async () =>
      ref.current?.scrollToValue(90, { animated: true }),
    );
    await tick(100);
    expect(value()).toBeGreaterThan(50);
    expect(value()).toBeLessThan(90);
    await tick(200);
    expect(ref.current?.getValue()).toBe(90);
    expect(end).toHaveBeenCalledExactlyOnceWith(90);
    expect(
      change.mock.calls.every(
        ([, meta]) => meta.source === "programmatic",
      ),
    ).toBe(true);
  });
  it("stops a ref animation when a pointer takes control", async () => {
    const ref = await render();
    await act(async () =>
      ref.current?.scrollToValue(90, { animated: true }),
    );
    await tick(64);
    await pointer("pointerdown");
    const held = value();
    await tick(500);
    expect(value()).toBe(held);
    await pointer("pointerup");
  });
  it("draws only visible ticks for ranges beyond native scroll limits", async () => {
    await render();
    const count = host.querySelectorAll("*").length;
    ctx.lineTo.mockClear();
    await render({ max: 10000000 });
    expect(host.querySelectorAll("*")).toHaveLength(count);
    expect(ctx.lineTo.mock.calls.length).toBeLessThan(200);
    expect(host.querySelector(".rrp-content")).toBeNull();
  });
  it("does not reallocate the canvas on a value-only update", async () => {
    await render();
    const width = vi.spyOn(host.querySelector("canvas")!, "width", "set");
    await wheel(8);
    expect(width).not.toHaveBeenCalled();
  });
  it("supports resize fallback and per-tick styles", async () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const getTickStyle = vi.fn((info) =>
      info.value === 50 ? { color: "red" } : undefined,
    );
    await render({ getTickStyle, tickAlignment: "bottom" });
    expect(host.querySelector("canvas")?.width).toBe(400);
    expect(getTickStyle).toHaveBeenCalledWith({
      value: 50,
      index: 50,
      isMajor: true,
      isLabel: true,
    });
    expect(host.querySelector(".rrp-cursor--bottom")).not.toBeNull();
  });
  it("draws reverse labels on logical major steps", async () => {
    ctx.fillText.mockClear();
    await render({ max: 95, reverse: true, majorStep: 10 });
    const labels = ctx.fillText.mock.calls.map((call) => Number(call[0]));
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((v) => v % 10 === 0)).toBe(true);
  });
});

describe("elastic edges", () => {
  const labelAxis = (label: string, vertical = false) => {
    const call = ctx.fillText.mock.calls
      .filter((call) => call[0] === label)
      .at(-1);
    expect(call).toBeDefined();
    return call![vertical ? 2 : 1] as number;
  };
  it.each(["horizontal", "vertical"] as const)(
    "pulls beyond the %s edge while keeping values valid, then returns",
    async (orientation) => {
      const end = vi.fn();
      const change = vi.fn();
      const vertical = orientation === "vertical";
      const center = vertical ? 120 : 200;
      await render({
        defaultValue: 0,
        orientation,
        onValueChange: change,
        onValueChangeEnd: end,
      });
      await pointer("pointerdown", 200);
      await tick(50);
      await pointer("pointermove", 280);
      expect(value()).toBe(0);
      const firstOverscroll = labelAxis("0", vertical);
      expect(firstOverscroll).toBeGreaterThan(center);
      expect(firstOverscroll).toBeLessThan(center + 72);
      await pointer("pointermove", 360);
      expect(value()).toBe(0);
      expect(labelAxis("0", vertical)).toBeGreaterThan(firstOverscroll);
      expect(labelAxis("0", vertical)).toBeLessThan(center + 72);
      await tick(300);
      expect(end).not.toHaveBeenCalled();
      await pointer("pointerup", 280);
      await tick(96);
      expect(labelAxis("0", vertical)).toBeGreaterThan(center);
      expect(end).not.toHaveBeenCalled();
      await tick(300);
      expect(labelAxis("0", vertical)).toBeCloseTo(center);
      expect(change).not.toHaveBeenCalled();
      expect(end).toHaveBeenCalledExactlyOnceWith(0);
    },
  );
  it("provides wheel overscroll at the maximum and settles after rebound", async () => {
    const end = vi.fn();
    await render({ defaultValue: 100, onValueChangeEnd: end });
    await wheel(80);
    expect(value()).toBe(100);
    expect(labelAxis("100")).toBeLessThan(200);
    await tick(60);
    expect(end).not.toHaveBeenCalled();
    await tick(400);
    expect(labelAxis("100")).toBeCloseTo(200);
    expect(end).toHaveBeenCalledExactlyOnceWith(100);
  });
  it("settles after a long decaying wheel tail and a zero final event", async () => {
    const end = vi.fn();
    await render({ defaultValue: 100, onValueChangeEnd: end });
    for (let i = 0; i < 40; i++) {
      await wheel(80 * Math.exp(-i / 5));
      await tick(16);
      expect(value()).toBe(100);
    }
    await wheel(0);
    await tick(500);
    expect(end).toHaveBeenCalledExactlyOnceWith(100);
    expect(labelAxis("100")).toBeCloseTo(200);
  });
  it.each([
    ["horizontal", false, 100],
    ["horizontal", false, 0],
    ["vertical", false, 100],
    ["vertical", false, 0],
    ["horizontal", true, 100],
    ["horizontal", true, 0],
    ["vertical", true, 100],
    ["vertical", true, 0],
  ] as const)(
    "returns on native momentum onset despite outward tail (%s, reverse=%s, bound=%s)",
    async (orientation, reverse, bound) => {
      const end = vi.fn();
      const vertical = orientation === "vertical";
      const center = vertical ? 120 : 200;
      const sign = (bound === 100 ? 1 : -1) * (reverse ? -1 : 1);
      await render({
        defaultValue: bound === 100 ? 99 : 1,
        orientation,
        reverse,
        onValueChangeEnd: end,
      });
      await wheel(sign * 80);
      const offset = () =>
        Math.abs(labelAxis(String(bound), vertical) - center);
      const pulled = offset();
      expect(pulled).toBeGreaterThan(0);
      await tick(16);
      expect(offset()).toBeCloseTo(pulled);
      await wheel(sign * 70, { momentum: true });
      await tick(16);
      expect(offset()).toBeLessThan(pulled);
      // Keep delivering platform tail events: they must neither hold the edge
      // out nor restart its return after it has settled.
      let previous = offset();
      for (let i = 0; i < 60; i++) {
        await wheel(sign * 80 * Math.exp(-i / 8), { momentum: true });
        await tick(16);
        expect(offset()).toBeLessThanOrEqual(previous + 1e-8);
        expect(value()).toBe(bound);
        if (i === 18) expect(end).toHaveBeenCalledExactlyOnceWith(bound);
        previous = offset();
      }
      expect(offset()).toBeCloseTo(0);
      expect(end).toHaveBeenCalledExactlyOnceWith(bound);
      // Another real outward gesture must work at the same boundary.
      await wheel(sign * 16, { momentum: false });
      expect(offset()).toBeGreaterThan(0);
      await wheel(sign * 8, { momentum: true });
      await tick(320);
      expect(end).toHaveBeenCalledTimes(2);
    },
  );
  it.each([16, 400])(
    "accepts inward wheel input immediately during/after edge return (%sms)",
    async (delay) => {
      await render({ defaultValue: 100 });
      await wheel(80);
      await wheel(70, { momentum: true });
      await tick(delay);
      await wheel(-8);
      expect(value()).toBe(99);
      expect(labelAxis("100")).toBeGreaterThan(200);
      await tick(16);
      await wheel(80);
      expect(value()).toBe(100);
      expect(labelAxis("100")).toBeLessThan(200);
    },
  );
  it("accepts wheel input after an explicit disabled transition", async () => {
    const end = vi.fn();
    await render({ defaultValue: 100, onValueChangeEnd: end });
    await wheel(80);
    await wheel(40, { momentum: true });
    await tick(320);
    await render({
      defaultValue: 100,
      disabled: true,
      onValueChangeEnd: end,
    });
    await render({
      defaultValue: 100,
      disabled: false,
      onValueChangeEnd: end,
    });
    await wheel(80);
    await wheel(40, { momentum: true });
    expect(labelAxis("100")).toBeLessThan(200);
    await tick(320);
    expect(end).toHaveBeenCalledTimes(2);
  });
  it("returns visibly on the first frame even after a very long edge pull", async () => {
    await render({ defaultValue: 0 });
    await pointer("pointerdown", 200);
    await pointer("pointermove", 10200);
    const pulled = labelAxis("0");
    await pointer("pointerup", 10200);
    await tick(16);
    expect(labelAxis("0")).toBeLessThan(pulled - 5);
  });
  it("bounces an inertial collision and settles only once", async () => {
    const end = vi.fn();
    await render({ defaultValue: 85, onValueChangeEnd: end });
    await fling(80);
    await tick(80);
    expect(value()).toBe(100);
    expect(labelAxis("100")).toBeLessThan(200);
    expect(end).not.toHaveBeenCalled();
    await tick(500);
    expect(labelAxis("100")).toBeCloseTo(200);
    expect(end).toHaveBeenCalledExactlyOnceWith(100);
  });
  it("can regrab a returning edge and cancels on disable", async () => {
    const end = vi.fn();
    await render({ defaultValue: 0, onValueChangeEnd: end });
    await pointer("pointerdown", 200);
    await pointer("pointermove", 280);
    await pointer("pointerup", 280);
    await tick(64);
    await pointer("pointerdown", 280);
    const held = labelAxis("0");
    await tick(500);
    expect(labelAxis("0")).toBeCloseTo(held);
    expect(end).not.toHaveBeenCalled();
    await render({
      defaultValue: 0,
      disabled: true,
      onValueChangeEnd: end,
    });
    await tick(500);
    expect(labelAxis("0")).toBeCloseTo(200);
    expect(end).not.toHaveBeenCalled();
  });
  it("cleans up an active rebound on unmount", async () => {
    const end = vi.fn();
    await render({ defaultValue: 0, onValueChangeEnd: end });
    await wheel(-80);
    await tick(140);
    await act(async () => root.render(null));
    await tick(500);
    expect(end).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("settles an overscrolled edge immediately with reduced motion", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const end = vi.fn();
    await render({ defaultValue: 0, onValueChangeEnd: end });
    await pointer("pointerdown", 200);
    await pointer("pointermove", 280);
    await pointer("pointerup", 280);
    expect(labelAxis("0")).toBeCloseTo(200);
    expect(end).toHaveBeenCalledExactlyOnceWith(0);
  });
});
