# Wheel validation — 0.2.0

Validated on 2026-09-20. Automated tests protect input/ownership contracts; browser replay measures rendered behavior. Neither substitutes for physical-device evaluation.

## Engine path

The local browser exposes `WheelEvent.momentum`. Two real RulerPicker instances received equivalent scripted inputs: six 8px moves, approximately 16ms apart, tickSpacing 8, wheelSensitivity 1, starting at 500. Pointer input ended with pointerup; wheel input transitioned to momentum on the next event. Another 100 native-momentum events continued to arrive.

- Both controls settled at 515.
- Maximum sampled displayed-value difference: 1 tick.
- Both end notifications arrived approximately 612ms after pointer release.
- Wheel emitted one end notification; continuing platform momentum did not restart it.

Two successive outward gestures at the same maximum boundary both worked. The visual offset decreased from 18.96px to 16.18px / 15.69px at the first observation after release, returned to zero in 282ms / 291ms, and emitted one end notification per gesture. Values stayed bounded.

These are browser replay measurements with normal scheduling jitter, not universal timing guarantees. The user separately evaluated the momentum-aware interaction positively on their device.

## Native fallback

The capability was disabled in an isolated browser page before mounting. This exercises the fallback code, not an actual older browser engine.

- A real scroll container started at scrollLeft 4000 for value 500 (8px spacing).
- Browser wheel input updated scrollLeft and selected value together.
- Scrolling reached 1000; a small inward gesture immediately changed it to 993.
- Browser verification caught an initial-offset bug that DOM unit tests missed: overflow CSS must be installed before setting scrollLeft. This was fixed.
- Platform-specific elastic bounce was not asserted. Fallback deliberately delegates it to the browser.

## Repeatable checks

`npm run check` passes 118 tests, types, packed ESM/CJS SSR, tree-shaking, size and production demo build. `npm run test:react16` passes with React 16.8.6.

Regression coverage includes actual native scroll events, controlled feedback, reverse/vertical scales, range compression, interruption/cleanup, momentum handoff, continuous precision input, ignored platform tail, release-time edge return and repeated boundary gestures. Temporary browser diagnostic pages are excluded from the release and removed after validation.
