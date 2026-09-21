# react-ruler-picker

English | [简体中文](README.md)

Numeric ruler picker for React with canvas-rendered ticks, touch momentum, elastic edges, and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)
[![npm downloads](https://img.shields.io/npm/dm/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)

[Live Demo](https://react-ruler-picker.vercel.app)

![react-ruler-picker preview](docs/assets/react-ruler-picker-preview.jpg)

- Select values from configurable numeric ranges and step intervals.
- Supports horizontal, vertical, and reversed ruler scales.
- Smooth pointer dragging, mouse wheel, touch momentum scrolling, and elastic edge bounce.
- Customizable ticks, labels, selected value indicator, and center cursor.
- Controlled and uncontrolled modes, with imperative ref methods.
- Ships with ESM, CommonJS, and TypeScript declarations.

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

Base styles are injected automatically on mount; no CSS imports required. Use `orientation="vertical"` for vertical mode, and access imperative actions (`scrollToValue`, `getValue`) via ref. Helper functions `clampValueByStep`, `formatValueByStep`, and `getStepPrecision` are also exported.

## Props

| Prop | Type | Default / Behavior |
| --- | --- | --- |
| `min`, `max` | `number` | Required finite bounds; automatically normalized if passed in reverse. |
| `step` | `number` | `1`; minimum selectable increment. Falls back to `1` for nonpositive or invalid values. |
| `value` | `number` | Controlled selected value. |
| `defaultValue` | `number` | `min`; initial uncontrolled value. |
| `majorStep` | `number` | `step * 10`; interval between major ticks in value units. |
| `labelStep` | `number` | `majorStep` or `step * 10`; set to `0` to hide tick labels. |
| `tickSpacing` | `number` | `8`; distance between adjacent ticks in CSS pixels; minimum `1`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'`; ruler orientation. |
| `tickAlignment` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`; alignment along the tick baseline. |
| `reverse` | `boolean` | `false`; reverses the numeric progression direction. |
| `height` | `number` | `240`; height of the vertical ruler track in CSS pixels. |
| `minorTickStyle`, `majorTickStyle` | `TickStyle` | `width`, `height`, `color`, and `borderRadius` for minor/major ticks. |
| `getTickStyle` | `(info: TickInfo) => Partial<TickStyle> \| undefined` | Per-tick style callback for custom styling. |
| `labelStyle` | `LabelStyle` | Font styling for tick labels. |
| `formatLabel` | `(value: number) => string` | Custom formatter for tick labels. |
| `cursorStyle` | `CursorStyle` | `width`, `height`, `color`, and `borderRadius` for the center cursor. |
| `renderCursor` | `() => ReactNode` | Custom render function for the center cursor. |
| `showValue`, `showEdgeMasks` | `boolean` | `true`; toggles selected value display and edge gradient masks. |
| `valueStyle` | `CSSProperties` | Inline styles for the value display container. |
| `formatValue` | `(value: number) => string` | Formatter for selected value and `aria-valuetext`. |
| `renderValue` | `(value: number) => ReactNode` | Custom render function for the selected value. |
| `motion` | `RulerMotionOptions` | Physics motion options (see table below); speed in CSS px/ms. |
| `wheelSensitivity` | `number` | `1.8`; wheel sensitivity factor. Set to `0` to disable wheel scrolling. |
| `disabled` | `boolean` | `false`; disables interaction and stops active momentum. |
| `onKeyDown`, `onKeyUp` | `KeyboardEventHandler<HTMLDivElement>` | Passed through to the focusable surface; no built-in key bindings. |
| `onScrollStart` | `() => void` | Invoked once when a user scroll session begins. |
| `onValueChange` | `(value, meta) => void` | Invoked on value changes. `meta.source` is `'drag'`, `'wheel'`, `'momentum'`, or `'programmatic'`. |
| `onValueChangeEnd` | `(value: number) => void` | Invoked once when motion completely stops and settles on a step. |
| `aria-label` | `string` | Accessible label; defaults to `'Value'` if `aria-labelledby` is omitted. |
| `aria-labelledby`, `aria-describedby` | `string` | Element IDs for accessible name and description. |
| `className`, `style` | `string`, `CSSProperties` | Root container class name and inline styles. |

## Motion Tuning

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

| Motion Option | Default | Description |
| --- | --- | --- |
| `friction` | `0.9` | Velocity retained per 16⅔ms frame in `[0, 1)`. Lower values stop faster; `0` disables inertia. |
| `velocityMultiplier` | `1` | Release speed multiplier (nonnegative). Does not affect direct drag tracking. |
| `maxVelocity` | `3` | Maximum release velocity cap in CSS px/ms. |
| `threshold` | `0.01` | Minimum resting velocity threshold in CSS px/ms (must be > 0). |

- **Physics Speed**: Velocities and thresholds use **CSS pixels/ms**, converted to tick intervals internally via `tickSpacing`. At default settings and peak release velocity, free coasting travel is ~473px (~59 ticks at `tickSpacing=8`).
- **Elastic Edge Overscroll**: Dragging or scrolling beyond bounds produces smooth elastic resistance (up to 72px deformation) with a 280ms bounce-back on release. Selection values remain strictly constrained within `[min, max]`.

## Interaction Details

- **Unified Input Model**: Uses standard Pointer Events across mouse, touch, and pen interactions without device-specific hacks.
- **Wheel & Trackpad**:
  - Supports mouse wheels and high-precision trackpads with configurable `wheelSensitivity` (set to `0` to disable).
  - On platforms supporting `WheelEvent.momentum` (e.g., macOS trackpads), release gestures transition smoothly into physics inertia. On other platforms, it gracefully falls back to native container scrolling.
  - Horizontal rulers prioritize the dominant wheel axis while remaining compatible with standard vertical mouse wheels.
- **State Updates & Change Sources**:
  - `onValueChange(value, meta)` supplies `meta.source` (`'drag'`, `'wheel'`, `'momentum'`, or `'programmatic'`) for precise interaction tracking.
  - In controlled mode, external value updates take effect immediately; if an update is rejected by parent state, the component reconciles to the controlled value upon settling.
- **Accessibility & Motion Preferences**:
  - Fully honors `prefers-reduced-motion` by disabling inertia and transition animations.
  - Comprehensive ARIA support (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`).

## Keyboard Support (Optional)

The component does not impose default keyboard shortcuts. You can pass custom keyboard handlers via `onKeyDown` along with ref methods:

```tsx
const ref = useRef<RulerPickerRef>(null);

<RulerPicker
  ref={ref}
  min={0}
  max={100}
  onKeyDown={(event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      ref.current?.scrollToValue((ref.current?.getValue() ?? 0) + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      ref.current?.scrollToValue((ref.current?.getValue() ?? 0) - 1);
    }
  }}
/>;
```

Ref-driven programmatic changes report their source as `programmatic`.

## Migrating from 0.1.x

- Removed `platform` prop and `RulerPlatform` type import; a unified physics engine is used across all environments.
- Use `motion` to configure inertia physics; `meta.source` now includes `'wheel'`.
- Removed built-in keyboard navigation; use `onKeyDown` with ref methods instead.
- Internal CSS class names `.rrp-scroll` / `.rrp-content` are replaced with `.rrp-surface`.
- `scrollToValue(value, { animated: true })` now continuously emits `programmatic` intermediate values during transitions until settling.
- Upgraded dependency to `tactile-motion@^0.1.0` (installed automatically), maintaining React 16.8+ compatibility.

## Development

```sh
npm ci
npm run dev           # Start playground dev server
npm test              # Run unit tests
npm run check         # Full verification (types, tests, build, package, size)
npm run test:react16  # Test package against React 16.8
```

## License

[MIT](LICENSE)
