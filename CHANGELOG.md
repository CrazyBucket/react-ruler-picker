# Changelog

## 0.3.0

### Breaking changes

- Removed the `onKeyDown` and `onKeyUp` props; the component no longer exposes keyboard event handling.

### Documentation

- Removed internal wheel validation notes and streamlined the README and Playground documentation.

## 0.2.0

### Added

- Physics-based drag, momentum scrolling, and elastic edge bounce.
- Mouse wheel and trackpad input with configurable `wheelSensitivity`.
- Unified pointer input for mouse, touch, and pen.
- `prefers-reduced-motion` support and React 16.8+ compatibility.

### Breaking changes

- Removed the `platform` prop and `RulerPlatform` type.
- Added `motion` options and the `'wheel'` `onValueChange` source.
- Renamed internal `.rrp-scroll` / `.rrp-content` classes to `.rrp-surface`.
- Animated `scrollToValue` now emits intermediate `programmatic` values.
