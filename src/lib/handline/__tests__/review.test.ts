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

describe('reach: how far into the target the tip goes, in px', () => {
  const target = { kind: 'circle' as const, cx: 400, cy: 100, r: 30 };
  const base = {
    from: { x: 40, y: 100 },
    to: { x: 400, y: 100 },
    toShape: target,
    gesture: 'straight' as const,
    seed: 'reach',
  };

  it('a negative reach stops that far short of the edge (default −6)', () => {
    near(buildLine({ ...base }).end.x, 400 - 36, 0.05);
    near(buildLine({ ...base, reach: -10 }).end.x, 400 - 40, 0.05);
  });

  it('a positive reach goes that many px past the edge', () => {
    near(buildLine({ ...base, head: 'none', reach: 12 }).end.x, 370 + 12, 0.05);
  });

  it("'center' reaches the aim point", () => {
    const d = buildLine({ ...base, reach: 'center' });
    near(d.end.x, 400, 1e-6);
    near(d.end.y, 100, 1e-6);
  });

  it('never leaves an arrowhead straddling the border', () => {
    // A chevron on the ink pen is ~10.4 px long at 27°: ~9.3 px back from the tip.
    near(buildLine({ ...base, head: 'chevron', reach: 4 }).end.x, 370 - 2, 0.05);
    near(buildLine({ ...base, head: 'chevron', reach: 9 }).end.x, 370 + 9.27 + 3, 0.1);
    near(buildLine({ ...base, head: 'none', reach: 4 }).end.x, 370 + 4, 0.05);
  });

  it('an off-centre aim lands on that point with center, and on the edge at reach 0', () => {
    const aim = { x: 388, y: 88 };
    const c = buildLine({ ...base, to: aim, reach: 'center' });
    near(c.end.x, aim.x, 1e-6);
    near(c.end.y, aim.y, 1e-6);
    const e = buildLine({ ...base, to: aim, head: 'none', reach: 0 });
    near(Math.hypot(e.end.x - target.cx, e.end.y - target.cy), target.r, 0.05);
  });
});

describe('audit fixes', () => {
  it("'arc' and bow actually bow the line", () => {
    const p = gesturePoints({ kind: 'arc', bow: 0.2 }, 300, rng('x'));
    const mid = p.reduce((a, b) => (Math.abs(b.x - 150) < Math.abs(a.x - 150) ? b : a));
    near(mid.y, 60, 1.5);
    const q = gesturePoints('straight', 300, rng('x'), { bow: 0.1 });
    const qm = q.reduce((a, b) => (Math.abs(b.x - 150) < Math.abs(a.x - 150) ? b : a));
    near(qm.y, 30, 1.5);
  });

  it('the ring goes round the corners of a wide target, not through them', () => {
    const rect = { kind: 'rect' as const, x: 340, y: 82, w: 120, h: 36, r: 8 };
    const d = buildLine({
      from: { x: 40, y: 100 },
      to: { x: 400, y: 100 },
      toShape: rect,
      head: 'none',
      ring: true,
      seed: 'ring',
    });
    const ringStrokes = d.strokes.slice(-40); // the ring is drawn last
    const cx = 400;
    const cy = 100;
    let least = Infinity;
    for (const s of ringStrokes) {
      const n = s.d.match(/-?[\d.]+/g)!.map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) {
        const u = (n[i] - cx) / 60;
        const v = (n[i + 1] - cy) / 18;
        least = Math.min(least, u * u + v * v);
      }
    }
    // The rect's corners sit at u² + v² = 2 in these units.
    assert.ok(least > 1.85, `ring passes inside the corners (min ${least.toFixed(2)})`);
  });
});
