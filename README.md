# react-ruler-picker

[English](README.en.md) | 简体中文

用于选择数值的 React 标尺组件，支持 Canvas 刻度渲染、触摸惯性、边缘回弹和 TypeScript。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)
[![npm downloads](https://img.shields.io/npm/dm/react-ruler-picker.svg)](https://www.npmjs.com/package/react-ruler-picker)

[在线演示](https://react-ruler-picker.vercel.app)

![react-ruler-picker preview](docs/assets/react-ruler-picker-preview.jpg)

- 从可配置的数值范围和步长间隔中选择数值。
- 支持横向、纵向以及反向标尺刻度。
- 支持指针拖拽、鼠标滚轮、触摸惯性滚动和边缘弹性回弹。
- 可自定义刻度、刻度标签、选中数值展示和中心指针。
- 支持受控 / 非受控数值，以及命令式 ref 方法。
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

组件首次挂载时会自动注入基础样式，无需额外引入样式文件。通过 `orientation="vertical"` 切换为纵向标尺，通过 ref 调用 `scrollToValue` / `getValue` 进行命令式操作。此外还导出 `clampValueByStep`、`formatValueByStep`、`getStepPrecision` 工具函数。

## Props

| Prop | 类型 | 默认值 / 行为 |
| --- | --- | --- |
| `min`, `max` | `number` | 必填的有限范围边界；传入相反顺序会自动归一化。 |
| `step` | `number` | `1`；最小可选增量。非法或非正值按 `1` 处理。 |
| `value` | `number` | 受控的选中数值。 |
| `defaultValue` | `number` | `min`；非受控时的初始值。 |
| `majorStep` | `number` | `step * 10`；主刻度之间的间隔（以数值为单位）。 |
| `labelStep` | `number` | `majorStep` 或 `step * 10`；设为 `0` 隐藏刻度标签。 |
| `tickSpacing` | `number` | `8`；刻度之间的间距（CSS 像素）；最小为 `1`。 |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'`；标尺方向。 |
| `tickAlignment` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'`；刻度基准线的对齐方式。 |
| `reverse` | `boolean` | `false`；反转数值递增的方向。 |
| `height` | `number` | `240`；纵向轨道的高度（CSS 像素）。 |
| `minorTickStyle`, `majorTickStyle` | `TickStyle` | 刻度的 `width`、`height`、`color` 和 `borderRadius`。 |
| `getTickStyle` | `(info: TickInfo) => Partial<TickStyle> \| undefined` | 针对单个刻度的样式回调。 |
| `labelStyle` | `LabelStyle` | 刻度标签的字体样式。 |
| `formatLabel` | `(value: number) => string` | 刻度标签格式化函数。 |
| `cursorStyle` | `CursorStyle` | 中心指针的 `width`、`height`、`color` 和 `borderRadius`。 |
| `renderCursor` | `() => ReactNode` | 自定义中心指针。 |
| `showValue`, `showEdgeMasks` | `boolean` | `true`；分别控制选中数值展示和边缘渐隐遮罩。 |
| `valueStyle` | `CSSProperties` | 数值区域的样式。 |
| `formatValue` | `(value: number) => string` | 格式化选中数值及 `aria-valuetext`。 |
| `renderValue` | `(value: number) => ReactNode` | 自定义选中数值内容。 |
| `motion` | `RulerMotionOptions` | 拖拽及惯性手感配置（详见下文）；速度单位为 CSS px/ms。 |
| `wheelSensitivity` | `number` | `1.8`；滚轮灵敏度系数。设为 `0` 禁用滚轮输入。 |
| `disabled` | `boolean` | `false`；禁用交互并取消进行中的惯性滚动。 |
| `onKeyDown`, `onKeyUp` | `KeyboardEventHandler<HTMLDivElement>` | 透传至可聚焦的交互容器，无内置按键逻辑。 |
| `onScrollStart` | `() => void` | 用户滚动会话开始时调用一次。 |
| `onValueChange` | `(value, meta) => void` | 数值变化时调用。`meta.source` 为 `drag`、`wheel`、`momentum` 或 `programmatic`。 |
| `onValueChangeEnd` | `(value: number) => void` | 滚动停止并在刻度步长上稳定后调用。 |
| `aria-label` | `string` | 无障碍名称；未提供 `aria-labelledby` 时默认为 `'Value'`。 |
| `aria-labelledby`, `aria-describedby` | `string` | 无障碍标签和描述的元素 ID。 |
| `className`, `style` | `string`, `CSSProperties` | 根容器的 class 和内联样式。 |

## 手感参数

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

| Motion 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `friction` | `0.9` | 速度保留比例（每 16⅔ms），范围 `[0, 1)`。越小停止越快；`0` 禁用惯性。 |
| `velocityMultiplier` | `1` | 释放速度倍率（非负数），不影响拖拽时的跟随距离。 |
| `maxVelocity` | `3` | 释放速度上限（单位 CSS px/ms）。 |
| `threshold` | `0.01` | 停止速度阈值（单位 CSS px/ms，必须大于 0）。 |

- **物理速度**：速度与阈值均以 **CSS 像素/ms** 为单位，内部会根据 `tickSpacing` 自动换算为刻度速度。在默认参数下最高释放速度滑行距离约 473px（`tickSpacing=8` 时约 59 个刻度）。
- **边缘阻尼与回弹**：拖拽或惯性滚动到达极值时提供平滑的弹性阻尼效果（最大形变 72px），释放后平滑执行 280ms 回弹归位；在此期间选中值始终严格保持在 `[min, max]` 范围内。

## 交互细节

- **统一输入体系**：基于标准 Pointer Events 统一处理鼠标、触控和手写笔交互，无需特定平台或设备嗅探。
- **滚轮与触控板**：
  - 支持普通鼠标滚轮与高精度触控板平滑滚动，通过 `wheelSensitivity` 调节灵敏度（设为 `0` 禁用）。
  - 在支持 `WheelEvent.momentum` 的环境（如 macOS 触控板）中，触控板释放手势会自动无缝过渡至物理引擎惯性；在不支持的环境下自动平滑回退到原生滚动机制。
  - 横向标尺优先使用主滚轮轴，同时也支持普通鼠标纵向滚轮。
- **状态更新与变更源**：
  - 数值变化时触发 `onValueChange(value, meta)`，其中 `meta.source` 明确标识触发来源（`'drag'`、`'wheel'`、`'momentum'` 或 `'programmatic'`）。
  - 受控模式下，外部传入的新数值会立即同步；若父组件拒绝更新，手势停止后会自动恢复为当前受控值。
- **无障碍与系统偏好**：
  - 遵循系统 `prefers-reduced-motion` 偏好，开启时自动禁用惯性与过渡动画。
  - 提供完整的 ARIA 状态标识（`aria-valuenow`、`aria-valuemin`、`aria-valuemax`、`aria-valuetext`）。

## 按需接入键盘

组件本身不拦截或预设特定的按键逻辑，推荐根据业务需求监听 `onKeyDown` 并配合 ref 进行控制：

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

由 ref 驱动的数值变更来源标识为 `programmatic`。

## 从 0.1.x 迁移

- 移除 `platform` 属性及 `RulerPlatform` 类型；各平台使用统一物理引擎。
- 使用 `motion` 调节惯性手感；`onValueChange` 的 `meta.source` 新增 `'wheel'`。
- 移除内置键盘按键映射，可按需通过 `onKeyDown` 结合 ref 实现。
- 内部 DOM 类名 `.rrp-scroll` / `.rrp-content` 统一变更为 `.rrp-surface`。
- `scrollToValue(value, { animated: true })` 现在会在动画过渡期间持续派发 `programmatic` 中间值，并在到达目标值后结算。
- 升级依赖 `tactile-motion@^0.1.0`（安装包时自动下载），保持 React 16.8+ 兼容性。

## 开发

```sh
npm ci
npm run dev           # 启动 Playground 开发服务器
npm test              # 运行单元测试
npm run check         # 完整校验（类型、测试、构建、打包、体积）
npm run test:react16  # React 16.8 兼容性与 SSR 验证
```

## License

[MIT](LICENSE)
