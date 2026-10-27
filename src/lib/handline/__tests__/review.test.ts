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

describe('landing: how far into the target the tip goes', () => {
  const target = { kind: 'circle' as const, cx: 400, cy: 100, r: 30 };
  const base = {
    from: { x: 40, y: 100 },
    to: { x: 400, y: 100 },
    toShape: target,
    gesture: 'straight' as const,
    seed: 'land',
  };

  it('land 0 stops a gap short of the edge (the default)', () => {
    near(buildLine({ ...base, gap: 6 }).end.x, 400 - 36, 0.05);
  });

  it('land 1 reaches the aim point', () => {
    const d = buildLine({ ...base, land: 1 });
    near(d.end.x, 400, 1e-6);
    near(d.end.y, 100, 1e-6);
  });

  it('land 0.5 stops halfway from the edge to the aim point, along the line', () => {
    near(buildLine({ ...base, land: 0.5 }).end.x, 400 - 15, 0.05);
  });

  it('an off-centre aim lands on that point, still trimmed to the shape at 0', () => {
    const aim = { x: 388, y: 88 }; // up and left of the centre, inside the circle
    const at1 = buildLine({ ...base, to: aim, land: 1 });
    near(at1.end.x, aim.x, 1e-6);
    near(at1.end.y, aim.y, 1e-6);
    const at0 = buildLine({ ...base, to: aim, land: 0, gap: 0 });
    const r = Math.hypot(at0.end.x - target.cx, at0.end.y - target.cy);
    near(r, target.r, 0.05, 'should stop on the edge:');
  });
});
