import React from "react";
import type { PointerEvent, RefObject } from "react";
import { createTactileMotion } from "tactile-motion";
import { attachNativeWheel } from "./native-wheel";
import { rubberBand, unRubberBand, returnEdge } from "./edge";
import { createWheelInput, WHEEL_IDLE_MS } from "./wheel-input";
import type { RulerPickerProps, RulerValueSource } from "../types";

const { useEffect, useRef, useState, useCallback } = React;
const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

interface Options {
  props: RulerPickerProps;
  total: number;
  spacing: number;
  viewport: number;
  vertical: boolean;
  geometry: string;
  normalize(value: number): number;
  toPosition(value: number): number;
  fromPosition(position: number): number;
  paint(): void;
}

/** Component-specific input, snapping and controlled values; physics belongs to tactile-motion. */
export function useRulerMotion(
  options: Options,
  surface: RefObject<HTMLDivElement | null>,
) {
  const latest = useRef(options);
  latest.current = options;
  const [internal, setInternal] = useState(() =>
    options.normalize(options.props.defaultValue ?? options.props.min),
  );
  const selected = options.normalize(options.props.value ?? internal);
  const [display, setDisplay] = useState(selected);
  const current = useRef(selected);
  const [settlement, setSettlement] = useState(0);
  const active = useRef(false);
  const source = useRef<RulerValueSource>("drag");
  const pending = useRef<number[]>([]);
  const silent = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [wheelInput] = useState(createWheelInput);
  const wheelActive = useRef(false);
  const nativeWheel = useRef<ReturnType<typeof attachNativeWheel> | null>(
    null,
  );
  const readingNative = useRef(false);
  const nativeActive = useRef(false);
  const input = useRef({ time: 0 });
  const frame = useRef(0);
  const generation = useRef(0);
  const edge = useRef(0);
  const impact = useRef(0);
  const lastVelocity = useRef(0);
  const pointer = useRef<{
    id: number;
    coordinate: number;
    scale: number;
  } | null>(null);
  const handlers = useRef({
    change: (_position: number) => {},
    rest: () => {},
  });
  const [motion] = useState(() =>
    createTactileMotion({
      value: options.toPosition(selected),
      min: 0,
      max: options.total,
      onChange: (position) => handlers.current.change(position),
      onRest: () => handlers.current.rest(),
      onUpdate: (_, snapshot) => {
        lastVelocity.current = snapshot.velocity;
      },
    }),
  );

  const clearJobs = () => {
    generation.current++;
    clearTimeout(timer.current);
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  };
  const releaseCapture = () => {
    const held = pointer.current;
    pointer.current = null;
    if (held && surface.current?.hasPointerCapture?.(held.id))
      surface.current.releasePointerCapture(held.id);
  };
  const abort = () => {
    clearJobs();
    nativeWheel.current?.cancel();
    releaseCapture();
    nativeActive.current = false;
    active.current = false;
    pending.current.length = 0;
    wheelInput.reset();
    wheelActive.current = false;
    edge.current = 0;
    impact.current = 0;
    motion.stop();
  };
  const setSilently = (value: number) => {
    silent.current = true;
    motion.set(value);
    silent.current = false;
    nativeWheel.current?.sync(value);
    latest.current.paint();
  };
  const emit = (value: number, origin: RulerValueSource) => {
    if (value === current.current) return;
    current.current = value;
    setDisplay(value);
    if (latest.current.props.value === undefined) setInternal(value);
    // Recognize recent controlled echoes without rewinding a newer physics frame.
    pending.current.push(value);
    if (pending.current.length > 256) pending.current.shift();
    latest.current.props.onValueChange?.(value, { source: origin });
  };
  const complete = () => {
    clearJobs();
    if (!active.current) return;
    motion.stop();
    nativeActive.current = false;
    edge.current = 0;
    impact.current = 0;
    setSilently(latest.current.toPosition(current.current));
    active.current = false;
    wheelActive.current = false;
    latest.current.props.onValueChangeEnd?.(current.current);
    // Reconcile rejected controlled proposals after React commits final-frame feedback.
    setSettlement((count) => count + 1);
  };
  const finish = () => {
    clearJobs();
    if (!active.current) return;
    motion.stop();
    if (reducedMotion() || (edge.current === 0 && impact.current === 0)) {
      complete();
      return;
    }
    const from = rubberBand(edge.current);
    const kick = rubberBand(impact.current);
    impact.current = 0;
    const started = performance.now();
    const token = generation.current;
    const settleEdge = (time: number) => {
      if (token !== generation.current) return;
      const progress = Math.min(1, (time - started) / 280);
      edge.current = unRubberBand(returnEdge(from, kick, progress));
      latest.current.paint();
      if (progress < 1) frame.current = requestAnimationFrame(settleEdge);
      else complete();
    };
    frame.current = requestAnimationFrame(settleEdge);
  };
  const applyDelta = (delta: number, time = performance.now()) => {
    const { spacing, total } = latest.current;
    input.current.time = time;
    const previous = motion.getValue();
    const desired = previous + edge.current / spacing + delta;
    const bounded = Math.max(0, Math.min(total, desired));
    edge.current = (desired - bounded) * spacing;
    motion.drag(bounded - previous, time);
    if (bounded === previous) latest.current.paint();
  };
  handlers.current = {
    change(position) {
      if (!readingNative.current) nativeWheel.current?.sync(position);
      if (
        !silent.current &&
        motion.getSnapshot().state === "animating" &&
        (position === 0 || position === latest.current.total)
      ) {
        impact.current =
          Math.sign(lastVelocity.current) *
          Math.min(
            120,
            Math.abs(lastVelocity.current) * latest.current.spacing * 30,
          );
      }
      latest.current.paint();
      if (!active.current || silent.current) return;
      emit(
        latest.current.fromPosition(position),
        (source.current === "drag" || source.current === "wheel") &&
          motion.getSnapshot().state === "animating"
          ? "momentum"
          : source.current,
      );
    },
    rest: finish,
  };
  const startSession = () => {
    if (!active.current) {
      active.current = true;
      latest.current.props.onScrollStart?.();
    }
  };
  const begin = (origin: "drag" | "wheel") => {
    clearJobs();
    nativeWheel.current?.cancel();
    wheelActive.current = false;
    nativeActive.current = false;
    if (origin === "drag") {
      wheelInput.reset();
    }
    source.current = origin;
    impact.current = 0;
    const time = performance.now();
    input.current = {
      time: origin === "wheel" ? time - 1000 / 60 : time,
    };
    motion.start(input.current.time);
    if (origin === "wheel") startSession();
  };

  const {
    friction = 0.9,
    velocityMultiplier = 1,
    maxVelocity = 3,
    threshold = 0.01,
  } = options.props.motion ?? {};
  useEffect(() => {
    silent.current = true;
    motion.configure({
      min: 0,
      max: options.total,
      friction,
      velocityMultiplier,
      maxVelocity: maxVelocity / options.spacing,
      threshold: threshold / options.spacing,
    });
    silent.current = false;
  }, [
    motion,
    options.total,
    options.spacing,
    friction,
    velocityMultiplier,
    maxVelocity,
    threshold,
  ]);
  const geometry = useRef(options.geometry);
  useEffect(() => {
    const changed = geometry.current !== options.geometry;
    geometry.current = options.geometry;
    const feedback = pending.current.indexOf(selected);
    if (feedback !== -1) pending.current.splice(0, feedback + 1);
    if (
      !changed &&
      !options.props.disabled &&
      active.current &&
      (feedback !== -1 || selected === current.current)
    )
      return;
    abort();
    current.current = selected;
    setDisplay(selected);
    setSilently(options.toPosition(selected));
  }, [selected, options.geometry, options.props.disabled, settlement]);
  useEffect(() => () => abort(), []);

  // Detect capability after mounting so SSR and hydration render the same markup.
  useEffect(() => {
    const element = surface.current;
    if (
      !element ||
      options.props.disabled ||
      options.props.wheelSensitivity === 0 ||
      (typeof WheelEvent !== "undefined" &&
        "momentum" in WheelEvent.prototype)
    )
      return;
    const backend = attachNativeWheel(element, {
      vertical: options.vertical,
      total: options.total,
      spacing: options.spacing,
      sensitivity: options.props.wheelSensitivity ?? 1.8,
      onStart() {
        clearJobs();
        motion.stop();
        edge.current = 0;
        impact.current = 0;
        source.current = "wheel";
        nativeActive.current = true;
        startSession();
      },
      onMove(position) {
        readingNative.current = true;
        motion.set(position);
        readingNative.current = false;
        latest.current.paint();
      },
      onEnd: complete,
    });
    nativeWheel.current = backend;
    backend.sync(motion.getValue());
    return () => {
      backend.destroy();
      nativeWheel.current = null;
      nativeActive.current = false;
    };
  }, [
    options.geometry,
    options.props.disabled,
    options.props.wheelSensitivity,
  ]);

  // A native listener is required: React wheel listeners may be passive.
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      const { props, spacing, viewport, vertical } = latest.current;
      if (
        props.disabled ||
        event.ctrlKey ||
        pointer.current ||
        nativeWheel.current
      )
        return;
      // Use the browser's actual phase, not delta-shape guesses. Native
      // momentum is replaced by the same release physics as pointer dragging.
      if (
        (event as WheelEvent & { momentum?: boolean }).momentum === true
      ) {
        if ((props.wheelSensitivity ?? 1.8) === 0) return;
        event.preventDefault();
        if (wheelActive.current) {
          clearTimeout(timer.current);
          wheelActive.current = false;
          release(input.current.time);
        }
        return;
      }
      const raw = vertical
        ? event.deltaY
        : Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const unit =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport : 1;
      const sensitivity = props.wheelSensitivity ?? 1.8;
      const pixels = raw * unit;
      if (!Number.isFinite(pixels) || pixels === 0 || sensitivity === 0)
        return;
      event.preventDefault();
      const time = performance.now();
      const delta = wheelInput.take(
        pixels,
        time,
        spacing,
        props.motion?.maxVelocity ?? 3,
        sensitivity,
      );
      if (delta === 0) return;
      if (!wheelActive.current) {
        edge.current = 0;
        begin("wheel");
        wheelActive.current = true;
      }
      clearTimeout(timer.current);
      applyDelta(delta / spacing, time);
      timer.current = setTimeout(() => {
        wheelActive.current = false;
        // No native momentum phase followed (or the browser cannot expose it).
        // End a stationary/precision gesture without inventing release speed.
        finish();
      }, WHEEL_IDLE_MS);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [motion, surface]);

  const moveTo = (next: number, animated: boolean) => {
    if (latest.current.props.disabled) return;
    const target = latest.current.normalize(next);
    const destination = latest.current.toPosition(target);
    if (
      target === current.current &&
      motion.getValue() === destination &&
      !active.current
    )
      return;
    abort();
    source.current = "programmatic";
    active.current = true;
    if (!animated || reducedMotion()) {
      motion.set(destination);
      timer.current = setTimeout(
        () => handlers.current.rest(),
        WHEEL_IDLE_MS,
      );
      return;
    }
    // Target interpolation is a component/ref concern, distinct from free inertia.
    const from = motion.getValue();
    const started = performance.now();
    const token = generation.current;
    const animate = (time: number) => {
      if (token !== generation.current) return;
      const progress = Math.min(1, Math.max(0, (time - started) / 240));
      motion.set(from + (destination - from) * (1 - (1 - progress) ** 3));
      if (!active.current || token !== generation.current) return;
      if (progress < 1) frame.current = requestAnimationFrame(animate);
      else handlers.current.rest();
    };
    frame.current = requestAnimationFrame(animate);
  };
  const controls = useRef({ moveTo });
  controls.current = { moveTo };
  const navigate = useCallback(
    (value: number, animated: boolean) =>
      controls.current.moveTo(value, animated),
    [],
  );

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      latest.current.props.disabled ||
      event.button !== 0 ||
      event.isPrimary === false ||
      pointer.current
    )
      return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    const vertical = latest.current.vertical;
    const scale =
      (vertical
        ? rect.height / event.currentTarget.clientHeight
        : rect.width / event.currentTarget.clientWidth) || 1;
    pointer.current = {
      id: event.pointerId,
      coordinate: vertical ? event.clientY : event.clientX,
      scale,
    };
    begin("drag");
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const held = pointer.current;
    if (
      latest.current.props.disabled ||
      !held ||
      held.id !== event.pointerId
    )
      return;
    const coordinate = latest.current.vertical
      ? event.clientY
      : event.clientX;
    const delta =
      (held.coordinate - coordinate) /
      held.scale /
      latest.current.spacing;
    held.coordinate = coordinate;
    if (delta) {
      startSession();
      if (pointer.current === held) applyDelta(delta);
    }
  };
  const release = (time?: number) => {
    // Already-held overscroll returns from its current displacement. Adding
    // another outward impulse here makes a release look delayed.
    if (reducedMotion() || edge.current !== 0) finish();
    else motion.release(time);
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointerMove(event);
    releaseCapture();
    release();
  };
  const pointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    releaseCapture();
    finish();
  };
  const getPosition = useCallback(
    () =>
      nativeActive.current && nativeWheel.current
        ? nativeWheel.current.getPosition()
        : motion.getValue() +
          rubberBand(edge.current) / latest.current.spacing,
    [motion],
  );
  return {
    display,
    getPosition,
    navigate,
    getValue: () => current.current,
    events: {
      onPointerDown: pointerDown,
      onPointerMove: pointerMove,
      onPointerUp: pointerUp,
      onPointerCancel: pointerCancel,
      onLostPointerCapture: pointerCancel,
    },
  };
}
