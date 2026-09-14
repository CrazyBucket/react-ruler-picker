/** Decimal places, including scientific notation (for example 1e-7). */
export const getStepPrecision = (step: number): number => {
  const [coefficient = "", exponent = "0"] = String(step)
    .toLowerCase()
    .split("e");
  return Math.min(
    100,
    Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - Number(exponent)),
  );
};

export const formatValueByStep = (value: number, step: number): string =>
  value.toFixed(getStepPrecision(Number.isFinite(step) && step > 0 ? step : 1));

/** Only complete steps anchored at min are selectable; max is an upper bound. */
export const getTotalSteps = (
  min: number,
  max: number,
  step: number,
): number => {
  const count = (max - min) / step;
  return Math.max(
    0,
    Math.floor(count + Math.min(1e-7, Number.EPSILON * Math.max(1, count) * 8)),
  );
};

export const clampValueByStep = (
  value: number,
  step: number,
  min: number,
  max: number,
): number => {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const clamped = Math.min(
    upper,
    Math.max(lower, Number.isNaN(value) ? lower : value),
  );
  if (!Number.isFinite(step) || step <= 0) return clamped;
  const index = Math.min(
    getTotalSteps(lower, upper, step),
    Math.round((clamped - lower) / step),
  );
  return Number(
    (lower + index * step).toFixed(
      Math.max(getStepPrecision(lower), getStepPrecision(step)),
    ),
  );
};
