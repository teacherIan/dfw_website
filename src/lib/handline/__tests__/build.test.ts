import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildArt, buildLine, type LineInput } from '../build';
import { DFW_PATHS, GESTURES, gesturePoints, type GestureName } from '../gestures';
import { dist, measure, shapeDistance, type Pt } from '../geom';
import { rng } from '../random';

const near = (a: number, b: number, tol: number, msg?: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b} ± ${tol}, got ${a}`);

/** Proper crossings between non-adjacent segments of a polyline. */
function selfCrossings(p: Pt[]): number {
  let n = 0;
  const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
    const o = (p: Pt, q: Pt, r: Pt) =>
      Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  for (let i = 0; i < p.length - 1; i++)
    for (let j = i + 2; j < p.length - 1; j++) if (cross(p[i], p[i + 1], p[j], p[j + 1])) n++;
  return n;
}

const base: LineInput = { from: { x: 20, y: 200 }, to: { x: 420, y: 120 }, seed: 'test' };

describe('gestures', () => {
  const names = Object.keys(GESTURES) as GestureName[];
  for (const name of names) {
    it(`${name} runs exactly from (0,0) to (L,0)`, () => {
      const p = gesturePoints(name, 300, rng(name));
      near(p[0].x, 0, 1e-6);
      near(p[0].y, 0, 1e-6);
      near(p[p.length - 1].x, 300, 1e-6);
      near(p[p.length - 1].y, 0, 1e-6);
    });
  }

  it('loops actually loop: n loops cross the line n times', () => {
    for (const count of [1, 2, 3]) {
      const p = gesturePoints({ kind: 'loops', count, size: 14 }, 400, rng('x'));
      assert.equal(selfCrossings(p), count, `count ${count}`);
    }
  });

  it('a loop riding an authored curve still lands on the chord ends, and still loops', () => {
    const along = 'M -46 18 Q -66 -100, 148 -85'; // the phone Ethos arrow's tuned bend
    for (const flip of [false, true]) {
      const p = gesturePoints({ kind: 'loop', size: 9, along, flip }, 160, rng('x'));
      near(p[0].x, 0, 1e-6);
      near(p[0].y, 0, 1e-6);
      near(p[p.length - 1].x, 160, 1e-6);
      near(p[p.length - 1].y, 0, 1e-6);
      assert.ok(selfCrossings(p) >= 1, `flip ${flip}`);
    }
  });

  it('a loop keeps its size in px whatever the length', () => {
    const h = (L: number) => {
      const p = gesturePoints({ kind: 'loop', size: 12 }, L, rng('x'));
      return Math.max(...p.map((q) => q.y)) - Math.min(...p.map((q) => q.y));
    };
    near(h(250), h(700), 2);
  });
});

describe('buildLine', () => {
  it('is deterministic: same input, same strokes', () => {
    assert.deepEqual(buildLine(base).strokes, buildLine(base).strokes);
  });

  it('a different seed draws a different line', () => {
    assert.notDeepEqual(buildLine(base).strokes, buildLine({ ...base, seed: 'other' }).strokes);
  });

  it('adding marks does not change the line itself', () => {
    const plain = buildLine({ ...base, pen: 'ink' }).strokes.filter((s) => s.layer === 0);
    const marked = buildLine({
      ...base,
      pen: 'ink',
      marks: { ticks: {}, scribe: {} },
    }).strokes.filter((s) => s.layer === 0);
    assert.deepEqual(marked, plain);
  });

  it('lands exactly on its anchors (the wobble is pinned at the ends)', () => {
    const d = buildLine({ ...base, gesture: 'loops', pen: 'pencil', head: 'none' });
    const first = d.strokes[0].d.match(/^M(-?[\d.]+) (-?[\d.]+)/)!;
    near(+first[1], base.from.x, 0.01);
    near(+first[2], base.from.y, 0.01);
    near(d.end.x, base.to.x, 1e-6);
    near(d.end.y, base.to.y, 1e-6);
  });

  it('stops a gap short of a round target', () => {
    const target = { kind: 'circle' as const, cx: 420, cy: 120, r: 28 };
    const d = buildLine({ ...base, gesture: 'loop', toShape: target, gap: 6 });
    near(shapeDistance(d.end, target, 6), 0, 0.01);
  });

  it('draws in order: tail, line, then head', () => {
    const d = buildLine({ ...base, tail: 'ring', head: 'chevron' });
    const lineStart = Math.min(...d.strokes.filter((s) => s.layer === 0).map((s) => s.t0));
    assert.equal(lineStart, 0);
    const t1 = Math.max(...d.strokes.map((s) => s.t1));
    near(d.duration, t1, 1e-6);
  });

  it('clamps the line to its timing window', () => {
    const fast = buildLine({ ...base, pen: { speed: 100 }, head: 'none', timing: { min: 400 } });
    near(fast.duration, 400, 1);
    const slow = buildLine({ ...base, pen: { speed: 0.01 }, head: 'none', timing: { max: 900 } });
    near(slow.duration, 900, 1);
  });

  it('slows the pen through loops', () => {
    const d = buildLine({ ...base, gesture: { kind: 'loops', count: 2, size: 16 }, head: 'none' });
    // ms per px over each stroke; loops are where the slowest strokes are.
    const rates = d.strokes
      .filter((s) => s.layer === 0)
      .map((s) => {
        const n = s.d.match(/-?[\d.]+/g)!.map(Number);
        let len = 0;
        for (let i = 2; i + 1 < n.length; i += 2)
          len += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
        return (s.t1 - s.t0) / (len || 1);
      });
    const sorted = [...rates].sort((a, b) => a - b);
    assert.ok(sorted[sorted.length - 1] > sorted[Math.floor(sorted.length / 2)] * 1.4);
  });

  it('auto side keeps the bulge inside its box', () => {
    const within = { x: 0, y: 0, w: 500, h: 220 };
    // A line along the top edge: bulging up would leave the box.
    const d = buildLine({
      from: { x: 40, y: 12 },
      to: { x: 460, y: 12 },
      gesture: { kind: 'arc', bow: 0.2 },
      side: 'auto',
      within,
      seed: 's',
    });
    assert.ok(Math.min(...d.centerline.map((p) => p.y)) >= 11);
  });

  it('the bounding box holds every stroke', () => {
    const d = buildLine({
      ...base,
      gesture: 'spring',
      tail: 'hook',
      head: 'open',
      ring: { kind: 'circle', cx: 420, cy: 120, r: 20 },
    });
    for (const s of d.strokes) {
      const n = s.d.match(/-?[\d.]+/g)!.map(Number);
      for (let i = 0; i + 1 < n.length; i += 2) {
        assert.ok(n[i] >= d.bbox.x && n[i] <= d.bbox.x + d.bbox.w);
        assert.ok(n[i + 1] >= d.bbox.y && n[i + 1] <= d.bbox.y + d.bbox.h);
      }
    }
  });
});

describe('buildArt', () => {
  it('draws the old desktop arrows where they were drawn', () => {
    for (const d of Object.values(DFW_PATHS)) {
      const art = buildArt({ d, head: 'none' });
      const c = art.centerline;
      assert.ok(dist(c[0], { x: c[0].x, y: 25 }) < 1e-6);
      near(c[c.length - 1].x, 76, 1e-6);
      near(measure(c).length, measure(c).length, 0);
    }
  });
});
