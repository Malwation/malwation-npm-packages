import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutGraph } from '../src/layout/layered.js';
import { parseGraph } from '../src/parse/graph.js';

const lay = (src) => layoutGraph(parseGraph(src));
const node = (l, id) => l.nodes.find((n) => n.id === id);
const container = (l, id) => l.containers.find((n) => n.id === id);
const cx = (r) => r.x + (r.w >> 1);

test('box node sized label+4 rounded up to even, x 3', () => {
  const l = lay('a: [ hello ]');
  const a = node(l, 'a');
  assert.equal(a.w, 10); // 5 + 4 = 9 → even 10
  assert.equal(a.h, 3);
  assert.ok(l.width >= a.x + a.w);
  assert.ok(l.height >= a.y + a.h);
});

test('all node widths are even (stable integer centers)', () => {
  const l = lay('a: [x]\nb: (abc)\nc: {four}\nd: [12345]');
  for (const n of l.nodes) assert.equal(n.w % 2, 0, `${n.id} width even`);
});

test('stadium and diamond sizes', () => {
  const l = lay('s: (ok)\nd: {ok}');
  assert.equal(node(l, 's').w, 8);
  assert.equal(node(l, 's').h, 3);
  assert.equal(node(l, 'd').w, 10);
  assert.equal(node(l, 'd').h, 5);
});

test('a->b TD: b below a, centers aligned, straight 2-point edge', () => {
  const l = lay('a: [A]\nb: [B]\na -> b');
  const a = node(l, 'a');
  const b = node(l, 'b');
  assert.ok(b.y >= a.y + a.h + 2, 'b below a with gap');
  assert.equal(cx(a), cx(b));
  assert.equal(l.edges.length, 1);
  assert.equal(l.edges[0].points.length, 2);
  assert.equal(l.edges[0].arrow, true);
});

test('fan a->b,a->c: same rank, no overlap, elbow edges', () => {
  const l = lay('a: [A]\nb: [B]\nc: [C]\na -> b\na -> c');
  const b = node(l, 'b');
  const c = node(l, 'c');
  assert.equal(b.y, c.y);
  const [left, right] = b.x < c.x ? [b, c] : [c, b];
  assert.ok(left.x + left.w < right.x, 'no horizontal overlap');
  for (const e of l.edges) assert.equal(e.points.length, 4);
});

test('edge layout carries arrow/both/variant; line has no arrow', () => {
  const l = lay('a: [A]\nb: [B]\nc: [C]\nd: [D]\na -> b\nb <-> c : x [err]\nc -- d');
  const byPair = (f, t) => l.edges.find((e) => e.from === f && e.to === t);
  assert.equal(byPair('a', 'b').arrow, true);
  assert.equal(byPair('a', 'b').both, false);
  assert.equal(byPair('b', 'c').both, true);
  assert.equal(byPair('b', 'c').variant, 'err');
  assert.equal(byPair('c', 'd').arrow, false);
});

test('ports: fan-out spreads edge start points across the source side', () => {
  const l = lay('a: [source]\nb: [B]\nc: [C]\na -> b\na -> c');
  const [e1, e2] = l.edges;
  assert.notEqual(e1.points[0].x, e2.points[0].x, 'distinct start ports');
  const a = node(l, 'a');
  for (const e of l.edges) {
    assert.ok(e.points[0].x > a.x && e.points[0].x < a.x + a.w, 'port inside source side');
    assert.equal(e.points[0].y, a.y + a.h, 'leaves from bottom side');
  }
});

test('ports: fan-in spreads edge end points across the target side', () => {
  const l = lay('x: [X]\ny: [Y]\nz: [sink node]\nx -> z\ny -> z');
  const [e1, e2] = l.edges;
  const p1 = e1.points[e1.points.length - 1];
  const p2 = e2.points[e2.points.length - 1];
  assert.notEqual(p1.x, p2.x, 'distinct end ports');
});

test('lanes: elbows crossing the same gap take distinct mid heights', () => {
  const l = lay('a: [A]\nb: [B]\nc: [C]\na -> b\na -> c');
  const my = l.edges.map((e) => e.points[1].y);
  assert.notEqual(my[0], my[1], 'distinct lanes');
  for (const e of l.edges) {
    const sy = e.points[0].y;
    const ty = e.points[e.points.length - 1].y;
    assert.ok(e.points[1].y > sy && e.points[1].y < ty, 'lane inside the gap');
  }
});

test('LR direction places target to the right', () => {
  const l = lay('graph LR\na: [A]\nb: [B]\na -> b');
  const a = node(l, 'a');
  const b = node(l, 'b');
  assert.ok(b.x >= a.x + a.w + 2);
});

test('interactive flag passes through to the layout result', () => {
  assert.equal(lay('graph TD interactive\na -> b').interactive, true);
  assert.equal(lay('a: [A]').interactive, false);
});

test('iso projection flag passes through to the layout result', () => {
  const l = lay('graph TD iso\na: [A]\nb: [B]\na -> b');
  assert.equal(l.projection, 'iso');
  assert.equal(lay('a: [A]').projection, null);
});

test('BT direction places target above source', () => {
  const l = lay('graph BT\na: [A]\nb: [B]\na -> b');
  const a = node(l, 'a');
  const b = node(l, 'b');
  assert.ok(b.y + b.h <= a.y, 'b above a');
  // straight edge leaves from source top going up
  const e = l.edges[0];
  assert.ok(e.points[0].y <= a.y, 'edge starts at/above source top');
});

test('RL direction places target to the left', () => {
  const l = lay('graph RL\na: [A]\nb: [B]\na -> b');
  const a = node(l, 'a');
  const b = node(l, 'b');
  assert.ok(b.x + b.w <= a.x, 'b left of a');
});

test('container wraps child; child positioned inside container rect', () => {
  const l = lay('s: [[ Sandbox ]]\ns.p: [mal.exe]');
  const s = container(l, 's');
  const p = node(l, 'p') ?? node(l, 's.p');
  assert.ok(s, 'container emitted');
  assert.ok(p, 'child emitted');
  assert.ok(p.x >= s.x + 1 && p.x + p.w <= s.x + s.w - 1, 'inside horizontally');
  assert.ok(p.y >= s.y + 1 && p.y + p.h <= s.y + s.h - 1, 'inside vertically');
});

test('edge from nested child to outside starts at the child rect', () => {
  const l = lay('s: [[ S ]]\ns.p: [P]\nout: (Done)\ns.p -> out');
  const p = node(l, 's.p');
  const e = l.edges[0];
  const first = e.points[0];
  assert.equal(first.y, p.y + p.h, 'starts at child bottom edge');
  assert.ok(first.x >= p.x && first.x <= p.x + p.w, 'within child x-range');
});

test('cycle a->b->a terminates with both placed', () => {
  const l = lay('a: [A]\nb: [B]\na -> b\nb -> a');
  assert.equal(l.nodes.length, 2);
  assert.equal(l.edges.length, 2);
});

test('rects are non-negative integers; edge points finite', () => {
  const l = lay('s: [[S]]\ns.a: [A]\ns.b: {B?}\nc: (C)\ns.a -> s.b\ns.b -> c\nc -> s.a');
  const all = [...l.nodes, ...l.containers];
  for (const n of all) {
    for (const v of [n.x, n.y, n.w, n.h]) {
      assert.ok(Number.isInteger(v) && v >= 0, `bad coord ${v} on ${n.id}`);
    }
  }
  for (const e of l.edges) {
    for (const p of e.points) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'edge point finite');
    }
  }
  assert.ok(Number.isInteger(l.width) && Number.isInteger(l.height));
});
