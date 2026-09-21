import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RulerPicker } from "../src";

describe("RulerPicker (SSR render)", () => {
  it("renders a constant-size gesture surface", () => {
    const html = renderToStaticMarkup(
      <RulerPicker min={0} max={10} step={1} />,
    );
    expect(html).toContain("rrp-root");
    expect(html.match(/rrp-surface/g)).toHaveLength(1);
    expect(html).toContain('aria-valuemax="10"');
  });

  it("respects decimal steps in accessibility bounds", () => {
    const html = renderToStaticMarkup(
      <RulerPicker min={34} max={42} step={0.5} />,
    );
    expect(html).toContain('aria-valuemax="42"');
  });

  it("renders the formatted default value", () => {
    const html = renderToStaticMarkup(
      <RulerPicker min={34} max={42} step={0.1} defaultValue={36.5} />,
    );
    expect(html).toContain("36.5");
  });

  it("hides the value row when showValue is false", () => {
    const html = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        step={1}
        defaultValue={5}
        showValue={false}
      />,
    );
    expect(html).not.toContain("rrp-value");
  });

  it("renders value after track in vertical orientation and before track in horizontal", () => {
    const verticalHtml = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        defaultValue={5}
        orientation="vertical"
      />,
    );
    const trackIndexV = verticalHtml.indexOf("rrp-track");
    const valueIndexV = verticalHtml.indexOf("rrp-value");
    expect(trackIndexV).toBeLessThan(valueIndexV);

    const horizontalHtml = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        defaultValue={5}
        orientation="horizontal"
      />,
    );
    const trackIndexH = horizontalHtml.indexOf("rrp-track");
    const valueIndexH = horizontalHtml.indexOf("rrp-value");
    expect(valueIndexH).toBeLessThan(trackIndexH);
  });

  it("supports tickAlignment bottom and attaches bottom cursor class", () => {
    const html = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        defaultValue={5}
        tickAlignment="bottom"
      />,
    );
    expect(html).toContain("rrp-cursor--bottom");
  });

  it("renders rrp-value--left when tickAlignment is right/bottom in vertical mode", () => {
    const html = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        defaultValue={5}
        orientation="vertical"
        tickAlignment="right"
      />,
    );
    expect(html).toContain("rrp-value--left");
  });
});

describe("SSR edge cases", () => {
  it("bounds large ranges without rendering a node per tick", () => {
    const html = renderToStaticMarkup(<RulerPicker min={0} max={100000} />);
    expect(html.length).toBeLessThan(2000);
  });
  it("rejects non-finite and numerically unsafe ranges", () => {
    expect(() =>
      renderToStaticMarkup(<RulerPicker min={0} max={Infinity} />),
    ).toThrow(RangeError);
    expect(() =>
      renderToStaticMarkup(
        <RulerPicker min={0} max={Number.MAX_SAFE_INTEGER * 2} />,
      ),
    ).toThrow(RangeError);
  });
  it("uses the last complete step as the maximum", () => {
    const html = renderToStaticMarkup(
      <RulerPicker min={0} max={10} step={3} defaultValue={10} />,
    );
    expect(html).toContain('aria-valuemax="9"');
    expect(html).toContain('aria-valuenow="9"');
  });
  it("supports custom value, cursor and accessible text", () => {
    const html = renderToStaticMarkup(
      <RulerPicker
        min={0}
        max={10}
        defaultValue={5}
        formatValue={(v) => `${v} kg`}
        renderValue={(v) => <b>{v}</b>}
        renderCursor={() => <i>↓</i>}
      />,
    );
    expect(html).toContain('aria-valuetext="5 kg"');
    expect(html).toContain("<b>5</b>");
    expect(html).toContain("<i>↓</i>");
  });
});
