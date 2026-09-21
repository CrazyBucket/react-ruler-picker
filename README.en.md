# react-ruler-picker

English | [简体中文](README.md)

Numeric ruler picker for React with canvas-rendered ticks, pointer and wheel input, touch momentum, and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)
[![npm downloads](https://img.shields.io/npm/dm/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)

[Live Demo](https://react-ruler-picker.vercel.app)

![react-ruler-picker preview](docs/assets/react-ruler-picker-preview.jpg)

- Configurable numeric ranges, step sizes, orientations, and tick styles.
- Controlled and uncontrolled values with pointer dragging, mouse wheel, and touch momentum.
- Elastic edge bounce, accessibility attributes, `prefers-reduced-motion`, and TypeScript support.
- ESM, CommonJS, and TypeScript declarations included.

## Installation

```sh
npm install react-ruler-picker
```

Requires React 16.8 or later.

## Quick Start

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

Base styles are injected automatically on mount; no CSS import is required. Use `orientation="vertical"` for a vertical ruler, and access `scrollToValue` and `getValue` through a ref.

## Props

| Prop | Type | Default / Behavior |
| --- | --- | --- |
| `min`, `max` | `number` | Required finite bounds; automatically normalized if passed in reverse. |
| `step` | `number` | `1`; minimum selectable increment. Invalid or nonpositive values use `1`. |
| `value` | `number` | Controlled selected value. |
| `defaultValue` | `number` | `min`; initial uncontrolled value. |
| `majorStep` | `number` | `step * 10`; major tick interval. |
| `labelStep` | `number` | `majorStep` or `step * 10`; set to `0` to hide tick labels. |
| `tickSpacing` | `number` | `8`; distance between ticks in CSS pixels; minimum `1`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'`; ruler orientation. |
| `tickAlignment` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`; tick alignment. |
| `reverse` | `boolean` | `false`; reverses the numeric progression direction. |
| `height` | `number` | `240`; vertical ruler height in CSS pixels. |
| `minorTickStyle`, `majorTickStyle` | `TickStyle` | `width`, `height`, `color`, and `borderRadius` for ticks. |
| `getTickStyle` | `(info: TickInfo) => Partial<TickStyle> \| undefined` | Per-tick style callback. |
| `labelStyle` | `LabelStyle` | Tick-label font styles. |
| `formatLabel` | `(value: number) => string` | Tick-label formatter. |
| `cursorStyle` | `CursorStyle` | Center cursor styles. |
| `renderCursor` | `() => ReactNode` | Custom center cursor. |
| `showValue`, `showEdgeMasks` | `boolean` | `true`; toggles value display and edge masks. |
| `valueStyle` | `CSSProperties` | Value display styles. |
| `formatValue` | `(value: number) => string` | Formatter for the selected value and `aria-valuetext`. |
| `renderValue` | `(value: number) => ReactNode` | Custom selected-value content. |
| `motion` | `RulerMotionOptions` | Drag and momentum options; see below. |
| `wheelSensitivity` | `number` | `1.8`; wheel sensitivity. Set to `0` to disable wheel input. |
| `disabled` | `boolean` | `false`; disables interaction. |
| `onScrollStart` | `() => void` | Called once when a user scroll session begins. |
| `onValueChange` | `(value, meta) => void` | Called on value changes; `meta.source` is `drag`, `wheel`, `momentum`, or `programmatic`. |
| `onValueChangeEnd` | `(value: number) => void` | Called when motion stops and settles on a step. |
| `aria-label` | `string` | Accessible name. |
| `aria-labelledby`, `aria-describedby` | `string` | Element IDs for the accessible label and description. |
| `className`, `style` | `string`, `CSSProperties` | Root class name and inline styles. |

## Momentum and Wheel Input

```tsx
<RulerPicker
  min={0}
  max={1000}
  motion={{
    friction: 0.9,
    velocityMultiplier: 1,
    maxVelocity: 3,
    threshold: 0.01,
  }}
  wheelSensitivity={1.8}
/>
```

| Option | Default | Description |
| --- | --- | --- |
| `friction` | `0.9` | Inertia velocity retention in `[0, 1)`; `0` disables inertia. |
| `velocityMultiplier` | `1` | Release velocity multiplier. |
| `maxVelocity` | `3` | Maximum release velocity in CSS pixels/ms. |
| `threshold` | `0.01` | Inertia rest threshold in CSS pixels/ms. |

The component follows the system `prefers-reduced-motion` preference. Horizontal rulers support regular mouse wheels and trackpads; use `meta.source` in `onValueChange` to distinguish drag, wheel, momentum, and programmatic changes.

## Development

```sh
npm ci
npm run dev           # Start the playground
npm test              # Run unit tests
npm run check         # Run type, test, build, and package checks
npm run test:react16  # Verify React 16.8 compatibility
```

## License

[MIT](LICENSE)
