// @vitest-environment happy-dom
import { act, createRef, useState } from "react";
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
const slider = () => host.querySelector('[role="slider"]') as HTMLDivElement;
const tick = async (ms = 200) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};
const render = async (
  props: Partial<RulerPickerProps> = {},
  ref = createRef<RulerPickerRef>(),
) => {
  await act(async () => {
    root.render(
      <RulerPicker min={0} max={100} defaultValue={50} {...props} ref={ref} />,
    );
  });
  return ref;
};
const key = async (key: string) => {
  await act(async () => {
    slider().dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true }),
    );
  });
};
const wheel = async (delta: number) => {
  await act(async () => {
    slider().dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: delta,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await tick(20);
};
const touch = async (type: string) => {
  await act(async () => {
    slider().dispatchEvent(new Event(type, { bubbles: true }));
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(240);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("RulerPicker interaction", () => {
  it("initializes silently and exposes accessible slider semantics", async () => {
    const change = vi.fn();
    const ref = await render({ "aria-label": "Height", onValueChange: change });
    await tick();
    expect(change).not.toHaveBeenCalled();
    expect(slider().scrollLeft).toBe(400);
    expect(ref.current?.getValue()).toBe(50);
    expect(slider().getAttribute("aria-label")).toBe("Height");
    expect(slider().tabIndex).toBe(0);
  });
  it("supports arrow, page and boundary keys with one settled callback", async () => {
    const change = vi.fn();
    const end = vi.fn();
    await render({ onValueChange: change, onValueChangeEnd: end });
    await key("ArrowRight");
    await key("PageUp");
    expect(change).toHaveBeenLastCalledWith(61, { source: "keyboard" });
    await tick();
    expect(end).toHaveBeenCalledExactlyOnceWith(61);
    await key("End");
    await tick();
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    await key("Home");
    await tick();
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
  });
  it("uses scrollTop for vertical, reversed scales and ref navigation", async () => {
    const ref = await render({
      orientation: "vertical",
      reverse: true,
      defaultValue: 20,
    });
    expect(slider().scrollTop).toBe(640);
    expect(slider().scrollLeft).toBe(0);
    await act(async () => ref.current?.scrollToValue(70));
    await tick();
    expect(slider().scrollTop).toBe(240);
    expect(ref.current?.getValue()).toBe(70);
    expect(slider().getAttribute("aria-orientation")).toBe("vertical");
  });
  it("deduplicates no-op ref and keyboard changes", async () => {
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
  it("snaps wheel movement after idle and starts only once", async () => {
    const start = vi.fn();
    const end = vi.fn();
    await render({ onScrollStart: start, onValueChangeEnd: end });
    await wheel(11);
    await wheel(10);
    await tick();
    expect(slider().scrollLeft).toBe(424);
    expect(start).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledExactlyOnceWith(53);
  });
  it.each(["android", "harmony"] as const)(
    "samples %s momentum even without scroll events",
    async (platform) => {
      const change = vi.fn();
      const end = vi.fn();
      await render({ platform, onValueChange: change, onValueChangeEnd: end });
      await touch("touchstart");
      slider().scrollLeft = 432;
      await tick(32);
      expect(change).toHaveBeenLastCalledWith(54, { source: "drag" });
      await touch("touchend");
      slider().scrollLeft = 468;
      await tick(32);
      expect(change).toHaveBeenLastCalledWith(59, { source: "momentum" });
      await tick(200);
      expect(slider().scrollLeft).toBe(472);
      expect(end).toHaveBeenCalledExactlyOnceWith(59);
    },
  );
  it("does not snap while a touch is held stationary", async () => {
    const end = vi.fn();
    await render({ platform: "android", onValueChangeEnd: end });
    await touch("touchstart");
    slider().scrollLeft = 411;
    await tick(400);
    expect(end).not.toHaveBeenCalled();
    expect(slider().scrollLeft).toBe(411);
    await touch("touchend");
    await tick();
    expect(slider().scrollLeft).toBe(408);
    expect(end).toHaveBeenCalledTimes(1);
  });
  it("accepts controlled updates without cancelling a scroll session", async () => {
    const end = vi.fn();
    function Controlled() {
      const [value, setValue] = useState(50);
      return (
        <RulerPicker
          min={0}
          max={100}
          value={value}
          onValueChange={setValue}
          onValueChangeEnd={end}
        />
      );
    }
    await act(async () => root.render(<Controlled />));
    await wheel(13);
    await wheel(15);
    await tick();
    expect(slider().getAttribute("aria-valuenow")).toBe("54");
    expect(slider().scrollLeft).toBe(432);
    expect(end).toHaveBeenCalledExactlyOnceWith(54);
  });
  it("restores a controlled value if the parent rejects a change", async () => {
    await render({ value: 50 });
    await key("ArrowRight");
    await tick();
    expect(slider().getAttribute("aria-valuenow")).toBe("50");
    expect(slider().scrollLeft).toBe(400);
  });
  it.each(["horizontal", "vertical"] as const)(
    "preserves %s momentum when controlled feedback trails RAF sampling",
    async (orientation) => {
      const end = vi.fn();
      function Controlled() {
        const [value, setValue] = useState(50);
        return (
          <RulerPicker
            min={0}
            max={100}
            value={value}
            platform="harmony"
            orientation={orientation}
            onValueChange={(next) => setTimeout(() => setValue(next), 24)}
            onValueChangeEnd={end}
          />
        );
      }
      await act(async () => root.render(<Controlled />));
      const axis = orientation === "vertical" ? "scrollTop" : "scrollLeft";
      let position = 400;
      const write = vi.fn((next: number) => {
        position = next;
      });
      Object.defineProperty(slider(), axis, {
        configurable: true,
        get: () => position,
        set: write,
      });
      await touch("touchstart");
      position = 416.3;
      await tick(16);
      position = 432.6;
      await tick(16);
      // The first parent update commits after a newer native position was sampled.
      await tick(8);
      expect(write).not.toHaveBeenCalled();
      await touch("touchend");
      position = 448.4;
      await tick(16);
      expect(write).not.toHaveBeenCalled();
      position = 464.6;
      await tick(32);
      expect(write).not.toHaveBeenCalled();
      await tick(220);
      expect(position).toBe(464);
      expect(end).toHaveBeenCalledExactlyOnceWith(58);
    },
  );
  it("does not rewrite an aligned offset in response to queued scroll events", async () => {
    await render();
    const write = vi.spyOn(slider(), "scrollLeft", "set");
    for (let i = 0; i < 3; i++) {
      await act(async () => slider().dispatchEvent(new Event("scroll")));
    }
    expect(write).not.toHaveBeenCalled();
  });
  it("still applies a new external value during an active gesture", async () => {
    await render({ value: 50, platform: "harmony" });
    await touch("touchstart");
    slider().scrollLeft = 432.6;
    await tick(16);
    await render({ value: 80, platform: "harmony" });
    expect(slider().scrollLeft).toBe(640);
    expect(slider().getAttribute("aria-valuenow")).toBe("80");
  });
  it("aligns external values silently", async () => {
    const change = vi.fn();
    await render({ value: 20, onValueChange: change });
    await render({ value: 80, onValueChange: change });
    await tick();
    expect(slider().scrollLeft).toBe(640);
    expect(change).not.toHaveBeenCalled();
  });
  it("freezes pending scrolling and rejects new input while disabled", async () => {
    const change = vi.fn();
    const end = vi.fn();
    const ref = await render({ onValueChange: change, onValueChangeEnd: end });
    await wheel(16);
    change.mockClear();
    await render(
      {
        value: 52,
        disabled: true,
        onValueChange: change,
        onValueChangeEnd: end,
      },
      ref,
    );
    await key("ArrowRight");
    await wheel(30);
    await act(async () => ref.current?.scrollToValue(80));
    slider().scrollLeft = 600;
    await act(async () =>
      slider().dispatchEvent(new Event("scroll", { bubbles: true })),
    );
    await tick();
    expect(slider().scrollLeft).toBe(416);
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
    expect(slider().tabIndex).toBe(-1);
  });
  it("ignores stray scroll events outside a user session", async () => {
    const change = vi.fn();
    await render({ onValueChange: change });
    slider().scrollLeft = 0;
    await act(async () =>
      slider().dispatchEvent(new Event("scroll", { bubbles: true })),
    );
    await tick();
    expect(slider().scrollLeft).toBe(400);
    expect(change).not.toHaveBeenCalled();
  });
  it("normalizes a changed range and orientation", async () => {
    await render();
    await render({ min: 60, max: 70, orientation: "vertical" });
    expect(slider().getAttribute("aria-valuenow")).toBe("60");
    expect(slider().scrollTop).toBe(0);
  });
  it("keeps DOM and canvas drawing bounded for 100,001 values", async () => {
    await render();
    const count = host.querySelectorAll("*").length;
    ctx.lineTo.mockClear();
    await render({ max: 100000 });
    expect(host.querySelectorAll("*")).toHaveLength(count);
    expect(ctx.lineTo.mock.calls.length).toBeLessThan(150);
    expect(host.querySelectorAll("canvas")).toHaveLength(1);
  });
  it("does not reallocate the canvas for a value-only update", async () => {
    await render();
    const canvas = host.querySelector("canvas")!;
    const width = vi.spyOn(canvas, "width", "set");
    await key("ArrowRight");
    await tick();
    expect(width).not.toHaveBeenCalled();
  });
  it("cancels callbacks and frame sampling on unmount", async () => {
    const end = vi.fn();
    await render({ platform: "android", onValueChangeEnd: end });
    await wheel(15);
    await act(async () => root.render(null));
    await tick(1000);
    expect(end).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("geometry and gesture regressions", () => {
  it("realigns geometry changes during active momentum", async () => {
    await render({ platform: "android" });
    await wheel(17);
    await render({
      platform: "android",
      orientation: "vertical",
      reverse: true,
    });
    await tick();
    expect(slider().scrollTop).toBe(384);
    expect(slider().getAttribute("aria-valuenow")).toBe("52");
  });
  it("snaps sub-step native scrolling even when the value never changed", async () => {
    const change = vi.fn();
    await render({ platform: "android", onValueChange: change });
    await touch("touchstart");
    slider().scrollLeft = 403;
    await tick(32);
    await touch("touchend");
    await tick();
    expect(slider().scrollLeft).toBe(400);
    expect(change).not.toHaveBeenCalled();
  });
  it("aligns again after a hidden track becomes visible", async () => {
    let resize: () => void = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: () => void) {
          resize = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(0);
    await render({ defaultValue: 80 });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    await act(async () => resize());
    expect(slider().scrollLeft).toBe(640);
    expect(host.querySelector("canvas")?.width).toBe(400);
  });
  it("maintains logical tick placement in reverse mode", async () => {
    ctx.fillText.mockClear();
    await render({
      min: 0,
      max: 95,
      reverse: true,
      defaultValue: 50,
      majorStep: 10,
    });
    const labels = ctx.fillText.mock.calls.map((call) => Number(call[0]));
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((value) => value % 10 === 0)).toBe(true);
  });
  it("uses the resize fallback when ResizeObserver is missing", async () => {
    vi.stubGlobal("ResizeObserver", undefined);
    await render();
    expect(host.querySelector("canvas")?.width).toBe(400);
  });
  it("supports getTickStyle to customize individual ticks", async () => {
    const getTickStyle = vi.fn((info) => {
      if (info.value === 50) {
        return { color: "#ff0000", width: 4, height: 35, borderRadius: 2 };
      }
      return undefined;
    });
    await render({
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      getTickStyle,
    });
    expect(getTickStyle).toHaveBeenCalled();
    const targetCall = getTickStyle.mock.calls.find(
      (call) => call[0].value === 50,
    );
    expect(targetCall).toBeDefined();
    expect(targetCall![0]).toEqual({
      value: 50,
      index: 50,
      isMajor: true,
      isLabel: true,
    });
    expect(ctx.stroke).toHaveBeenCalled();
  });
  it("renders with tickAlignment bottom and draws from bottom baseline", async () => {
    ctx.moveTo.mockClear();
    ctx.lineTo.mockClear();
    await render({
      min: 0,
      max: 10,
      defaultValue: 5,
      tickAlignment: "bottom",
    });
    expect(
      slider().parentElement?.querySelector(".rrp-cursor--bottom"),
    ).toBeDefined();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalled();
  });
});

describe("native pointer scrolling regressions", () => {
  const nativePointer = async (type: string) => {
    await act(async () => {
      slider().dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 7,
          pointerType: "touch",
          button: 0,
        }),
      );
    });
  };
  it.each(["horizontal", "vertical"] as const)(
    "allows native %s scroll after a touch pointerdown without touchstart",
    async (orientation) => {
      const change = vi.fn();
      const end = vi.fn();
      await render({
        platform: "harmony",
        orientation,
        onValueChange: change,
        onValueChangeEnd: end,
      });
      await nativePointer("pointerdown");
      if (orientation === "vertical") slider().scrollTop = 432;
      else slider().scrollLeft = 432;
      await act(async () => slider().dispatchEvent(new Event("scroll")));
      await tick(32);
      expect(
        orientation === "vertical" ? slider().scrollTop : slider().scrollLeft,
      ).toBe(432);
      expect(change).toHaveBeenCalledWith(54, expect.anything());
      await nativePointer("pointercancel");
      if (orientation === "vertical") slider().scrollTop = 451;
      else slider().scrollLeft = 451;
      // Momentum can continue after pointercancel without any scroll events.
      await tick();
      expect(
        orientation === "vertical" ? slider().scrollTop : slider().scrollLeft,
      ).toBe(448);
      expect(end).toHaveBeenCalledExactlyOnceWith(56);
    },
  );
  it("starts Harmony sampling from pointer input even if scroll events are absent", async () => {
    const change = vi.fn();
    await render({ platform: "harmony", onValueChange: change });
    await nativePointer("pointerdown");
    slider().scrollLeft = 432;
    await tick(32);
    expect(change).toHaveBeenCalledWith(54, expect.anything());
  });
  it("recovers authorization on touchmove and keeps gestures inside nested sheets", async () => {
    const parent = vi.fn();
    await act(async () =>
      root.render(
        <div onTouchMove={parent}>
          <RulerPicker min={0} max={100} defaultValue={50} platform="harmony" />
        </div>,
      ),
    );
    // Covers a missed touchstart or a geometry reset after the finger went down.
    await touch("touchmove");
    slider().scrollLeft = 432;
    await act(async () => slider().dispatchEvent(new Event("scroll")));
    await tick(32);
    expect(slider().scrollLeft).toBe(432);
    expect(slider().getAttribute("aria-valuenow")).toBe("54");
    expect(parent).not.toHaveBeenCalled();
  });
});

describe("mobile momentum settling", () => {
  it("does not truncate moving momentum when RAF and scroll callbacks are delayed", async () => {
    let skipFrames = false;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
      setTimeout(() => {
        if (!skipFrames) cb(performance.now());
      }, 16),
    );
    const end = vi.fn();
    const change = vi.fn();
    await render({
      platform: "harmony",
      onValueChangeEnd: end,
      onValueChange: change,
    });
    await touch("touchstart");
    slider().scrollLeft = 432;
    await tick(32);
    await touch("touchend");
    skipFrames = true;
    slider().scrollLeft = 451;
    await tick(180);
    expect(end).not.toHaveBeenCalled();
    expect(slider().scrollLeft).toBe(451);
    await tick(180);
    expect(slider().scrollLeft).toBe(448);
    expect(change).toHaveBeenLastCalledWith(56, { source: "momentum" });
    expect(end).toHaveBeenCalledExactlyOnceWith(56);
  });
  it("keeps native pointer input held until release without requiring Touch Events", async () => {
    const end = vi.fn();
    await render({ platform: "harmony", onValueChangeEnd: end });
    await act(async () =>
      slider().dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: 1,
          pointerType: "touch",
        }),
      ),
    );
    slider().scrollLeft = 411;
    await tick(400);
    expect(end).not.toHaveBeenCalled();
    expect(slider().scrollLeft).toBe(411);
    await act(async () =>
      slider().dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          pointerId: 1,
          pointerType: "touch",
        }),
      ),
    );
    await tick();
    expect(slider().scrollLeft).toBe(408);
    expect(end).toHaveBeenCalledExactlyOnceWith(51);
  });
  it("pointercancel does not finish a gesture while Touch Events still report a held finger", async () => {
    const end = vi.fn();
    await render({ platform: "harmony", onValueChangeEnd: end });
    await touch("touchstart");
    slider().scrollLeft = 411;
    await act(async () =>
      slider().dispatchEvent(
        new PointerEvent("pointercancel", {
          bubbles: true,
          pointerId: 1,
          pointerType: "touch",
        }),
      ),
    );
    await tick(400);
    expect(end).not.toHaveBeenCalled();
    await touch("touchend");
    await tick();
    expect(end).toHaveBeenCalledExactlyOnceWith(51);
  });
});

describe("native mobile gesture ownership", () => {
  const coarse = () =>
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(pointer: coarse)",
          media: query,
        }) as MediaQueryList,
    );
  it("does not capture or manually move mouse-like pointers on a touch-first device", async () => {
    coarse();
    await render();
    const capture = vi.fn();
    slider().setPointerCapture = capture;
    const writes = vi.spyOn(slider(), "scrollLeft", "set");
    await act(async () => {
      slider().dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: 9,
          pointerType: "mouse",
          button: 0,
          clientX: 200,
        }),
      );
      slider().dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: 9,
          pointerType: "mouse",
          button: 0,
          clientX: 100,
        }),
      );
    });
    expect(capture).not.toHaveBeenCalled();
    expect(writes).not.toHaveBeenCalled();
  });
  it("leaves mobile wheel default scrolling and momentum to the browser", async () => {
    coarse();
    await render();
    const writes = vi.spyOn(slider(), "scrollLeft", "set");
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 40,
    });
    await act(async () => slider().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    expect(writes).not.toHaveBeenCalled();
    slider().scrollLeft = 440;
    await act(async () => slider().dispatchEvent(new Event("scroll")));
    await tick(20);
    expect(slider().getAttribute("aria-valuenow")).toBe("55");
  });
});
