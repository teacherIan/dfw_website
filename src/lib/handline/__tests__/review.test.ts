/**
 * Regressions from the first review of the library (2026-10-26). Each test
 * failed before its fix.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildArt, buildLine } from '../build';
import { flattenPath, measure } from '../geom';
import { gesturePoints } from '../gestures';
import { rng } from '../random';

const near = (a: number, b: number, tol: number, msg?: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b} ± ${tol}, got ${a}`);

describe('review fixes', () => {
  it('stray numbers after Z are skipped, not looped on forever', () => {
    const subs = flattenPath('M0 0 L10 0 L10 10 Z 5 5');
    assert.equal(subs.length, 1);
  });

  it('reads compact arc flags (a5 5 0 1010 0, as svgo writes them)', () => {
    const [compact] = flattenPath('M0 0 a5 5 0 1010 0');
    const [spaced] = flattenPath('M0 0 a5 5 0 1 0 10 0');
    assert.ok(compact, 'the arc vanished');
    near(compact[compact.length - 1].x, 10, 1e-6);
    near(measure(compact).length, measure(spaced).length, 1e-6);
  });

  it('an empty or M-only authored path draws nothing instead of throwing', () => {
    for (const d of ['', 'M5 5']) {
      const art = buildArt({ d });
      assert.equal(art.strokes.length, 0, d);
      assert.equal(art.duration, 0, d);
    }
  });

  it('a closed authored path as a gesture stays the size of the line', () => {
    const p = gesturePoints({ kind: 'path', d: 'M0 0 C 40 -40, 80 40, 0 0' }, 400, rng('x'));
    const xs = p.map((q) => q.x);
    const ys = p.map((q) => q.y);
    assert.ok(Math.max(...xs) - Math.min(...xs) <= 460, 'blew up horizontally');
    assert.ok(Math.max(...ys) - Math.min(...ys) <= 460, 'blew up vertically');
    near(p[p.length - 1].x, 400, 1e-6);
    near(p[p.length - 1].y, 0, 1e-6);
  });

  it('a scribe dash pattern that adds up to nothing does not hang', () => {
    const d = buildLine({
      from: { x: 0, y: 0 },
      to: { x: 200, y: 0 },
      marks: { scribe: { dash: [0, 0] } },
      seed: 's',
    });
    assert.ok(d.strokes.length > 0);
  });

  it('duration covers every stroke, extra passes included', () => {
    const d = buildLine({
      from: { x: 0, y: 0 },
      to: { x: 300, y: 60 },
      pen: 'graphite',
      head: 'none',
    });
    const last = Math.max(...d.strokes.map((s) => s.t1));
    assert.ok(d.duration >= last - 1e-9, `duration ${d.duration} < last stroke ${last}`);
  });
});
