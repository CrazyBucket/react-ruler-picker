import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RulerPicker, clampValueByStep } from "../../src";
import type { RulerPickerProps, RulerPickerRef } from "../../src";
import { apiRows, stories } from "./demos";
import type { Story } from "./demos";
import size from "./size.json";
import "./style.css";

type Lang = "zh" | "en";
type Theme = "light" | "dark";

const github = "https://github.com/CrazyBucket/react-ruler-picker";
const readRoute = () => location.hash.slice(1) || "default";

function IconCanvas() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function IconDocs() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconCompact() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconExpand() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconComponent() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M7 16h10" />
    </svg>
  );
}

const i18n = {
  zh: {
    skip: "跳转到主要内容",
    brandSub: "REACT 标尺组件库",
    searchPlaceholder: "搜索示例…",
    getStarted: "快速上手",
    intro: "组件介绍",
    apiRef: "API 参考",
    components: "组件示例",
    noMatch: "未找到匹配示例。",
    viewGithub: "在 GitHub 查看",
    documentation: "文档",
    canvas: "画布",
    docs: "文档",
    techStack: "React · TypeScript · Canvas",
    livePreview: "实时预览",
    compact: "紧凑",
    fullWidth: "全宽",
    reset: "重置",
    bodyTemp: "体温测量",
    selectedValue: "当前数值",
    manualEntry: "手动输入",
    apply: "应用 ↵",
    dragHint: "拖动或滚动以选择数值",
    dragHintDetail: "聚焦标尺后可使用 ↑ ↓ ← → 键调节",
    pausedHint: "当前标尺已禁用。可在下方控制面板中重新开启。",
    controlled: "受控",
    controlledExample: "受控示例",
    valuesCount: (count: number) => `${count} 个数值`,
    tweakNote: "修改参数以查看效果。",
    tabControls: "控制面板",
    tabActions: "事件方法",
    tabCode: "代码示例",
    goTo: (val: number) => `跳转到 ${val}`,
    clear: "清空",
    eventLogHint: "操作标尺即可在此查看事件回调。",
    footnote:
      "方向键调整一个步长；Page Up / Down 调整十个步长；Home 和 End 跳至范围边界。",
    footerText: "React 数值标尺选择器。",
    sourceCode: "查看源码",
    copy: "复制",
    copied: "已复制",
    selectToCopy: "请手动复制",
    prop: "属性",
    typeDefault: "类型 / 默认值",
    description: "描述",
    install: "安装",
    firstRuler: "基础用法",
    noStylesheet:
      "无需导入额外样式表。组件在首次挂载时向当前文档注入所需样式。Peer 依赖为 React 16.8+。",
    controlledValues: "受控值",
    controlledDesc:
      "在 onValueChange 中同步更新 value。来自 props 的数值变更不会触发回调；用户操作和 ref 调用会触发变更事件。设置 disabled 会停止当前交互和惯性滚动。",
    smallByDesign: "渲染与依赖",
    componentGzip: "组件体积 · 压缩后",
    runtimeDeps: "零运行时依赖",
    domNodes: "固定 DOM 节点开销",
    sizeDesc:
      "基于生产构建测量；React 作为外部依赖，使用 gzip 9 级压缩。包内包含类型声明、ESM、CommonJS 和 README。",
    compatTitle: "交互与平台支持",
    compat1:
      "触摸操作使用浏览器原生惯性，并在实际滚动位置稳定 160 ms（Android / Harmony 为 180 ms）后对齐至最近步长。Android 与 Harmony 会额外采样滚动位置，以补充部分 WebView 中缺失的 scroll 事件；iOS 使用原生 overflow 惯性。",
    compat2:
      "ResizeObserver 用于处理容器尺寸变化及隐藏后显示；不支持时使用 window resize。画布会在尺寸或设备像素比变化后重绘，并以 CSS 像素计算滚动位置。",
    compat3:
      "不同宿主的 WebView 行为可能不同。可在 onValueChange 中接入宿主的触感反馈；组件不包含宿主桥接代码或静态资源。",
    rangeTitle: "数值范围规则",
    rangeDesc:
      "刻度锚定在下限（min）。若 max 与 step 不对齐，则以范围内最后一个完整 step 作为最大可选值。若数值范围与步长跨度超过 8,000,000 像素会抛出 RangeError，请适当增大 step 或减小 tickSpacing。",
    exploreApi: "查看完整 API 文档 →",
    imperativeRef: "Imperative Ref 实例方法",
    refDesc:
      "Ref 方法会将目标数值限制到可选步长，并触发 source: 'programmatic' 事件。相同数值的重复请求不会重复派发变更；系统开启减少动态效果时不使用平滑滚动。",
    customTicks: "自定义刻度样式 (getTickStyle)",
    utilities: "工具函数",
    docsLead:
      "用于选择数值的 React 标尺组件，支持 Canvas 刻度渲染、触摸惯性、键盘操作和 TypeScript。",
    docsSubtitle: "数值范围、步长、方向和显示样式均可配置。",
    themeToggleLight: "切换为亮色模式",
    themeToggleDark: "切换为暗色模式",
    langToggle: "Switch to English",
  },
  en: {
    skip: "Skip to content",
    brandSub: "REACT COMPONENT LIBRARY",
    searchPlaceholder: "Find a story…",
    getStarted: "GET STARTED",
    intro: "Introduction",
    apiRef: "API reference",
    components: "COMPONENTS",
    noMatch: "No matching stories.",
    viewGithub: "View on GitHub",
    documentation: "Docs",
    canvas: "Canvas",
    docs: "Docs",
    techStack: "React · TypeScript · Canvas",
    livePreview: "LIVE PREVIEW",
    compact: "Compact",
    fullWidth: "Full width",
    reset: "Reset",
    bodyTemp: "BODY TEMPERATURE",
    selectedValue: "SELECTED VALUE",
    manualEntry: "Enter manually",
    apply: "Apply ↵",
    dragHint: "DRAG OR SCROLL TO SELECT",
    dragHintDetail: "Focus the ruler and use ↑ ↓ ← → to adjust",
    pausedHint: "This ruler is disabled. Enable it in Controls below.",
    controlled: "Controlled",
    controlledExample: "Controlled example",
    valuesCount: (count: number) => `${count} values`,
    tweakNote: "Change settings to inspect the result.",
    tabControls: "Controls",
    tabActions: "Actions",
    tabCode: "Code",
    goTo: (val: number) => `Go to ${val}`,
    clear: "Clear",
    eventLogHint: "Interact with the ruler to see events here.",
    footnote:
      "Arrow keys change one step. Page Up / Down changes ten steps. Home and End jump to the range bounds.",
    footerText: "Numeric ruler picker for React.",
    sourceCode: "Source code",
    copy: "Copy",
    copied: "Copied",
    selectToCopy: "Select to copy",
    prop: "Prop",
    typeDefault: "Type / default",
    description: "Description",
    install: "Install",
    firstRuler: "Basic usage",
    noStylesheet:
      "No stylesheet import is required. The component installs its styles once in the current document on first mount. React 16.8+ is a peer dependency.",
    controlledValues: "Controlled values",
    controlledDesc:
      "Update value synchronously in onValueChange. Prop-driven value changes are silent; user interactions and ref calls emit callbacks. Setting disabled stops interaction and active momentum.",
    smallByDesign: "Rendering and dependencies",
    componentGzip: "component · min + gzip",
    runtimeDeps: "runtime dependencies",
    domNodes: "DOM nodes by range",
    sizeDesc:
      "Measured from a production import with React external and gzip level 9. The package includes type declarations, ESM, CommonJS, and the README.",
    compatTitle: "Interaction and platform support",
    compat1:
      "Touch uses browser-native momentum and aligns to the nearest step after the scroll offset stays stable for 160 ms (180 ms on Android/Harmony). Android and Harmony additionally sample scroll position to supplement dropped WebView scroll events; iOS uses native overflow momentum.",
    compat2:
      "ResizeObserver handles container resizing and hidden-to-visible layouts, with a window resize fallback. The canvas redraws after size or device-pixel-ratio changes, while scroll geometry uses CSS pixels.",
    compat3:
      "WebView behavior can vary by host. Host haptics can be connected through onValueChange; the component does not include host bridge code or static assets.",
    rangeTitle: "Range semantics",
    rangeDesc:
      "Ticks are anchored at the lower bound. If max is not step-aligned, the last complete step is the highest selectable value. Non-finite bounds and a scroll span over 8,000,000 pixels throw RangeError; increase step or reduce tickSpacing.",
    exploreApi: "Explore the full API →",
    imperativeRef: "Imperative ref",
    refDesc:
      "Ref methods clamp target values to selectable steps and emit source: 'programmatic'. Repeated requests for the current value do not emit duplicate changes. Smooth scrolling is disabled when reduced motion is preferred.",
    customTicks: "Custom tick styling (getTickStyle)",
    utilities: "Utilities",
    docsLead:
      "A React numeric ruler picker with canvas-rendered ticks, touch momentum, keyboard input, and TypeScript types.",
    docsSubtitle: "Configure ranges, steps, orientation, and value display.",
    themeToggleLight: "Switch to light mode",
    themeToggleDark: "Switch to dark mode",
    langToggle: "切换为中文",
  },
};

