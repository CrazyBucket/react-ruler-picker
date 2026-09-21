# Changelog

## 0.2.0

### Features & Improvements

- **Motion Physics Engine**: Integrated `tactile-motion` for fluid momentum scrolling, continuous velocity tracking, and configurable physics (`friction`, `velocityMultiplier`, `maxVelocity`, `threshold`).
- **Elastic Edge Overscroll**: Added elastic resistance when dragging or scrolling beyond bounds, with a smooth 280ms bounce-back animation. Selection values remain strictly clamped within `[min, max]`.
- **Enhanced Wheel & Trackpad Support**:
  - Direct support for mouse wheel and trackpad with configurable `wheelSensitivity`.
  - Automatically transitions trackpad momentum gestures to engine inertia where supported (`WheelEvent.momentum`), with seamless fallback to native browser scrolling on other environments.
  - Added `'wheel'` change source to `onValueChange` metadata.
- **Unified Pointer Events**: Standardized mouse, touch, and pen interactions across all platforms without platform-specific hacks.
- **Accessibility & Motion Preferences**: Fully respects `prefers-reduced-motion` by disabling inertia and transition animations.
- **React Compatibility**: Maintained compatibility across React 16.8+ through React 19+.

### Breaking Changes

- Removed `platform` prop and `RulerPlatform` type export; the component now uses a unified interaction engine.
- Removed built-in keyboard event handling; consumers can attach `onKeyDown`/`onKeyUp` to the focusable surface and drive the ruler via ref methods.
- Replaced internal CSS classes `.rrp-scroll` and `.rrp-content` with `.rrp-surface`.
- `scrollToValue` with `animated: true` now emits intermediate programmatic values during transit until settling.
