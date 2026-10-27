// Everything but the React bindings: for plain DOM pages, prerendering,
// tests, or a bundle with no React in it.
export { buildLine, buildArt } from './build';
export type { Drawing, LineInput, ArtInput, LineStyle, Timing } from './build';
export { GESTURES, DFW_PATHS } from './gestures';
export type { GestureSpec, GestureName } from './gestures';
export { PENS, resolvePen } from './pen';
export type { Pen, PenName, PenInput } from './pen';
export type { HeadKind, HeadSpec, TailKind, MarksSpec } from './ends';
export type { Side, SideInput, Reach } from './fit';
export { DEFAULT_REACH } from './fit';
export { measure } from './geom';
export type { Pt, Rect, Shape } from './geom';
export { InkView, toSVGString, prefersReducedMotion } from './dom';
export type { Motion } from './dom';
export { createLine } from './line';
export type { LiveLine, LineController } from './line';
export type { AnchorInput, AnchorSpec } from './anchor';
export { follow } from './track';
