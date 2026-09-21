// @vitest-environment happy-dom
import { act, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RulerPicker } from "../src";
import type { RulerPickerProps, RulerPickerRef } from "../src";
let root: Root;
let host: HTMLDivElement;
const surface = () =>
  host.querySelector('[role="slider"]') as HTMLDivElement;
const scroll = async (offset: number, vertical = false) => {
  await act(async () => {
    if (vertical) surface().scrollTop = offset;
    else surface().scrollLeft = offset;
    surface().dispatchEvent(new Event("scroll"));
  });
};
const endScroll = async () => {
  await act(async () => surface().dispatchEvent(new Event("scrollend")));
};
const render = async (
  props: Partial<RulerPickerProps> = {},
  ref = createRef<RulerPickerRef>(),
) => {
  await act(async () =>
    root.render(
      <RulerPicker
        ref={ref}
        min={0}
        max={100}
        defaultValue={50}
        wheelSensitivity={1}
        {...props}
      />,
    ),
  );
  return ref;
};
beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    null,
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
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
it.each([false, true])(
  "reads actual native scrolling and settles without engine inertia (vertical=%s)",
  async (vertical) => {
    const change = vi.fn(),
      end = vi.fn();
    const ref = await render({
      orientation: vertical ? "vertical" : "horizontal",
      onValueChange: change,
      onValueChangeEnd: end,
    });
    expect(surface().classList.contains("rrp-native-wheel")).toBe(true);
    expect(surface().querySelector(".rrp-native-spacer")).not.toBeNull();
    expect(vertical ? surface().scrollTop : surface().scrollLeft).toBe(
      400,
    );
    await scroll(416, vertical);
    expect(ref.current!.getValue()).toBe(52);
    expect(change).toHaveBeenLastCalledWith(52, { source: "wheel" });
    await endScroll();
    const count = change.mock.calls.length;
    await act(async () => vi.advanceTimersByTime(2000));
    expect(change).toHaveBeenCalledTimes(count);
    expect(end).toHaveBeenCalledExactlyOnceWith(52);
  },
);
it("leaves native-axis wheel default action and ctrl zoom untouched", async () => {
  await render();
  for (const init of [{ deltaX: 16 }, { deltaY: 16, ctrlKey: true }]) {
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ...init,
    });
    Object.defineProperty(event, "ctrlKey", {
      value: init.ctrlKey ?? false,
    });
    surface().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  }
});
it("maps vertical mouse deltas to the native horizontal offset without moving the engine directly", async () => {
  const ref = await render();
  const event = new WheelEvent("wheel", {
    deltaY: 16,
    bubbles: true,
    cancelable: true,
  });
  surface().dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(surface().scrollLeft).toBe(416);
  // happy-dom does not implement layout scrolling: the browser scroll event is explicit here.
  expect(ref.current!.getValue()).toBe(50);
  await scroll(416);
  expect(ref.current!.getValue()).toBe(52);
});
it("handles native overscroll without custom bounce or an outward lock", async () => {
  const ref = await render({ defaultValue: 100 });
  await scroll(840);
  expect(ref.current!.getValue()).toBe(100);
  // Do not write a clamped offset back while the browser owns overscroll.
  expect(surface().scrollLeft).toBe(840);
  await scroll(800);
  await endScroll();
  await scroll(824);
  expect(surface().scrollLeft).toBe(824);
  await scroll(792);
  expect(ref.current!.getValue()).toBe(99);
});
it("preserves controlled feedback and syncs an external value/ref change", async () => {
  const ref = createRef<RulerPickerRef>();
  function App() {
    const [value, setValue] = useState(50);
    return (
      <RulerPicker
        ref={ref}
        min={0}
        max={100}
        value={value}
        wheelSensitivity={1}
        onValueChange={setValue}
      />
    );
  }
  await act(async () => root.render(<App />));
  await scroll(420);
  expect(surface().scrollLeft).toBe(420);
  await render({ value: 20 }, ref);
  expect(surface().scrollLeft).toBe(160);
  await render({}, ref);
  await act(async () => ref.current!.scrollToValue(80));
  expect(surface().scrollLeft).toBe(640);
});
it("supports reverse, gain, large ranges and disabled cleanup", async () => {
  const ref = await render({ reverse: true, wheelSensitivity: 2 });
  expect(surface().scrollLeft).toBe(200);
  await scroll(240);
  expect(ref.current!.getValue()).toBe(40);
  await render({ max: 1e9, defaultValue: 50 }, ref);
  const spacer = surface().querySelector(
    ".rrp-native-spacer",
  ) as HTMLElement;
  expect(spacer.style.width).toContain("8000000px");
  await scroll(8_000_000);
  expect(ref.current!.getValue()).toBe(1e9);
  await render({ disabled: true }, ref);
  expect(surface().classList.contains("rrp-native-wheel")).toBe(false);
  expect(surface().querySelector(".rrp-native-spacer")).toBeNull();
});

it("does not let a stale native scrollend settle a new ref animation", async () => {
  const end = vi.fn();
  const ref = await render({ onValueChangeEnd: end });
  await scroll(416);
  await act(async () => ref.current!.scrollToValue(80, { animated: true }));
  await endScroll();
  expect(end).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTime(400));
  expect(end).toHaveBeenCalledExactlyOnceWith(80);
});
