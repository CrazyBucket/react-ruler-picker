const STYLE_ID = "react-ruler-picker-styles";
const CSS = `
.rrp-root{display:flex;width:100%;flex-direction:column;gap:8px;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}
.rrp-root--vertical{position:relative;flex-direction:column;align-items:center;justify-content:center;}
.rrp-root--vertical .rrp-value{position:absolute;top:50%;transform:translateY(-50%);white-space:nowrap;pointer-events:none;}
.rrp-root--vertical .rrp-value--right{text-align:left;}
.rrp-root--vertical .rrp-value--left{text-align:right;}
.rrp-root--vertical .rrp-track{flex-shrink:0;}
.rrp-root--disabled{opacity:.5;}
.rrp-value{text-align:center;font-variant-numeric:tabular-nums;color:inherit;font-weight:700;font-size:24px;line-height:1.4;}
.rrp-track{position:relative;overflow:hidden;min-width:0;}
.rrp-scroll{width:100%;height:100%;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;cursor:grab;direction:ltr;}
.rrp-scroll:active{cursor:grabbing;}
.rrp-scroll:focus-visible{outline:2px solid var(--rrp-focus-color,#0a77f5);outline-offset:-2px;border-radius:4px;}
.rrp-scroll::-webkit-scrollbar{display:none;}
.rrp-root--vertical .rrp-scroll{overflow-x:hidden;overflow-y:auto;touch-action:pan-y;overscroll-behavior-y:contain;overscroll-behavior-x:auto;}
.rrp-root--disabled .rrp-scroll{overflow:hidden;touch-action:auto;cursor:default;}
.rrp-content{min-width:100%;will-change:transform;}
.rrp-canvas{position:absolute;inset:0;pointer-events:none;}
.rrp-canvas--masked{-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);}
.rrp-root--vertical .rrp-canvas--masked{-webkit-mask-image:linear-gradient(0deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(0deg,transparent,#000 12%,#000 88%,transparent);}
.rrp-cursor{position:absolute;left:50%;top:4px;transform:translateX(-50%);pointer-events:none;}
.rrp-cursor--bottom{top:auto;bottom:4px;}
.rrp-root--vertical .rrp-cursor{left:4px;top:50%;transform:translateY(-50%);}
.rrp-root--vertical .rrp-cursor--bottom{left:auto;right:4px;}
`;

export const injectRulerStyles = (): void => {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID))
    return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
};
