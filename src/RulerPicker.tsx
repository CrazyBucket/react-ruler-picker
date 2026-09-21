import React from "react";
import type { CSSProperties } from "react";
import { useRulerMotion } from "./internal/use-ruler-motion";
import { injectRulerStyles } from "./internal/styles";
import {
  clampValueByStep,
  getStepPrecision,
  getTotalSteps,
} from "./internal/value-by-step";
import type { RulerPickerProps, RulerPickerRef } from "./types";

// Keep the same external React import in ESM and CommonJS builds.
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
      throw new RangeError(
        "RulerPicker: min and max must be finite numbers.",
      );
    }
    if (
      props.wheelSensitivity !== undefined &&
      (!Number.isFinite(props.wheelSensitivity) || props.wheelSensitivity < 0)
    )
      throw new RangeError(
        "RulerPicker: wheelSensitivity must be finite and nonnegative.",
      );
    const min = Math.min(minProp, maxProp);
    const max = Math.max(minProp, maxProp);
    const step = Number.isFinite(stepProp) && stepProp > 0 ? stepProp : 1;
    const spacing = Number.isFinite(tickSpacing)
      ? Math.max(1, tickSpacing)
      : 8;
    const total = getTotalSteps(min, max, step);
    // Avoid unsafe coordinate arithmetic; no full-range DOM scroll surface is allocated.
    if (!Number.isSafeInteger(total) || !Number.isFinite(total * spacing))
      throw new RangeError(
        "RulerPicker: range / step exceeds safe numeric precision.",
      );
    const precision = Math.max(getStepPrecision(min), getStepPrecision(step));
    const vertical = orientation === "vertical";
    const isBottom = tickAlignment === "bottom" || tickAlignment === "right";
    const normalize = useCallback(
      (next: number) => clampValueByStep(next, step, min, max),
      [step, min, max],
    );
    const surfaceRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const paint = useRef(() => {});
    const [viewport, setViewport] = useState(0);
    const [dpr, setDpr] = useState(1);
    const majorEvery = Math.max(
      1,
      Math.round((majorStep ?? step * 10) / step),
    );
    const labelEvery = Math.max(
      0,
      Math.round((labelStep ?? majorStep ?? step * 10) / step),
    );
    const minor = {
      width: 1,
      height: 14,
      color: "#c9cdd3",
      ...minorTickStyle,
    };
    const major = {
      width: 1,
      height: 24,
      color: "#8d959f",
      ...majorTickStyle,
    };
    const fontSize = labelStyle?.fontSize ?? 11;
    const tickHeight = Math.max(minor.height, major.height);
    const crossSize =
      4 + tickHeight + 6 + Math.ceil(fontSize * (vertical ? 5 : 1.4)) + 4;
    const toPosition = useCallback(
      (next: number) => {
        const index = Math.round((normalize(next) - min) / step);
        return reverse ? total - index : index;
      },
      [normalize, min, step, reverse, total, spacing],
    );
    const fromPosition = useCallback(
      (position: number) => {
        const index = Math.min(total, Math.max(0, Math.round(position)));
        return Number(
          (min + (reverse ? total - index : index) * step).toFixed(precision),
        );
      },
      [min, step, total, spacing, reverse, precision],
    );
    const { display, getPosition, navigate, getValue, events } =
      useRulerMotion(
        {
          props,
          total,
          spacing,
          viewport,
          vertical,
          geometry: `${min}:${max}:${step}:${spacing}:${vertical}:${reverse}`,
          normalize,
          toPosition,
          fromPosition,
          paint: () => paint.current(),
        },
        surfaceRef,
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
      const position = getPosition() * spacing;
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
          const end = isBottom
            ? crossSize - 4 - tick.height
            : 4 + tick.height;
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
      getPosition,
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

    paint.current = draw;

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
    useImperativeHandle(
      ref,
      () => ({
        scrollToValue: (next, options) =>
          navigate(next, options?.animated ?? false),
        getValue,
      }),
      [navigate, getValue],
    );

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
            ref={surfaceRef}
            className="rrp-surface"
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
            {...events}
          />
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
