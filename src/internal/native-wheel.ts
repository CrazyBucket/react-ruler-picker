import { injectRulerStyles } from "./styles";

/** Native wheel backend. No velocity estimation, animation or release detection. */
export function attachNativeWheel(
  element: HTMLDivElement,
  options: {
    vertical: boolean;
    total: number;
    spacing: number;
    sensitivity: number;
    onStart(): void;
    onMove(position: number): void;
    onEnd(): void;
  },
) {
  // The initial offset must be written after overflow styling takes effect.
  injectRulerStyles();
  const { vertical, total, spacing, sensitivity } = options;
  // Keep the whole range reachable below browser scroll-dimension limits.
  const extent = Math.min(8_000_000, (total * spacing) / sensitivity);
  const unitsPerPixel = extent > 0 ? total / extent : 0;
  const spacer = document.createElement("div");
  spacer.setAttribute("aria-hidden", "true");
  spacer.className = "rrp-native-spacer";
  spacer.style.width = vertical ? "1px" : `calc(100% + ${extent}px)`;
  spacer.style.height = vertical ? `calc(100% + ${extent}px)` : "1px";
  element.appendChild(spacer);
  element.classList.add("rrp-native-wheel");
  const read = () => (vertical ? element.scrollTop : element.scrollLeft);
  const write = (offset: number) => {
    if (vertical) element.scrollTop = offset;
    else element.scrollLeft = offset;
  };
  let previous = read();
  let active = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const hasScrollEnd = "onscrollend" in element;
  const end = () => {
    clearTimeout(timer);
    if (!active) return;
    active = false;
    options.onEnd();
  };
  const scroll = () => {
    const offset = read();
    if (offset === previous) return;
    previous = offset;
    if (!active) {
      active = true;
      options.onStart();
    }
    options.onMove(offset * unitsPerPixel);
    // Older browsers need a notification fallback. It never launches motion.
    if (!hasScrollEnd) {
      clearTimeout(timer);
      timer = setTimeout(end, 150);
    }
  };
  const wheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    // Native horizontal deltas and vertical rulers retain their default action.
    // Ordinary vertical mouse wheels need only an axis mapping for a horizontal ruler.
    if (!vertical && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientWidth
            : 1;
      write(read() + event.deltaY * unit);
    }
  };
  element.addEventListener("wheel", wheel, { passive: false });
  element.addEventListener("scroll", scroll, { passive: true });
  element.addEventListener("scrollend", end);
  return {
    getPosition: () => read() * unitsPerPixel,
    cancel() {
      clearTimeout(timer);
      active = false;
    },
    sync(position: number) {
      const offset = unitsPerPixel ? position / unitsPerPixel : 0;
      if (Math.abs(read() - offset) > 0.5) write(offset);
      previous = read();
    },
    destroy() {
      clearTimeout(timer);
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("scroll", scroll);
      element.removeEventListener("scrollend", end);
      spacer.remove();
      element.classList.remove("rrp-native-wheel");
    },
  };
}
