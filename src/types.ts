import type { CSSProperties, ReactNode } from "react";

export type RulerOrientation = "horizontal" | "vertical";

export type TickAlignment = "top" | "bottom" | "left" | "right";

/** Velocity uses CSS pixels/ms, matching tactile-motion pixel-based controls. */
export interface RulerMotionOptions {
  /** Release velocity retained per 16⅔ms. [0, 1), default 0.9. */
  friction?: number;
  /** Release velocity multiplier. Default 1. */
  velocityMultiplier?: number;
  /** Release speed cap in CSS pixels/ms; also caps wheel input rate. Default 3. */
  maxVelocity?: number;
  /** Engine inertia rest speed in CSS pixels/ms. Default 0.01. */
  threshold?: number;
}

export type RulerValueSource = "drag" | "wheel" | "momentum" | "programmatic";

export interface TickStyle {
  width?: number;
  height?: number;
  color?: string;
  borderRadius?: number;
}

export interface TickInfo {
  value: number;
  index: number;
  isMajor: boolean;
  isLabel: boolean;
}

export interface LabelStyle {
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
}

export interface CursorStyle {
  width?: number;
  height?: number;
  color?: string;
  borderRadius?: number;
}

export interface RulerValueChangeMeta {
  source: RulerValueSource;
}

export interface RulerPickerProps {
  min: number;
  max: number;
  step?: number;

  value?: number;
  defaultValue?: number;

  majorStep?: number;
  labelStep?: number;
  tickSpacing?: number;

  minorTickStyle?: TickStyle;
  majorTickStyle?: TickStyle;
  getTickStyle?:
    ((info: TickInfo) => Partial<TickStyle> | undefined) | undefined;
  labelStyle?: LabelStyle;
  formatLabel?: (value: number) => string;

  cursorStyle?: CursorStyle;
  renderCursor?: () => ReactNode;

  showValue?: boolean;
  valueStyle?: CSSProperties;
  formatValue?: (value: number) => string;
  renderValue?: (value: number) => ReactNode;

  showEdgeMasks?: boolean;

  orientation?: RulerOrientation;
  tickAlignment?: TickAlignment;
  reverse?: boolean;
  /** Pointer and momentum-capable wheel physics. Native wheel fallback uses browser inertia. */
  motion?: RulerMotionOptions;
  /** Wheel pixel-to-tick sensitivity; nonnegative, default 1.8. Scales wheel distance. Native fallback scales its scroll range without applying engine rate limits. */
  wheelSensitivity?: number;
  /** Vertical track height in CSS pixels. Default: 240. */
  height?: number;

  disabled?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;

  onScrollStart?: () => void;
  onValueChange?: (value: number, meta: RulerValueChangeMeta) => void;
  onValueChangeEnd?: (value: number) => void;

  className?: string;
  style?: CSSProperties;
}

export interface RulerPickerRef {
  scrollToValue: (value: number, options?: { animated?: boolean }) => void;
  getValue: () => number;
}
