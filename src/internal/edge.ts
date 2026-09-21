/** Visual overscroll only; the selected value remains inside the ruler range. */
export function rubberBand(distance: number): number {
  return (
    Math.sign(distance) *
    72 *
    (1 - Math.exp((-Math.abs(distance) * 0.55) / 72))
  );
}

/** Recover input space while animating in visible pixels, even after a long pull. */
export function unRubberBand(offset: number): number {
  return (
    (-Math.sign(offset) *
      Math.log1p(-Math.min(Math.abs(offset) / 72, 1 - Number.EPSILON)) *
      72) /
    0.55
  );
}

/** A monotonic return for held overscroll, with an optional smooth inertial impact. */
export function returnEdge(
  from: number,
  impact: number,
  progress: number,
): number {
  const p = Math.min(1, Math.max(0, progress));
  return (from + impact * (256 / 27) * p) * (1 - p) ** 3;
}
