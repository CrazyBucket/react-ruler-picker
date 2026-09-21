# react-ruler-picker

[English](README.en.md) | 简体中文

用于选择数值的 React 标尺组件，支持 Canvas 刻度、拖拽与滚轮交互、触摸惯性和 TypeScript。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)
[![npm downloads](https://img.shields.io/npm/dm/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)

[在线演示](https://react-ruler-picker.vercel.app)

![react-ruler-picker preview](docs/assets/react-ruler-picker-preview.jpg)

- 支持自定义数值范围、步长、方向和刻度样式。
- 支持受控 / 非受控值、指针拖拽、鼠标滚轮和触摸惯性滚动。
- 支持边缘回弹、无障碍属性、`prefers-reduced-motion` 和 TypeScript。
- 提供 ESM、CommonJS 和 TypeScript 类型声明。

## 安装

```sh
npm install react-ruler-picker
```

要求 React 16.8 及以上版本。

## 快速上手

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

组件首次挂载时会自动注入基础样式，无需额外引入 CSS。通过 `orientation="vertical"` 使用纵向标尺，也可以通过 ref 调用 `scrollToValue` 和 `getValue`。

## Props

| Prop | 类型 | 默认值 / 行为 |
| --- | --- | --- |
| `min`, `max` | `number` | 必填的有限范围边界；传入相反顺序会自动归一化。 |
| `step` | `number` | `1`；最小可选增量。非法或非正值按 `1` 处理。 |
| `value` | `number` | 受控的选中数值。 |
| `defaultValue` | `number` | `min`；非受控时的初始值。 |
| `majorStep` | `number` | `step * 10`；主刻度间隔。 |
| `labelStep` | `number` | `majorStep` 或 `step * 10`；设为 `0` 隐藏刻度标签。 |
| `tickSpacing` | `number` | `8`；相邻刻度间距（CSS 像素），最小为 `1`。 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'`；标尺方向。 |
| `tickAlignment` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`；刻度对齐方式。 |
| `reverse` | `boolean` | `false`；反转数值递增方向。 |
| `height` | `number` | `240`；纵向标尺高度（CSS 像素）。 |
| `minorTickStyle`, `majorTickStyle` | `TickStyle` | 刻度的 `width`、`height`、`color` 和 `borderRadius`。 |
| `getTickStyle` | `(info: TickInfo) => Partial<TickStyle> \| undefined` | 单个刻度的样式回调。 |
| `labelStyle` | `LabelStyle` | 刻度标签字体样式。 |
| `formatLabel` | `(value: number) => string` | 刻度标签格式化函数。 |
| `cursorStyle` | `CursorStyle` | 中心指针样式。 |
| `renderCursor` | `() => ReactNode` | 自定义中心指针。 |
| `showValue`, `showEdgeMasks` | `boolean` | `true`；控制数值显示和边缘遮罩。 |
| `valueStyle` | `CSSProperties` | 数值区域样式。 |
| `formatValue` | `(value: number) => string` | 选中数值和 `aria-valuetext` 的格式化函数。 |
| `renderValue` | `(value: number) => ReactNode` | 自定义选中数值内容。 |
| `motion` | `RulerMotionOptions` | 拖拽和惯性滚动参数，见下文。 |
| `wheelSensitivity` | `number` | `1.8`；滚轮灵敏度，设为 `0` 禁用滚轮。 |
| `disabled` | `boolean` | `false`；禁用交互。 |
| `onScrollStart` | `() => void` | 用户滚动会话开始时调用一次。 |
| `onValueChange` | `(value, meta) => void` | 数值变化时调用；`meta.source` 为 `drag`、`wheel`、`momentum` 或 `programmatic`。 |
| `onValueChangeEnd` | `(value: number) => void` | 滚动停止并稳定到步长后调用。 |
| `aria-label` | `string` | 无障碍名称。 |
| `aria-labelledby`, `aria-describedby` | `string` | 无障碍标签和描述的元素 ID。 |
| `className`, `style` | `string`, `CSSProperties` | 根容器的 class 和内联样式。 |

## 惯性与滚轮

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

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `friction` | `0.9` | 惯性速度保留比例，范围 `[0, 1)`；`0` 禁用惯性。 |
| `velocityMultiplier` | `1` | 释放速度倍率。 |
| `maxVelocity` | `3` | 最大释放速度（CSS 像素/ms）。 |
| `threshold` | `0.01` | 惯性停止阈值（CSS 像素/ms）。 |

组件会根据系统的 `prefers-reduced-motion` 偏好减少动画。横向标尺支持普通滚轮和触控板，`onValueChange` 的 `meta.source` 可用于区分拖拽、滚轮、惯性和代码驱动的变化。

## 开发

```sh
npm ci
npm run dev           # 启动 Playground
npm test              # 运行单元测试
npm run check         # 类型、测试、构建和打包校验
npm run test:react16  # React 16.8 兼容性验证
```

## License

[MIT](LICENSE)
