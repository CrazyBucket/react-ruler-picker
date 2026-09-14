import type { CSSProperties, ReactNode } from "react";

export type RulerOrientation = "horizontal" | "vertical";

export type TickAlignment = "top" | "bottom" | "left" | "right";

export type RulerPlatform = "auto" | "ios" | "android" | "harmony";

export type RulerValueSource =
  | "drag"
  | "momentum"
  | "programmatic"
  | "keyboard";

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
  getTickStyle?: ((info: TickInfo) => Partial<TickStyle> | undefined) | undefined;
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
  /** Android/Harmony enable frame sampling for WebViews that skip momentum scroll events. */
  platform?: RulerPlatform;
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
