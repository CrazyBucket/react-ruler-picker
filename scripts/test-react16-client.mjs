// Copied into the isolated packed consumer by test-package.mjs.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Window } from "happy-dom";

const require = createRequire(import.meta.url);
const window = new Window();
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
});
Object.defineProperty(globalThis, "navigator", {
  value: window.navigator,
  configurable: true,
});
globalThis.requestAnimationFrame = window.requestAnimationFrame = (callback) =>
  setTimeout(() => callback(performance.now()), 16);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
// React 16 captures its own RAF scheduler at import time. Track component
// frames separately so scheduler housekeeping is not mistaken for a leak.
const React = require("react");
const ReactDOM = require("react-dom");
const { act } = require("react-dom/test-utils");
const frames = new Set();
globalThis.requestAnimationFrame = window.requestAnimationFrame = (callback) => {
  const id = setTimeout(() => {
    frames.delete(id);
    callback(performance.now());
  }, 16);
  frames.add(id);
  return id;
};
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
  frames.delete(id);
};
// Exercise the capability-enabled path; native scrolling has separate coverage.
Object.defineProperty(window.WheelEvent.prototype, "momentum", { get: () => false });
globalThis.WheelEvent = window.WheelEvent;
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(window.HTMLElement.prototype, "clientWidth", { get: () => 400 });
Object.defineProperty(window.HTMLElement.prototype, "clientHeight", { get: () => 240 });

const { RulerPicker } = await import("react-ruler-picker");
const host = document.createElement("div");
document.body.appendChild(host);
const ref = React.createRef();
let keyCalls = 0;
act(() => void ReactDOM.render(React.createElement(RulerPicker, {
  ref, min: 0, max: 100, defaultValue: 50, wheelSensitivity: 1,
  onKeyDown() { keyCalls++; },
}), host));
const slider = host.querySelector('[role="slider"]');
act(() => void slider.dispatchEvent(new window.WheelEvent("wheel", {
  deltaY: 16, bubbles: true, cancelable: true,
})));
assert.equal(ref.current.getValue(), 52);
act(() => void slider.dispatchEvent(new window.KeyboardEvent("keydown", {
  key: "ArrowRight", bubbles: true,
})));
assert.equal(ref.current.getValue(), 52);
assert.equal(keyCalls, 1);
act(() => ref.current.scrollToValue(80));
assert.equal(ref.current.getValue(), 80);
act(() => void slider.dispatchEvent(new window.WheelEvent("wheel", {
  deltaY: 8, bubbles: true, cancelable: true,
})));
act(() => void ReactDOM.unmountComponentAtNode(host));
assert.equal(frames.size, 0);
await new Promise((resolve) => setTimeout(resolve, 100));
assert.equal(frames.size, 0, "Wheel release must not schedule motion after unmount");
console.log(`React ${React.version}: packed mount, wheel, keyboard passthrough, ref and cleanup pass`);
// React 16's scheduler keeps a MessageChannel alive in the simulated DOM.
process.exit(0);