function CopyButton({ text, lang }: { text: string; lang: Lang }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 1800);
    return () => clearTimeout(timer);
  }, [status]);

  const label =
    status === "copied"
      ? i18n[lang].copied
      : status === "failed"
        ? i18n[lang].selectToCopy
        : i18n[lang].copy;

  return (
    <button
      className="text-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("copied");
        } catch {
          setStatus("failed");
        }
      }}
      aria-label="Copy code"
    >
      {label}
    </button>
  );
}

function Code({ text, lang }: { text: string; lang: Lang }) {
  return (
    <div className="code">
      <div className="code-heading">
        <span>TSX</span>
        <CopyButton text={text} lang={lang} />
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}

function StoryCanvas({ story, lang }: { story: Story; lang: Lang }) {
  const [controls, setControls] = useState<RulerPickerProps>({
    tickSpacing: 8,
    step: 1,
    orientation: "horizontal",
    reverse: false,
    showValue: true,
    showEdgeMasks: true,
    ...story.props,
  });
  const [value, setValue] = useState(story.value);
  const [tab, setTab] = useState("controls");
  const [compact, setCompact] = useState(false);
  const [logs, setLogs] = useState<{ id: number; text: string }[]>([]);
  const [manual, setManual] = useState(String(story.value));
  const [reading, setReading] = useState<number | null>(null);
  const picker = useRef<RulerPickerRef>(null);
  const counter = useRef(0);
  const t = i18n[lang];

  const log = (text: string) => {
    const entry = { id: ++counter.current, text };
    setLogs((prev) => [entry, ...prev].slice(0, 40));
  };

  const update = (patch: Partial<RulerPickerProps>) => {
    const next = { ...controls, ...patch };
    setControls(next);
    setValue((previous) =>
      clampValueByStep(previous, next.step ?? 1, next.min, next.max),
    );
  };

  const reset = () => {
    setControls({
      tickSpacing: 8,
      step: 1,
      orientation: "horizontal",
      reverse: false,
      showValue: true,
      showEdgeMasks: true,
      ...story.props,
    });
    setValue(story.value);
    setManual(String(story.value));
    setLogs([]);
  };

  const numeric = (
    name:
      | "min"
      | "max"
      | "step"
      | "majorStep"
      | "labelStep"
      | "tickSpacing"
      | "height",
    fallback: number,
  ) => (
    <input
      aria-label={name}
      type="number"
      value={controls[name] ?? fallback}
      step="any"
      onChange={(event) => {
        if (!event.target.value) return;
        const next = Number(event.target.value);
        if (
          !Number.isFinite(next) ||
          (name === "min" && next > controls.max) ||
          (name === "max" && next < controls.min) ||
          (["step", "tickSpacing", "height"].includes(name) && next <= 0) ||
          (name === "labelStep" && next < 0)
        )
          return;
        const config = { ...controls, [name]: next };
        if (
          ((config.max - config.min) / (config.step ?? 1)) *
            (config.tickSpacing ?? 8) >
          8_000_000
        )
          return;
        update({ [name]: next });
      }}
    />
  );

  const boolean = (
    name: "reverse" | "showValue" | "showEdgeMasks" | "disabled",
  ) => (
    <button
      role="switch"
      aria-checked={!!controls[name]}
      aria-label={name}
      className={`switch ${controls[name] ? "on" : ""}`}
      onClick={() => update({ [name]: !controls[name] })}
    >
      <span />
    </button>
  );

  const source = `import { useRef, useState } from 'react';\nimport { RulerPicker } from 'react-ruler-picker';\nimport type { RulerPickerRef } from 'react-ruler-picker';\n\nexport function Example() {\n  const [value, setValue] = useState(${story.value});\n  const ref = useRef<RulerPickerRef>(null);\n\n  return (\n    <RulerPicker\n      ref={ref}\n      value={value}\n      onValueChange={setValue}\n      aria-label="${story.id === "health" ? "Temperature" : "Selected value"}"\n${Object.entries(
    controls,
  )
    .filter(([, val]) => val !== undefined)
    .map(([key, val]) => {
      if (typeof val === "function") {
        if (key === "getTickStyle") {
          return `      getTickStyle={({ index }) => {\n        const rainbow = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"];\n        return { color: rainbow[index % rainbow.length] };\n      }}`;
        }
        return `      ${key}={${val.toString()}}`;
      }
      return `      ${key}=${typeof val === "string" ? JSON.stringify(val) : `{${JSON.stringify(val)}}`}`;
    })
    .join("\n")}\n    />\n  );\n}`;

  const unit =
    story.id === "health"
      ? "°C"
      : story.id === "default" || story.id === "disabled"
        ? "cm"
        : story.id === "decimal"
          ? "kg"
          : story.id === "events"
            ? "mmHg"
            : "";

  return (
    <>
      <section className="canvas-panel" aria-label="Interactive example">
        <div className="canvas-toolbar">
          <span className="preview-label">
            <i /> {t.livePreview}
          </span>
          <div className="toolbar-actions">
            <button
              title={compact ? t.fullWidth : t.compact}
              aria-label="Toggle compact preview"
              aria-pressed={compact}
              onClick={() => setCompact(!compact)}
            >
              {compact ? <IconExpand /> : <IconCompact />}
              <span>{compact ? t.fullWidth : t.compact}</span>
            </button>
            <button onClick={reset} aria-label="Reset example">
              <IconReset />
              <span>{t.reset}</span>
            </button>
          </div>
        </div>
        <div className="preview">
          <div
            className={`instrument ${compact ? "compact" : ""} ${story.id === "health" ? "health-instrument" : ""}`}
          >
            <div className="instrument-label">
              <span>{story.id === "health" ? t.bodyTemp : t.selectedValue}</span>
              <span>
                {controls.min} — {controls.max} {unit}
              </span>
            </div>
            <RulerPicker
              {...controls}
              ref={picker}
              value={value}
              onValueChange={(next, meta) => {
                setValue(next);
                log(`${meta.source.padEnd(12)} ${next}`);
              }}
              onScrollStart={() => log("scroll start")}
              onValueChangeEnd={(next) => log(`settled      ${next}`)}
              aria-label={
                story.id === "health" ? "Temperature" : "Selected value"
              }
              formatValue={(next) => `${next}${unit ? ` ${unit}` : ""}`}
              renderValue={(next) => (
                <span className="measurement">
                  {next.toLocaleString("en-US", {
                    maximumFractionDigits: 7,
                    minimumFractionDigits: (controls.step ?? 1) < 1 ? 1 : 0,
                  })}
                  <small>{unit}</small>
                </span>
              )}
            />
            {story.id === "health" && (
              <form
                className="manual-entry"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (manual.trim() && Number.isFinite(Number(manual)))
                    picker.current?.scrollToValue(Number(manual), {
                      animated: true,
                    });
                }}
              >
                <label htmlFor="manual-value">{t.manualEntry}</label>
                <input
                  id="manual-value"
                  inputMode="decimal"
                  type="number"
                  step="any"
                  value={manual}
                  onChange={(event) => setManual(event.target.value)}
                />
                <button disabled={controls.disabled}>{t.apply}</button>
              </form>
            )}
          </div>
          <p className="gesture-hint">
            {controls.disabled ? t.pausedHint : t.dragHint}
            <span>{controls.disabled ? "" : t.dragHintDetail}</span>
          </p>
        </div>
        <div className="canvas-status">
          <span>
            <i />{" "}
            {controls.value !== undefined ? t.controlled : t.controlledExample}
          </span>
          <span>
            step {controls.step} <b>·</b> {controls.orientation} <b>·</b>{" "}
            {t.valuesCount(
              Math.floor((controls.max - controls.min) / (controls.step ?? 1)) +
                1,
            )}
          </span>
        </div>
      </section>
      <section className="addon-panel">
        <div
          className="addon-tabs"
          role="tablist"
          aria-label="Example tools"
          onKeyDown={(event) => {
            const names = ["controls", "actions", "code"];
            let index = names.indexOf(tab);
            if (event.key === "ArrowRight") index = (index + 1) % 3;
            else if (event.key === "ArrowLeft") index = (index + 2) % 3;
            else if (event.key === "Home") index = 0;
            else if (event.key === "End") index = 2;
            else return;
            event.preventDefault();
            setTab(names[index]!);
            document.getElementById(`tab-${names[index]}`)?.focus();
          }}
        >
          {[
            { id: "controls", label: t.tabControls },
            { id: "actions", label: t.tabActions },
            { id: "code", label: t.tabCode },
          ].map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              tabIndex={tab === id ? 0 : -1}
              aria-controls={`panel-${id}`}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
              {id === "actions" && <span>{logs.length}</span>}
            </button>
          ))}
          <span className="addon-note">{t.tweakNote}</span>
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "controls" && (
            <div className="controls-grid">
              <label>
                <span>
                  min <small>number</small>
                </span>
                {numeric("min", 0)}
              </label>
              <label>
                <span>
                  max <small>number</small>
                </span>
                {numeric("max", 100)}
              </label>
              <label>
                <span>
                  step <small>number</small>
                </span>
                {numeric("step", 1)}
              </label>
              <label>
                <span>
                  tickSpacing <small>px</small>
                </span>
                {numeric("tickSpacing", 8)}
              </label>
              <label>
                <span>
                  majorStep <small>number</small>
                </span>
                {numeric("majorStep", (controls.step ?? 1) * 10)}
              </label>
              <label>
                <span>
                  labelStep <small>0 = hidden</small>
                </span>
                {numeric(
                  "labelStep",
                  controls.majorStep ?? (controls.step ?? 1) * 10,
                )}
              </label>
              <label>
                <span>orientation</span>
                <select
                  aria-label="orientation"
                  value={controls.orientation}
                  onChange={(event) =>
                    update({
                      orientation: event.target.value as
                        | "horizontal"
                        | "vertical",
                    })
                  }
                >
                  <option>horizontal</option>
                  <option>vertical</option>
                </select>
              </label>
              <label>
                <span>tickAlignment</span>
                <select
                  aria-label="tickAlignment"
                  value={controls.tickAlignment ?? "top"}
                  onChange={(event) =>
                    update({
                      tickAlignment: event.target.value as NonNullable<
                        RulerPickerProps["tickAlignment"]
                      >,
                    })
                  }
                >
                  <option value="top">top</option>
                  <option value="bottom">bottom</option>
                  {controls.orientation === "vertical" && (
                    <>
                      <option value="left">left</option>
                      <option value="right">right</option>
                    </>
                  )}
                </select>
              </label>
              <label>
                <span>platform</span>
                <select
                  aria-label="platform"
                  value={controls.platform ?? "auto"}
                  onChange={(event) =>
                    update({
                      platform: event.target.value as NonNullable<
                        RulerPickerProps["platform"]
                      >,
                    })
                  }
                >
                  {["auto", "ios", "android", "harmony"].map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>reverse</span>
                {boolean("reverse")}
              </label>
              <label>
                <span>showValue</span>
                {boolean("showValue")}
              </label>
              <label>
                <span>showEdgeMasks</span>
                {boolean("showEdgeMasks")}
              </label>
              <label>
                <span>disabled</span>
                {boolean("disabled")}
              </label>
              {story.props.getTickStyle && (
                <div className="controls-snippet-box">
                  <div className="controls-snippet-header">
                    <span>
                      getTickStyle <small>custom ticks hook</small>
                    </span>
                    <button
                      role="switch"
                      aria-checked={!!controls.getTickStyle}
                      aria-label="getTickStyle"
                      className={`switch ${controls.getTickStyle ? "on" : ""}`}
                      onClick={() =>
                        update({
                          getTickStyle: controls.getTickStyle
                            ? undefined
                            : story.props.getTickStyle,
                        })
                      }
                    >
                      <span />
                    </button>
                  </div>
                  <pre className="controls-snippet-code">
                    <code>{`getTickStyle={({ index }) => {
  const rainbow = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"];
  return { color: rainbow[index % rainbow.length] };
}}`}</code>
                  </pre>
                </div>
              )}
              {controls.orientation === "vertical" && (
                <label>
                  <span>
                    height <small>px</small>
                  </span>
                  {numeric("height", 240)}
                </label>
              )}
            </div>
          )}
          {tab === "actions" && (
            <div className="actions-panel">
              <div className="ref-actions">
                {[
                  controls.min,
                  (controls.min + controls.max) / 2,
                  controls.max,
                ].map((target, index) => (
                  <button
                    key={index}
                    disabled={controls.disabled}
                    onClick={() =>
                      picker.current?.scrollToValue(target, { animated: true })
                    }
                  >
                    {t.goTo(target)}
                  </button>
                ))}
                <button
                  onClick={() => setReading(picker.current?.getValue() ?? null)}
                >
                  getValue()
                </button>
                <button onClick={() => setLogs([])}>{t.clear}</button>
              </div>
              {reading !== null && (
                <p className="ref-reading">getValue() → {reading}</p>
              )}
              <div className="event-log" aria-label="Event log">
                {logs.length ? (
                  logs.map((entry) => (
                    <div key={entry.id}>
                      <span>{String(entry.id).padStart(3, "0")}</span>
                      {entry.text}
                    </div>
                  ))
                ) : (
                  <p>{t.eventLogHint}</p>
                )}
              </div>
            </div>
          )}
          {tab === "code" && <Code text={source} lang={lang} />}
        </div>
      </section>
      <div className="story-footnote">
        <span><IconKeyboard /></span>
        <p>{t.footnote}</p>
      </div>
    </>
  );
}

function Documentation({
  api = false,
  lang,
}: {
  api?: boolean;
  lang: Lang;
}) {
  const t = i18n[lang];
  return (
    <div className="documentation">
      {!api && (
        <>
          <p className="doc-lead">{t.docsLead}</p>
          <h2>{t.install}</h2>
          <Code text="npm install react-ruler-picker" lang={lang} />
          <h2>{t.firstRuler}</h2>
          <Code
            text={`import { RulerPicker } from 'react-ruler-picker';\n\n<RulerPicker min={80} max={220} defaultValue={170}\n  aria-label="Height in centimeters"\n  onValueChange={(value, meta) => console.log(value, meta.source)}\n/>`}
            lang={lang}
          />
          <p>{t.noStylesheet}</p>
          <h2>{t.controlledValues}</h2>
          <Code
            text={`const [value, setValue] = useState(36.5);\n\n<RulerPicker min={34} max={42} step={0.1}\n  value={value} onValueChange={setValue}\n  formatValue={value => value.toFixed(1) + ' °C'}\n  disabled={saving || !visible}\n/>`}
            lang={lang}
          />
          <p>{t.controlledDesc}</p>
        </>
      )}
      <h2>{api ? t.apiRef : t.smallByDesign}</h2>
      {!api && (
        <>
          <div className="size-cards">
            <div>
              <strong>
                {(size.component.gzip / 1000).toFixed(2)}
                <small>kB</small>
              </strong>
              <span>{t.componentGzip}</span>
            </div>
            <div>
              <strong>0</strong>
              <span>{t.runtimeDeps}</span>
            </div>
            <div>
              <strong>O(1)</strong>
              <span>{t.domNodes}</span>
            </div>
          </div>
          <p>{t.sizeDesc}</p>
          <h2>{t.compatTitle}</h2>
          <p>{t.compat1}</p>
          <p>{t.compat2}</p>
          <p>{t.compat3}</p>
          <h2>{t.rangeTitle}</h2>
          <p>{t.rangeDesc}</p>
          <a className="inline-link" href="#api">
            {t.exploreApi}
          </a>
        </>
      )}
      {api && (
        <>
          <div className="api-table-wrap">
            <table className="api-table">
              <thead>
                <tr>
                  <th>{t.prop}</th>
                  <th>{t.typeDefault}</th>
                  <th>{t.description}</th>
                </tr>
              </thead>
              <tbody>
                {apiRows.map(([name, type, fallback, descEn, descZh]) => (
                  <tr key={name}>
                    <td>
                      <code>{name}</code>
                    </td>
                    <td>
                      <code>{type}</code>
                      <small>{fallback}</small>
                    </td>
                    <td>{lang === "zh" ? descZh : descEn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h2>{t.imperativeRef}</h2>
          <Code
            text={`const ref = useRef<RulerPickerRef>(null);\n\nref.current?.scrollToValue(120, { animated: true });\nref.current?.getValue();`}
            lang={lang}
          />
          <p>{t.refDesc}</p>
          <h2>{t.customTicks}</h2>
          <Code
            text={`<RulerPicker\n  min={0} max={100} defaultValue={50}\n  getTickStyle={({ index }) => {\n    const rainbow = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];\n    return { color: rainbow[index % rainbow.length] };\n  }}\n/>`}
            lang={lang}
          />
          <h2>{t.utilities}</h2>
          <Code
            text={`import { clampValueByStep, formatValueByStep, getStepPrecision }\n  from 'react-ruler-picker';\n\nclampValueByStep(36.66, 0.1, 34, 42); // 36.7\nformatValueByStep(36, 0.1);          // '36.0'\ngetStepPrecision(1e-7);             // 7`}
            lang={lang}
          />
        </>
      )}
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    const cached = localStorage.getItem("ruler-picker-lang");
    if (cached === "zh" || cached === "en") return cached;
    return "zh";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const cached = localStorage.getItem("ruler-picker-theme");
    if (cached === "light" || cached === "dark") return cached;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  const search = useRef<HTMLInputElement>(null);
  const t = i18n[lang];

  useEffect(() => {
    localStorage.setItem("ruler-picker-lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ruler-picker-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (menu) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [menu]);

  useEffect(() => {
    const shortcuts = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (event.target as HTMLElement).matches(
          "input, select, textarea, [contenteditable]",
        )
      )
        return;
      event.preventDefault();
      setMenu(true);
      requestAnimationFrame(() => search.current?.focus());
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, []);

  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);

  const story = stories.find((item) => item.id === route) ?? stories[0]!;
  const docs = route === "overview" || route === "api";
  const title = docs
    ? route === "api"
      ? t.apiRef
      : t.intro
    : lang === "zh"
      ? story.titleZh
      : story.title;

  const eyebrow = docs
    ? "RULERPICKER / DOCUMENTATION"
    : `RULERPICKER / ${lang === "zh" ? story.eyebrowZh : story.eyebrow}`;

  const description = docs
    ? t.docsSubtitle
    : lang === "zh"
      ? story.descriptionZh
      : story.description;

  useEffect(() => {
    document.title = `${title} · React Ruler Picker`;
  }, [title]);

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {t.skip}
      </a>
      <div
        className={`sidebar-backdrop ${menu ? "is-open" : ""}`}
        onClick={() => setMenu(false)}
        onTouchMove={(event) => {
          if (menu) event.preventDefault();
        }}
      />
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <a className="brand" href="#default" onClick={() => setMenu(false)}>
          react-ruler-picker
        </a>
        <div className="search-box">
          <span><IconSearch /></span>
          <input
            ref={search}
            aria-label={t.searchPlaceholder}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd>/</kbd>
        </div>
        <nav aria-label="Component documentation">
          <p className="nav-heading">{t.getStarted}</p>
          {[
            ["overview", t.intro],
            ["api", t.apiRef],
          ]
            .filter(([, name]) =>
              name!.toLowerCase().includes(query.toLowerCase()),
            )
            .map(([id, name]) => (
              <a
                key={id}
                className={route === id ? "active" : ""}
                href={`#${id}`}
                onClick={() => setMenu(false)}
              >
                <span className="nav-icon"><IconDocs /></span>
                {name}
              </a>
            ))}
          <p className="nav-heading stories-heading">
            {t.components} <span>09</span>
          </p>
          <div className="component-name">
            <span className="component-icon"><IconComponent /></span> RulerPicker
          </div>
          <div className="story-links">
            {stories
              .filter((item) => {
                const searchTarget = `${item.title} ${item.titleZh}`.toLowerCase();
                return searchTarget.includes(query.toLowerCase());
              })
              .map((item) => (
                <a
                  key={item.id}
                  className={route === item.id ? "active" : ""}
                  href={`#${item.id}`}
                  aria-current={route === item.id ? "page" : undefined}
                  onClick={() => setMenu(false)}
                >
                  <span className="story-dot" />
                  {lang === "zh" ? item.titleZh : item.title}
                </a>
              ))}
          </div>
          {query &&
            !stories.some((item) =>
              `${item.title} ${item.titleZh}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && <p className="empty-search">{t.noMatch}</p>}
        </nav>
        <div className="sidebar-bottom">
          <a href={github} target="_blank" rel="noreferrer">
            <span>{t.viewGithub}</span>
            <IconExternal />
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="menu-button"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <IconMenu />
          </button>
          <div className="breadcrumbs">
            {t.components} <span>/</span> <b>RulerPicker</b>
          </div>
          <div className="topbar-right">
            <a href="#overview" className="topbar-doc-link">
              <span>{t.documentation}</span>
              <IconExternal />
            </a>
            <span className="version">v{__APP_VERSION__}</span>
            <button
              className="topbar-toggle-button"
              onClick={() => setLang(lang === "zh" ? "en" : "zh")}
              aria-label="Toggle language"
              title={lang === "zh" ? "Switch to English" : "切换为中文"}
            >
              {lang === "zh" ? "EN" : "中"}
            </button>
            <button
              className="topbar-toggle-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
              title={
                theme === "dark" ? t.themeToggleLight : t.themeToggleDark
              }
            >
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </header>
        <div className="view-tabs">
          <a className={!docs ? "selected" : ""} href={`#${story.id}`}>
            <IconCanvas />
            <span>{t.canvas}</span>
          </a>
          <a className={docs ? "selected" : ""} href="#overview">
            <IconDocs />
            <span>{t.docs}</span>
          </a>
          <span>{t.techStack}</span>
        </div>
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h1>
                {title}
                <span className="heading-dot">.</span>
              </h1>
              <p>{description}</p>
            </div>
            <a className="size-badge" href="#overview">
              <strong>{(size.component.gzip / 1000).toFixed(2)} kB</strong>
              <span>min + gzip ↗</span>
            </a>
          </div>
          {docs ? (
            <Documentation api={route === "api"} lang={lang} />
          ) : (
            <StoryCanvas key={story.id} story={story} lang={lang} />
          )}
          <footer>
            <span>{t.footerText}</span>
            <a href={github} target="_blank" rel="noreferrer">
              <span>{t.sourceCode}</span>
              <IconExternal />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
