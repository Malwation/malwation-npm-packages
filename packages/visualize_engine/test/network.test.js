import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGraph } from '../src/parse/graph.js';
import { layoutNetwork } from '../src/layout/network.js';

test('force layout is deterministic + bounded', () => {
  const src = 'a -> b\nb -> c\nc -> a\na -> d\nd -> e\ne -> b';
  const l1 = layoutNetwork(parseGraph(src));
  const l2 = layoutNetwork(parseGraph(src));
  assert.deepEqual(l1.nodes.map((n) => [n.x, n.y]), l2.nodes.map((n) => [n.x, n.y]));
  for (const n of l1.nodes) {
    assert.ok(Number.isInteger(n.x) && n.x >= 0 && n.y >= 0);
  }
  assert.equal(l1.edges.length, 6);
});

test('nodes do not all collapse to one point', () => {
  const l = layoutNetwork(parseGraph('a -> b\na -> c\na -> d\na -> e'));
  const uniq = new Set(l.nodes.map((n) => `${n.x},${n.y}`));
  assert.ok(uniq.size >= 4);
});

test('never throws on junk', () => {
  for (const s of ['', 'a', 'a ->']) assert.doesNotThrow(() => layoutNetwork(parseGraph(s)));
});
