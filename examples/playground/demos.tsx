import type { RulerPickerProps } from "../../src";

export type Story = {
  id: string;
  title: string;
  titleZh: string;
  eyebrow: string;
  eyebrowZh: string;
  description: string;
  descriptionZh: string;
  value: number;
  props: RulerPickerProps;
};

export const stories: Story[] = [
  {
    id: "default",
    title: "Default",
    titleZh: "默认基础",
    eyebrow: "BASIC",
    eyebrowZh: "基础模式",
    description:
      "Horizontal numeric scale supporting pointer dragging, trackpad/wheel scrolling, and keyboard arrow navigation.",
    descriptionZh:
      "基础水平刻度尺，支持鼠标拖拽、滚轮滑动及键盘方向键调节数值。",
    value: 170,
    props: { min: 80, max: 220, step: 1, majorStep: 10, labelStep: 10 },
  },
  {
    id: "health",
    title: "Health entry",
    titleZh: "体温录入",
    eyebrow: "SCENARIO",
    eyebrowZh: "场景示例",
    description:
      "Health metrics input with customized indicator color, separate measurement unit, and direct text input synchronization.",
    descriptionZh:
      "健康数据录入场景，支持指示针配色定制、独立单位显示与输入框数值双向同步。",
    value: 36.5,
    props: {
      min: 34,
      max: 42,
      step: 0.1,
      majorStep: 1,
      labelStep: 1,
      minorTickStyle: { height: 10, color: "#e5e5e5" },
      majorTickStyle: { height: 14, color: "#e5e5e5" },
      labelStyle: { color: "#888888", fontSize: 11 },
      cursorStyle: { color: "#0a77f5", height: 16 },
    },
  },
  {
    id: "decimal",
    title: "Decimal steps",
    titleZh: "小数步长",
    eyebrow: "DECIMAL",
    eyebrowZh: "小数步长",
    description:
      "Fractional-step numeric selection (for example, 0.1), with values aligned to the minimum bound.",
    descriptionZh:
      "支持小数步长（如 0.1）的数值选择，所有可选值均基于最小值对齐。",
    value: 62.5,
    props: { min: 40, max: 120, step: 0.1, majorStep: 1, labelStep: 5 },
  },
  {
    id: "vertical",
    title: "Vertical",
    titleZh: "垂直标尺",
    eyebrow: "ORIENTATION",
    eyebrowZh: "垂直方向",
    description:
      "Vertical scale layout for height-constrained containers, keeping tick labels upright and readable.",
    descriptionZh:
      "垂直布局标尺，适用于纵向排版界面，刻度标签自适应保持水平朝向。",
    value: 50,
    props: {
      min: 0,
      max: 100,
      orientation: "vertical",
      height: 260,
      majorStep: 10,
      labelStep: 10,
    },
  },
  {
    id: "reverse",
    title: "Reversed scale",
    titleZh: "反向刻度",
    eyebrow: "DIRECTION",
    eyebrowZh: "反向排列",
    description:
      "Reversed scale direction for countdown or inverted range inputs, maintaining aligned tick labels.",
    descriptionZh:
      "反向递增刻度排列，适用于倒计时或倒序数值选择场景。",
    value: 70,
    props: { min: 0, max: 95, reverse: true, majorStep: 10, labelStep: 10 },
  },
  {
    id: "appearance",
    title: "Custom appearance",
    titleZh: "自定义外观",
    eyebrow: "STYLING",
    eyebrowZh: "样式定制",
    description:
      "Customizable tick dimensions, colors, and indicator styling, with getTickStyle for dynamic per-tick styling.",
    descriptionZh:
      "支持自定义主副刻度尺寸与颜色、修改指针外观，并通过 getTickStyle 动态定制各个刻度的色彩与样式。",
    value: 40,
    props: {
      min: 0,
      max: 100,
      tickSpacing: 12,
      majorStep: 10,
      minorTickStyle: { color: "#697368", height: 12 },
      majorTickStyle: {
        color: "#a7bb96",
        height: 26,
        width: 2,
        borderRadius: 2,
      },
      getTickStyle: ({ index }) => {
        const rainbow = [
          "#ef4444",
          "#f97316",
          "#eab308",
          "#22c55e",
          "#06b6d4",
          "#3b82f6",
          "#a855f7",
        ];
        return { color: rainbow[index % rainbow.length]! };
      },
      labelStyle: { color: "#879b79", fontSize: 12 },
      cursorStyle: { color: "#63844d", width: 3, height: 32 },
    },
  },
  {
    id: "events",
    title: "Events & ref",
    titleZh: "事件与方法",
    eyebrow: "EVENTS & REF",
    eyebrowZh: "事件与控制",
    description:
      "View change sources and settled values, then use ref methods to read the selection or scroll to a value.",
    descriptionZh:
      "查看变更来源与停靠后的数值，并通过 Ref 方法读取当前值或滚动至指定数值。",
    value: 120,
    props: { min: 60, max: 200, majorStep: 10, labelStep: 20 },
  },
  {
    id: "large",
    title: "Large range",
    titleZh: "超大范围",
    eyebrow: "LARGE SCALE",
    eyebrowZh: "大范围",
    description:
      "Select from a large range (for example, 0 to 100,000) while the canvas draws ticks in the current viewport.",
    descriptionZh:
      "支持大跨度数值区间（如 0 到 100,000）的选择，Canvas 仅绘制当前视口中的刻度。",
    value: 50000,
    props: { min: 0, max: 100000, majorStep: 10, labelStep: 20 },
  },
  {
    id: "disabled",
    title: "Disabled",
    titleZh: "禁用状态",
    eyebrow: "DISABLED",
    eyebrowZh: "禁用状态",
    description:
      "Disabled state for form submission or modal transitions, blocking user gestures and cancelling active momentum.",
    descriptionZh:
      "表单提交或弹窗收起时禁用标尺交互，立即阻断手势交互并取消进行中的惯性滑动。",
    value: 170,
    props: { min: 80, max: 220, disabled: true, majorStep: 10, labelStep: 10 },
  },
];

