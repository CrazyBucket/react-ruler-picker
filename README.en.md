# react-ruler-picker

English | [简体中文](README.md)

Numeric ruler picker component for React and TypeScript. It provides horizontal and vertical scales, integer or decimal steps, pointer and touch scrolling, keyboard input, controlled values, and canvas-rendered ticks.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)
[![npm downloads](https://img.shields.io/npm/dm/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)

[Live Demo](https://react-ruler-picker.vercel.app)

![react-ruler-picker preview](docs/assets/react-ruler-picker-preview.jpg)

- Choose values from configurable numeric ranges and step intervals.
- Support horizontal, vertical, and reversed ruler scales.
- Use pointer, mouse wheel, touch momentum, and keyboard input.
- Customize ticks, labels, selected value display, and the center indicator.
- Use controlled or uncontrolled values and imperative ref methods.
- Includes ESM, CommonJS, TypeScript declarations, and no runtime dependency other than React.

## Installation

```sh
npm install react-ruler-picker
```

Requires React 16.8 or later.

## Quick start

```tsx
import { useState } from "react";
import { RulerPicker } from "react-ruler-picker";

export function HeightField() {
  const [value, setValue] = useState(170);

  return (
    <RulerPicker
      min={80}
      max={220}
      value={value}
      onValueChange={setValue}
      aria-label="Height in centimeters"
      formatValue={(next) => `${next} cm`}
    />
  );
}
```

The component installs its styles when it first mounts; no stylesheet import is required. Use `orientation="vertical"` for a vertical ruler, and call `scrollToValue` / `getValue` through the ref for imperative control. Utility helpers `clampValueByStep`, `formatValueByStep`, and `getStepPrecision` are also exported.

## Props

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `min`, `max` | `number` | Required finite range bounds; reversed bounds are normalized. |
| `step` | `number` | `1`; minimum selectable increment. Invalid or nonpositive values use `1`. |
| `value` | `number` | Controlled selected value. |
| `defaultValue` | `number` | `min`; initial uncontrolled value. |
| `majorStep` | `number` | `step * 10`; interval between major ticks in value units. |
| `labelStep` | `number` | `majorStep` or `step * 10`; set to `0` to hide tick labels. |
| `tickSpacing` | `number` | `8`; spacing between ticks in CSS pixels; minimum `1`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'`; ruler axis. |
| `tickAlignment` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`; tick baseline alignment. |
| `reverse` | `boolean` | `false`; reverses the direction of increasing values. |
| `height` | `number` | `240`; vertical track height in CSS pixels. |
| `minorTickStyle`, `majorTickStyle` | `TickStyle` | Tick `width`, `height`, `color`, and `borderRadius`. |
| `getTickStyle` | `(info: TickInfo) => Partial<TickStyle> \| undefined` | Callback for per-tick styles. |
| `labelStyle` | `LabelStyle` | Tick-label font styles. |
| `formatLabel` | `(value: number) => string` | Tick-label formatter. |
| `cursorStyle` | `CursorStyle` | Center indicator `width`, `height`, `color`, and `borderRadius`. |
| `renderCursor` | `() => ReactNode` | Custom center indicator. |
| `showValue`, `showEdgeMasks` | `boolean` | `true`; toggles selected value display and edge fading masks. |
| `valueStyle` | `CSSProperties` | Styles for the value row. |
| `formatValue` | `(value: number) => string` | Formats the selected value and `aria-valuetext`. |
| `renderValue` | `(value: number) => ReactNode` | Custom selected-value content. |
| `platform` | `'auto' \| 'ios' \| 'android' \| 'harmony'` | `'auto'`; Android and Harmony use momentum scroll sampling. |
| `disabled` | `boolean` | `false`; disables interaction and cancels active momentum. |
| `onScrollStart` | `() => void` | Called once at the start of a user scroll session. |
| `onValueChange` | `(value, meta) => void` | Called when the value changes. `meta.source` is `drag`, `momentum`, `keyboard`, or `programmatic`. |
| `onValueChangeEnd` | `(value: number) => void` | Called once after scrolling settles on a step. |
| `aria-label` | `string` | Accessible name; defaults to `'Value'` without `aria-labelledby`. |
| `aria-labelledby`, `aria-describedby` | `string` | IDs for an accessible label and description. |
| `className`, `style` | `string`, `CSSProperties` | Root container class and inline styles. |

## Interaction

- Pointer, wheel, and touch momentum all drag to select; touch snaps to the nearest step after it stops.
- Keyboard: arrow keys move one step, Page Up / Down move ten steps, Home / End select the range boundaries.
- Smooth scrolling respects `prefers-reduced-motion`.

Selectable values follow `min + n * step` (for `min=0`, `max=10`, `step=3` the values are `0`, `3`, `6`, `9`). Non-finite range bounds and oversized scales throw `RangeError`.

## Development

```sh
npm install
npm run dev      # Start the playground dev server
npm test         # Run tests
npm run check    # Full verification (types, tests, build, package, size)
```

## License

[MIT](LICENSE)
