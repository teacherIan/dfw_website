import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  curvatures,
  dist,
  flattenPath,
  measure,
  resample,
  sampleAt,
  shapeDistance,
  trimEnd,
  trimStart,
  type Pt,
} from '../geom';

const near = (a: number, b: number, tol: number, msg?: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b} ± ${tol}, got ${a}`);

describe('flattenPath', () => {
  it('measures a straight line exactly', () => {
    const [p] = flattenPath('M0 0 L30 40');
    near(measure(p).length, 50, 1e-9);
  });

  it('reads relative, H/V and implicit-L commands', () => {
    // m's extra pair is an implicit relative l: (10,10) → (30,10) → h → v.
    const [p] = flattenPath('m10 10 20 0 h20 v20');
    const last = p[p.length - 1];
    assert.deepEqual({ x: Math.round(last.x), y: Math.round(last.y) }, { x: 50, y: 30 });
  });

  it('approximates a quarter circle drawn as a cubic', () => {
    const k = 0.5523 * 100;
    const [p] = flattenPath(`M100 0 C100 ${k}, ${k} 100, 0 100`);
    near(measure(p).length, (Math.PI * 100) / 2, 0.2);
  });

  it('draws an arc through its end point with the right length', () => {
    const [p] = flattenPath('M0 0 A50 50 0 0 1 100 0');
    const last = p[p.length - 1];
    near(last.x, 100, 1e-6);
    near(measure(p).length, Math.PI * 50, 0.3);
  });

  it('reflects the last control point for S', () => {
    const a = flattenPath('M0 0 C10 -20, 30 -20, 40 0 C50 20, 70 20, 80 0')[0];
    const b = flattenPath('M0 0 C10 -20, 30 -20, 40 0 S70 20, 80 0')[0];
    near(measure(a).length, measure(b).length, 1e-9);
  });

  it('keeps the old desktop arrows whole (one subpath, ends where drawn)', () => {
    const [p] = flattenPath(
      'M2 25 C 10 25, 14 15, 20 12 C 26 9, 30 18, 27 24 C 24 30, 18 27, 21 21 C 24 15, 34 12, 44 16 C 50 18, 55 25, 76 25'
    );
    assert.deepEqual(p[0], { x: 2, y: 25 });
    near(p[p.length - 1].x, 76, 1e-9);
  });
});

describe('measure / resample', () => {
  it('resamples evenly and keeps both ends exactly', () => {
    const m = measure(flattenPath('M0 0 Q50 80 100 0', 0.5)[0]);
    const r = resample(m, 2);
    assert.deepEqual(r[0], { x: 0, y: 0 });
    near(r[r.length - 1].x, 100, 1e-9);
    const gaps = r.slice(1).map((p, i) => dist(r[i], p));
    near(Math.max(...gaps) - Math.min(...gaps), 0, 0.05, 'uneven spacing:');
  });

  it('samples the direction of travel', () => {
    const m = measure([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    near(sampleAt(m, 5).angle, 0, 1e-9);
    near(sampleAt(m, 15).angle, Math.PI / 2, 1e-9);
  });

  it('finds curvature 1/r on a circle', () => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI;
      pts.push({ x: 20 * Math.cos(a), y: 20 * Math.sin(a) });
    }
    const k = curvatures(pts);
    near(k[100], 1 / 20, 0.002);
  });
});

describe('shapes and trimming', () => {
  it('measures distance to a rounded rectangle', () => {
    const s = { kind: 'rect' as const, x: 0, y: 0, w: 100, h: 40, r: 10 };
    near(shapeDistance({ x: 50, y: 20 }, s), -20, 1e-9);
    near(shapeDistance({ x: 150, y: 20 }, s), 50, 1e-9);
    // Diagonally off a rounded corner: distance to the arc, not the box corner.
    near(shapeDistance({ x: 110, y: -10 }, s), Math.hypot(20, 20) - 10, 1e-9);
  });

  it('stops a line at a round button, a gap short of its edge', () => {
    const line = resample(measure(flattenPath('M0 0 L200 0')[0]), 1.5);
    const button = { kind: 'circle' as const, cx: 200, cy: 0, r: 30 };
    const t = trimEnd(line, button, 6);
    near(t[t.length - 1].x, 200 - 36, 0.01);
  });

  it('starts a line where it leaves its label', () => {
    const line = resample(measure(flattenPath('M50 20 L300 20')[0]), 1.5);
    const label = { kind: 'rect' as const, x: 0, y: 0, w: 100, h: 40 };
    near(trimStart(line, label, 4)[0].x, 104, 0.01);
  });

  it('trims a looping line at its LAST entry into the target', () => {
    // Passes through the target, leaves, comes back: only the final entry counts.
    const pts = resample(measure(flattenPath('M0 0 L100 0 L100 60 L60 60 L60 0')[0]), 1);
    const target = { kind: 'circle' as const, cx: 60, cy: 0, r: 10 };
    const t = trimEnd(pts, target, 0);
    near(t[t.length - 1].x, 60, 0.01);
    near(t[t.length - 1].y, 10, 0.01);
  });

  it('leaves a line alone when its end is outside the shape', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    assert.equal(trimEnd(line, { kind: 'circle', cx: 100, cy: 0, r: 5 }), line);
  });
});