export const apiRows: [string, string, string, string, string][] = [
  [
    "min / max",
    "number",
    "required",
    "Finite range bounds. Reversed bounds are normalized.",
    "有限数值区间边界。反向边界会自动归一化。",
  ],
  [
    "step",
    "number",
    "1",
    "Smallest increment, anchored at min. Invalid steps fall back to 1.",
    "最小步长增量，基于 min 对齐。无效值回退为 1。",
  ],
  [
    "value / defaultValue",
    "number",
    "— / min",
    "Controlled value or initial uncontrolled value.",
    "受控值或初始非受控值。",
  ],
  [
    "majorStep / labelStep",
    "number",
    "step × 10",
    "Intervals in value units. Set labelStep to 0 to hide labels.",
    "以数值单位表示的间隔。将 labelStep 设为 0 可隐藏刻度文字。",
  ],
  [
    "tickSpacing",
    "number",
    "8",
    "Distance between consecutive ticks in CSS pixels. Minimum 1.",
    "相邻刻度线之间的 CSS 像素间距，最小为 1。",
  ],
  [
    "orientation / reverse",
    "'horizontal' | 'vertical' / boolean",
    "'horizontal' / false",
    "Axis orientation and direction of increasing values.",
    "轴向（水平/垂直）及数值递增方向。",
  ],
  [
    "tickAlignment",
    "'top' | 'bottom' | 'left' | 'right'",
    "'top'",
    "Base alignment edge of tick marks: 'top'/'left' (default) or 'bottom'/'right'.",
    "刻度线的基线对齐方向：'top'/'left'（默认顶端/左侧对齐）或 'bottom'/'right'（底端/右侧对齐）。",
  ],
  [
    "height",
    "number",
    "240",
    "Vertical track height in CSS pixels.",
    "垂直模式下的轨道高度（CSS 像素）。",
  ],
  [
    "minorTickStyle / majorTickStyle",
    "TickStyle",
    "—",
    "Tick width, height, color, and border radius; height represents tick length on either axis.",
    "刻度宽度、高度、颜色、圆角；height 表示对应轴向上的刻度长度。",
  ],
  [
    "getTickStyle",
    "(info: TickInfo) => Partial<TickStyle> | undefined",
    "—",
    "Dynamic style callback for individual ticks (receives value, index, isMajor, isLabel).",
    "单个刻度的动态样式定制回调函数（入参提供 value、index、isMajor、isLabel）。",
  ],
  [
    "labelStyle / formatLabel",
    "LabelStyle / (value) => string",
    "—",
    "Font styles (size, weight, family, color) and tick label formatting function.",
    "刻度标签字体样式（大小、粗细、字体族、颜色）及文本格式化函数。",
  ],
  [
    "cursorStyle / renderCursor",
    "CursorStyle / () => ReactNode",
    "—",
    "Style or replace the centered indicator element.",
    "样式化或替换中心指示针元素。",
  ],
  [
    "showValue / showEdgeMasks",
    "boolean",
    "true",
    "Toggle selected value display and transparent edge fading masks.",
    "是否展示当前选中值以及两端渐变淡出遮罩。",
  ],
  [
    "valueStyle / formatValue / renderValue",
    "CSSProperties / callbacks",
    "—",
    "Style, format, or replace the value row. formatValue also supplies aria-valuetext.",
    "样式化、格式化或替换数值显示行。formatValue 同时提供 aria-valuetext。",
  ],
  [
    "platform",
    "'auto' | 'ios' | 'android' | 'harmony'",
    "'auto'",
    "Target platform mode. 'android' and 'harmony' enable momentum sampling to handle dropped scroll events in WebViews.",
    "目标平台模式。'android' 与 'harmony' 会启用惯性采样以补充 WebView 中偶发丢失的滚动事件。",
  ],
  [
    "disabled",
    "boolean",
    "false",
    "Disables pointer, wheel, keyboard, and ref interactions, cancelling active momentum.",
    "禁用指针、滚轮、键盘与 ref 操作，并中止进行中的惯性滚动。",
  ],
  [
    "onScrollStart",
    "() => void",
    "—",
    "Triggered once when user scrolling begins.",
    "用户手势滚动开始时触发一次。",
  ],
  [
    "onValueChange",
    "(value, { source }) => void",
    "—",
    "Triggered on value change. Sources: drag, momentum, keyboard, programmatic.",
    "仅在数值变化时触发。来源包括：drag、momentum、keyboard、programmatic。",
  ],
  [
    "onValueChangeEnd",
    "(value) => void",
    "—",
    "Triggered once when scrolling settles at the target step value.",
    "滚动停止并吸附至目标步长时触发一次；组件禁用或卸载时抑制触发。",
  ],
  [
    "aria-label / aria-labelledby / aria-describedby",
    "string",
    "'Value' / — / —",
    "Accessible name and description for the slider element.",
    "滑块元素的无障碍名称与描述信息。",
  ],
  [
    "className / style",
    "string / CSSProperties",
    "—",
    "Custom class name and inline styles for the root container.",
    "根容器的自定义类名与内联样式。",
  ],
];
