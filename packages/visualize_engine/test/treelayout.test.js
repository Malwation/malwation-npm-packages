import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTree } from '../src/layout/tree.js';
import { parseTree } from '../src/parse/tree.js';

const lay = (src) => layoutTree(parseTree(src));
const byLabel = (l, label) => l.nodes.find((n) => n.label === label);
const cx = (r) => r.x + (r.w >> 1);

test('root centered over two leaves', () => {
  const l = lay('a\n  b\n  c');
  const a = byLabel(l, 'a');
  const b = byLabel(l, 'b');
  const c = byLabel(l, 'c');
  const spanCenter = (b.x + c.x + c.w) >> 1;
  assert.equal(cx(a), spanCenter);
});

test('leaves do not overlap, >=2 col gap', () => {
  const l = lay('a\n  b\n  c\n  d');
  const xs = l.nodes.filter((n) => n.label !== 'a').sort((p, q) => p.x - q.x);
  for (let i = 1; i < xs.length; i++) {
    assert.ok(xs[i].x >= xs[i - 1].x + xs[i - 1].w + 2);
  }
});

test('depth step is 5 rows', () => {
  const l = lay('a\n  b\n    c');
  assert.equal(byLabel(l, 'b').y - byLabel(l, 'a').y, 5);
  assert.equal(byLabel(l, 'c').y - byLabel(l, 'b').y, 5);
});

test('multiple roots placed side by side', () => {
  const l = lay('a\nb');
  const a = byLabel(l, 'a');
  const b = byLabel(l, 'b');
  assert.equal(a.y, b.y);
  assert.ok(b.x >= a.x + a.w + 2 || a.x >= b.x + b.w + 2);
});

test('edges are parent->child elbows without arrows', () => {
  const l = lay('a\n  b\n  c');
  assert.equal(l.edges.length, 2);
  for (const e of l.edges) {
    assert.equal(e.arrow, false);
    assert.ok(e.points.length === 2 || e.points.length === 4);
    const a = byLabel(l, 'a');
    assert.equal(e.points[0].y, a.y + a.h, 'starts at parent bottom');
  }
});

test('unique ids assigned, coords are non-negative integers', () => {
  const l = lay('a [stadium]\n  b\n  c [diamond]\nd');
  const ids = new Set(l.nodes.map((n) => n.id));
  assert.equal(ids.size, l.nodes.length);
  for (const n of l.nodes) {
    for (const v of [n.x, n.y, n.w, n.h]) assert.ok(Number.isInteger(v) && v >= 0);
  }
  assert.deepEqual(l.containers, []);
  assert.ok(l.width > 0 && l.height > 0);
});
