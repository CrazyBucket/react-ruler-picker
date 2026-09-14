import React from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  TouchEvent,
} from "react";
import {
  needsSnapPatch,
  prefersNativeScroll,
  resolvePlatform,
} from "./internal/platform";
import { injectRulerStyles } from "./internal/styles";
import {
  clampValueByStep,
  getStepPrecision,
  getTotalSteps,
} from "./internal/value-by-step";
import type {
  RulerPickerProps,
  RulerPickerRef,
  RulerValueSource,
} from "./types";

// React 16.8's CommonJS entry does not expose every hook as a Node ESM named export.
const {
  createElement,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} = React;

const RulerPickerInner = forwardRef<RulerPickerRef, RulerPickerProps>(
  (props, ref) => {
    const {
      min: minProp,
      max: maxProp,
      step: stepProp = 1,
      value,
      defaultValue = minProp,
      majorStep,
      labelStep,
      tickSpacing = 8,
      minorTickStyle,
      majorTickStyle,
      getTickStyle,
      labelStyle,
      formatLabel,
      cursorStyle,
      renderCursor,
      showValue = true,
      valueStyle,
      formatValue,
      renderValue,
      showEdgeMasks = true,
      orientation = "horizontal",
      tickAlignment = "top",
      reverse = false,
      height = 240,
      disabled = false,
      className = "",
      style,
    } = props;
    if (!Number.isFinite(minProp) || !Number.isFinite(maxProp)) {
      throw new RangeError("RulerPicker: min and max must be finite numbers.");
    }
    const min = Math.min(minProp, maxProp);
    const max = Math.max(minProp, maxProp);
    const step = Number.isFinite(stepProp) && stepProp > 0 ? stepProp : 1;
    const spacing = Number.isFinite(tickSpacing) ? Math.max(1, tickSpacing) : 8;
    const total = getTotalSteps(min, max, step);
    // Browsers cap scrollable dimensions. Fail explicitly instead of silently truncating the range.
    if (total * spacing > 8_000_000)
      throw new RangeError(
        "RulerPicker: range × tickSpacing exceeds 8,000,000 pixels. Increase step or reduce tickSpacing.",
      );
    const precision = Math.max(getStepPrecision(min), getStepPrecision(step));
    const vertical = orientation === "vertical";
    const isBottom = tickAlignment === "bottom" || tickAlignment === "right";
    const sampleMomentum = needsSnapPatch(
      resolvePlatform(props.platform ?? "auto"),
    );
    const normalize = useCallback(
      (next: number) => clampValueByStep(next, step, min, max),
      [step, min, max],
    );
    const [internalValue, setInternalValue] = useState(() =>
      normalize(defaultValue),
    );
    const selected = normalize(value ?? internalValue);
    const [display, setDisplay] = useState(selected);
    const current = useRef(selected);
    const pendingValues = useRef<number[]>([]);
    const latest = useRef(props);
    latest.current = props;
    const scrollRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const frame = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const active = useRef(false);
    const inputAllowed = useRef(false);
    const lastPaint = useRef(-1);
    const geometry = useRef("");
    const programmatic = useRef(false);
    const pointer = useRef<{
      id: number;
      start: number;
      offset: number;
      scale: number;
    } | null>(null);
    const touching = useRef(false);
    const nativePointerDown = useRef(false);
    const [viewport, setViewport] = useState(0);
    const [dpr, setDpr] = useState(1);
    const majorEvery = Math.max(1, Math.round((majorStep ?? step * 10) / step));
    const labelEvery = Math.max(
      0,
      Math.round((labelStep ?? majorStep ?? step * 10) / step),
    );
    const minor = { width: 1, height: 14, color: "#c9cdd3", ...minorTickStyle };
    const major = { width: 1, height: 24, color: "#8d959f", ...majorTickStyle };
    const fontSize = labelStyle?.fontSize ?? 11;
    const tickHeight = Math.max(minor.height, major.height);
    const crossSize =
      4 + tickHeight + 6 + Math.ceil(fontSize * (vertical ? 5 : 1.4)) + 4;
    const offset = useCallback(() => {
      const el = scrollRef.current;
      return (vertical ? el?.scrollTop : el?.scrollLeft) ?? 0;
    }, [vertical]);
    const toOffset = useCallback(
      (next: number) => {
        const index = Math.round((normalize(next) - min) / step);
        return (reverse ? total - index : index) * spacing;
      },
      [normalize, min, step, reverse, total, spacing],
    );
    const fromOffset = useCallback(
      (position: number) => {
        const index = Math.min(
          total,
          Math.max(0, Math.round(position / spacing)),
        );
        return Number(
          (min + (reverse ? total - index : index) * step).toFixed(precision),
        );
      },
      [min, step, total, spacing, reverse, precision],
    );
    const setPosition = useCallback(
      (position: number, animated = false) => {
        const el = scrollRef.current;
        if (!el) return;
        if ((vertical ? el.scrollTop : el.scrollLeft) === position) return;
        if (
          animated &&
          !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ) {
          el.scrollTo({
            [vertical ? "top" : "left"]: position,
            behavior: "smooth",
          });
        } else if (vertical) el.scrollTop = position;
        else el.scrollLeft = position;
      },
      [vertical],
    );
    const updateDisplay = useCallback((next: number) => {
      current.current = next;
      setDisplay(next);
    }, []);
    const emit = useCallback(
      (next: number, source: RulerValueSource) => {
        if (next === current.current) return;
        pendingValues.current.push(next);
        updateDisplay(next);
        if (latest.current.value === undefined) setInternalValue(next);
        latest.current.onValueChange?.(next, { source });
      },
      [updateDisplay],
    );

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !viewport) return;
      const width = vertical ? crossSize : viewport;
      const canvasHeight = vertical ? viewport : crossSize;
      if (
        canvas!.width !== Math.round(width * dpr) ||
        canvas!.height !== Math.round(canvasHeight * dpr)
      ) {
        canvas!.width = Math.round(width * dpr);
        canvas!.height = Math.round(canvasHeight * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, canvasHeight);
      const position = offset();
      const first = Math.max(
        0,
        Math.floor((position - viewport / 2) / spacing) - 2,
      );
      const last = Math.min(
        total,
        Math.ceil((position + viewport / 2) / spacing) + 2,
      );
      ctx.font = `${labelStyle?.fontWeight ?? 400} ${fontSize}px ${labelStyle?.fontFamily ?? "system-ui, sans-serif"}`;
      ctx.textAlign = vertical ? (isBottom ? "right" : "left") : "center";
      ctx.textBaseline = vertical ? "middle" : isBottom ? "bottom" : "top";
      if (!getTickStyle) {
        for (const isMajor of [false, true]) {
          const tick = isMajor ? major : minor;
          ctx.beginPath();
          ctx.strokeStyle = tick.color;
          ctx.lineWidth = tick.width;
          ctx.lineCap = tick.borderRadius ? "round" : "butt";
          for (let i = first; i <= last; i++) {
            const logical = reverse ? total - i : i;
            if ((logical % majorEvery === 0) !== isMajor) continue;
            const axis = viewport / 2 + i * spacing - position;
            const start = isBottom ? crossSize - 4 : 4;
            const end = isBottom
              ? crossSize - 4 - tick.height
              : 4 + tick.height;
            ctx.moveTo(vertical ? start : axis, vertical ? axis : start);
            ctx.lineTo(vertical ? end : axis, vertical ? axis : end);
          }
          ctx.stroke();
        }
      } else {
        for (let i = first; i <= last; i++) {
          const logical = reverse ? total - i : i;
          const isMajor = logical % majorEvery === 0;
          const tickValue = Number((min + logical * step).toFixed(precision));
          const isLabel = labelEvery > 0 && logical % labelEvery === 0;
          const custom = getTickStyle({
            value: tickValue,
            index: logical,
            isMajor,
            isLabel,
          });
          const base = isMajor ? major : minor;
          const tick = custom ? { ...base, ...custom } : base;
          const axis = viewport / 2 + i * spacing - position;
          const start = isBottom ? crossSize - 4 : 4;
          const end = isBottom ? crossSize - 4 - tick.height : 4 + tick.height;
          ctx.beginPath();
          ctx.strokeStyle = tick.color;
          ctx.lineWidth = tick.width;
          ctx.lineCap = tick.borderRadius ? "round" : "butt";
          ctx.moveTo(vertical ? start : axis, vertical ? axis : start);
          ctx.lineTo(vertical ? end : axis, vertical ? axis : end);
          ctx.stroke();
        }
      }
      ctx.fillStyle = labelStyle?.color ?? "#79828d";
      const textOffset = isBottom
        ? crossSize - tickHeight - 10
        : tickHeight + 10;
      if (labelEvery > 0)
        for (let i = first; i <= last; i++) {
          const logical = reverse ? total - i : i;
          if (logical % labelEvery !== 0) continue;
          const tickValue = Number((min + logical * step).toFixed(precision));
          const text = formatLabel
            ? formatLabel(tickValue)
            : tickValue.toFixed(precision);
          const axis = viewport / 2 + i * spacing - position;
          ctx.fillText(
            text,
            vertical ? textOffset : axis,
            vertical ? axis : textOffset,
          );
        }
    }, [
      viewport,
      crossSize,
      vertical,
      isBottom,
      dpr,
      offset,
      spacing,
      total,
      reverse,
      min,
      step,
      precision,
      majorEvery,
      labelEvery,
      fontSize,
      labelStyle?.fontWeight,
      labelStyle?.fontFamily,
      labelStyle?.color,
      minor.width,
      minor.height,
      minor.color,
      minor.borderRadius,
      major.width,
      major.height,
      major.color,
      major.borderRadius,
      tickHeight,
      formatLabel,
      getTickStyle,
    ]);

    const finish = useCallback(() => {
      clearTimeout(timer.current);
      if (touching.current || nativePointerDown.current || pointer.current)
        return;
      if (!active.current) {
        inputAllowed.current = false;
        return;
      }
      if (!programmatic.current) emit(fromOffset(offset()), "momentum");
      setPosition(toOffset(current.current));
      active.current = false;
      pendingValues.current.length = 0;
      inputAllowed.current = false;
      programmatic.current = false;
      latest.current.onValueChangeEnd?.(current.current);
      // A controlled parent may reject the proposed value.
      if (latest.current.value !== undefined) {
        updateDisplay(normalize(latest.current.value));
        setPosition(toOffset(normalize(latest.current.value)));
      }
      draw();
    }, [
      draw,
      emit,
      fromOffset,
      normalize,
      offset,
      setPosition,
      toOffset,
      updateDisplay,
    ]);
    const scheduleFinish = useCallback(
      function schedule() {
        clearTimeout(timer.current);
        const position = offset();
        timer.current = setTimeout(
          () => {
            // Timers can run before RAF/scroll callbacks in mobile browsers. A changed
            // offset means native momentum is still moving; never snap it mid-flight.
            if (Math.abs(offset() - position) > 0.01) {
              schedule();
              return;
            }
            finish();
          },
          sampleMomentum ? 180 : 160,
        );
      },
      [finish, offset, sampleMomentum],
    );
    const start = useCallback(() => {
      if (!active.current) {
        active.current = true;
        latest.current.onScrollStart?.();
      }
    }, []);
    const handleScroll = useCallback(() => {
      if (
        latest.current.disabled ||
        (!inputAllowed.current && !programmatic.current)
      ) {
        setPosition(toOffset(current.current));
        return;
      }
      const paint = () => {
        frame.current = 0;
        if (
          latest.current.disabled ||
          (!inputAllowed.current && !programmatic.current)
        )
          return;
        const position = offset();
        if (position !== lastPaint.current) {
          lastPaint.current = position;
          if (
            !programmatic.current &&
            Math.abs(position - toOffset(current.current)) > 0.01
          )
            start();
          draw();
          if (!programmatic.current && active.current)
            emit(
              fromOffset(position),
              pointer.current || touching.current || nativePointerDown.current
                ? "drag"
                : "momentum",
            );
          if (active.current) scheduleFinish();
        }
        // Some Android/Harmony WebViews skip scroll events during fast momentum.
        // Reuse the same frame loop; redraw only when the offset actually changes.
        if (
          sampleMomentum &&
          (active.current || touching.current || nativePointerDown.current) &&
          !latest.current.disabled
        ) {
          frame.current = requestAnimationFrame(paint);
        }
      };
      if (!frame.current) frame.current = requestAnimationFrame(paint);
      if (active.current) scheduleFinish();
    }, [
      draw,
      emit,
      fromOffset,
      offset,
      sampleMomentum,
      scheduleFinish,
      setPosition,
      start,
      toOffset,
    ]);
    const moveTo = useCallback(
      (next: number, animated: boolean, source: RulerValueSource) => {
        if (latest.current.disabled) return;
        const target = normalize(next);
        if (
          target === current.current &&
          Math.abs(offset() - toOffset(target)) < 0.5
        )
          return;
        clearTimeout(timer.current);
        active.current = true;
        programmatic.current = true;
        emit(target, source);
        setPosition(toOffset(target), animated);
        draw();
        scheduleFinish();
      },
      [draw, emit, normalize, offset, scheduleFinish, setPosition, toOffset],
    );

    useEffect(() => {
      injectRulerStyles();
    }, []);
    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const measure = () => {
        setViewport(vertical ? el.clientHeight : el.clientWidth);
        setDpr(window.devicePixelRatio || 1);
      };
      measure();
      const observer =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(measure)
          : null;
      observer?.observe(el);
      window.addEventListener("resize", measure);
      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, [vertical]);
    useEffect(() => {
      draw();
    }, [draw]);
    useEffect(() => {
      // A parent commit/effect can trail newer RAF samples. Recognize earlier
      // emitted values too, so delayed feedback never rewinds native momentum.
      const key = `${min}:${max}:${step}:${spacing}:${vertical}:${reverse}:${viewport}`;
      const changed = geometry.current !== key;
      geometry.current = key;
      const feedback = pendingValues.current.indexOf(selected);
      if (feedback !== -1) pendingValues.current.splice(0, feedback + 1);
      if (
        !changed &&
        active.current &&
        (feedback !== -1 || selected === current.current)
      )
        return;
      pendingValues.current.length = 0;
      clearTimeout(timer.current);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      pointer.current = null;
      touching.current = false;
      nativePointerDown.current = false;
      inputAllowed.current = false;
      active.current = false;
      programmatic.current = false;
      updateDisplay(selected);
      setPosition(toOffset(selected));
      draw();
      // draw changes for cosmetic props; alignment only depends on value and geometry.
    }, [
      selected,
      toOffset,
      viewport,
      setPosition,
      updateDisplay,
      min,
      max,
      step,
      spacing,
      vertical,
      reverse,
    ]);
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const wheel = (event: WheelEvent) => {
        if (latest.current.disabled || event.ctrlKey) return;
        if (prefersNativeScroll()) {
          // Observe the browser's wheel stream without preventDefault or scroll
          // writes. Manual pixel conversion would discard native inertia.
          programmatic.current = false;
          inputAllowed.current = true;
          start();
          handleScroll();
          return;
        }
        const delta =
          (vertical ? event.deltaY : event.deltaX || event.deltaY) *
          (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport : 1);
        const next = Math.min(total * spacing, Math.max(0, offset() + delta));
        if (next === offset()) return;
        event.preventDefault();
        programmatic.current = false;
        inputAllowed.current = true;
        start();
        setPosition(next);
        handleScroll();
      };
      el.addEventListener("wheel", wheel, { passive: false });
      return () => el.removeEventListener("wheel", wheel);
    }, [
      vertical,
      viewport,
      total,
      spacing,
      offset,
      start,
      setPosition,
      handleScroll,
    ]);
    useEffect(() => {
      if (!disabled) return;
      pendingValues.current.length = 0;
      pointer.current = null;
      touching.current = false;
      nativePointerDown.current = false;
      active.current = false;
      inputAllowed.current = false;
      programmatic.current = false;
      clearTimeout(timer.current);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      setPosition(toOffset(current.current));
    }, [disabled, setPosition, toOffset]);
    useEffect(
      () => () => {
        clearTimeout(timer.current);
        cancelAnimationFrame(frame.current);
      },
      [],
    );
    useImperativeHandle(
      ref,
      () => ({
        scrollToValue: (next, options) =>
          moveTo(next, options?.animated ?? false, "programmatic"),
        getValue: () => current.current,
      }),
      [moveTo],
    );

    const keyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      let next: number;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = current.current + step;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = current.current - step;
          break;
        case "PageUp":
          next = current.current + step * 10;
          break;
        case "PageDown":
          next = current.current - step * 10;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      event.preventDefault();
      moveTo(next, false, "keyboard");
    };
    const beginNativeTouch = () => {
      if (disabled) return;
      inputAllowed.current = true;
      programmatic.current = false;
      clearTimeout(timer.current);
      handleScroll();
    };
    const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Native touch pointers must authorize scrolling too: touchstart is not
      // guaranteed to accompany pointerdown in every browser/event integration.
      if (
        prefersNativeScroll() ||
        (event.pointerType !== "mouse" && event.pointerType !== "pen")
      ) {
        nativePointerDown.current = true;
        beginNativeTouch();
        return;
      }
      if (event.button !== 0) return;
      event.currentTarget.focus({ preventScroll: true });
      event.currentTarget.setPointerCapture(event.pointerId);
      programmatic.current = false;
      inputAllowed.current = true;
      const rect = event.currentTarget.getBoundingClientRect();
      const scale =
        (vertical
          ? rect.height / event.currentTarget.clientHeight
          : rect.width / event.currentTarget.clientWidth) || 1;
      pointer.current = {
        id: event.pointerId,
        start: vertical ? event.clientY : event.clientX,
        offset: offset(),
        scale,
      };
      clearTimeout(timer.current);
    };
    const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
      const drag = pointer.current;
      if (!drag || drag.id !== event.pointerId) return;
      const delta =
        (drag.start - (vertical ? event.clientY : event.clientX)) / drag.scale;
      if (Math.abs(delta) < 2) return;
      start();
      setPosition(Math.max(0, Math.min(total * spacing, drag.offset + delta)));
      handleScroll();
    };
    const pointerEnd = () => {
      // pointercancel hands a pan to the browser; keep its scroll authorization
      // and sampling alive until momentum actually settles. touchend, if present,
      // remains responsible for clearing the separate Touch Events hold state.
      nativePointerDown.current = false;
      pointer.current = null;
      scheduleFinish();
    };
    const touchStart = (event: TouchEvent<HTMLDivElement>) => {
      // Also used on move: recover a missed start or a layout reset, and keep
      // nested sheets from stealing the gesture, as in HealthScaleRuler.
      event.stopPropagation();
      if (disabled) return;
      touching.current = true;
      beginNativeTouch();
    };
    const touchEnd = (event: TouchEvent<HTMLDivElement>) => {
      event.stopPropagation();
      touching.current = false;
      nativePointerDown.current = false;
      scheduleFinish();
    };
    const text = formatValue
      ? formatValue(display)
      : display.toFixed(precision);
    const cursorWidth = cursorStyle?.width ?? 2;
    const cursorHeight = cursorStyle?.height ?? tickHeight + 4;
    const valueSide = isBottom ? "left" : "right";
    const verticalValueStyle: CSSProperties | undefined = vertical
      ? {
          [valueSide === "right" ? "left" : "right"]:
            `calc(50% + ${Math.ceil(crossSize / 2) + 16}px)`,
          ...valueStyle,
        }
      : valueStyle;
    return (
      <div
        className={`rrp-root${vertical ? " rrp-root--vertical" : ""}${disabled ? " rrp-root--disabled" : ""} ${className}`.trim()}
        style={style}
      >
        {!vertical && showValue && (
          <div className="rrp-value" style={valueStyle}>
            {renderValue ? renderValue(display) : text}
          </div>
        )}
        <div
          className="rrp-track"
          ref={trackRef}
          style={
            vertical ? { height, width: crossSize } : { height: crossSize }
          }
        >
          <div
            ref={scrollRef}
            className="rrp-scroll"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={
              props["aria-label"] ??
              (props["aria-labelledby"] ? undefined : "Value")
            }
            aria-labelledby={props["aria-labelledby"]}
            aria-describedby={props["aria-describedby"]}
            aria-orientation={orientation}
            aria-valuemin={min}
            aria-valuemax={normalize(max)}
            aria-valuenow={display}
            aria-valuetext={text}
            aria-disabled={disabled}
            onKeyDown={keyDown}
            onScroll={handleScroll}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerEnd}
            onPointerCancel={pointerEnd}
            onLostPointerCapture={pointerEnd}
            onTouchStart={touchStart}
            onTouchMove={touchStart}
            onTouchEnd={touchEnd}
            onTouchCancel={touchEnd}
          >
            <div
              className="rrp-content"
              aria-hidden="true"
              style={
                vertical
                  ? { height: total * spacing + viewport, width: 1 }
                  : { width: total * spacing + viewport, height: crossSize }
              }
            />
          </div>
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`rrp-canvas${showEdgeMasks ? " rrp-canvas--masked" : ""}`}
            style={{
              width: vertical ? crossSize : "100%",
              height: vertical ? "100%" : crossSize,
            }}
          />
          <div
            className={`rrp-cursor${isBottom ? " rrp-cursor--bottom" : ""}`}
            aria-hidden="true"
            style={
              renderCursor
                ? undefined
                : {
                    width: vertical ? cursorHeight : cursorWidth,
                    height: vertical ? cursorWidth : cursorHeight,
                    background: cursorStyle?.color ?? "#0a77f5",
                    borderRadius: cursorStyle?.borderRadius ?? 2,
                    ...(isBottom
                      ? vertical
                        ? { left: "auto", right: 4 }
                        : { top: "auto", bottom: 4 }
                      : undefined),
                  }
            }
          >
            {renderCursor?.()}
          </div>
        </div>
        {vertical && showValue && (
          <div
            className={`rrp-value rrp-value--${valueSide}`}
            style={verticalValueStyle}
          >
            {renderValue ? renderValue(display) : text}
          </div>
        )}
      </div>
    );
  },
);
RulerPickerInner.displayName = "RulerPicker";
export const RulerPicker = memo(RulerPickerInner);
