export const WHEEL_IDLE_MS = 80;
const FRAME_MS = 1000 / 60;

/** Rate-limited CSS pixel input. Never infers contact or queues excess distance. */
export function createWheelInput() {
  let lastTime = -Infinity;
  let credit = 0;
  return {
    reset() {
      lastTime = -Infinity;
    },
    take(
      pixels: number,
      time: number,
      spacing: number,
      maxVelocity: number,
      sensitivity = 1,
    ) {
      const elapsed = Math.max(0, time - lastTime);
      const speed = Math.min(maxVelocity, spacing * 0.08 * sensitivity);
      const capacity = Math.min(
        spacing * 2 * sensitivity,
        maxVelocity * FRAME_MS,
      );
      credit =
        elapsed >= WHEEL_IDLE_MS
          ? capacity
          : Math.min(capacity, credit + elapsed * speed);
      lastTime = time;
      const amount = Math.min(Math.abs(pixels) * sensitivity, credit);
      credit -= amount;
      return Math.sign(pixels) * amount;
    },
  };
}
