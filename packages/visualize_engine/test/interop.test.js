import test from 'node:test';
import assert from 'node:assert/strict';
import { fromMermaid } from '../src/interop/mermaid.js';
import { fromDot } from '../src/interop/dot.js';

test('mermaid: direction, shapes, labels, chains', () => {
  const m = fromMermaid('flowchart LR\n  A[Start] --> B{ok?}\n  B -->|yes| C(Done)\n  A --> D --> E');
  assert.equal(m.direction, 'LR');
  const A = m.nodes.find((n) => n.id === 'A');
  assert.equal(A.label, 'Start');
  assert.equal(m.nodes.find((n) => n.id === 'B').shape, 'diamond');
  assert.equal(m.nodes.find((n) => n.id === 'C').shape, 'stadium');
  const yes = m.edges.find((e) => e.from === 'B' && e.to === 'C');
  assert.equal(yes.label, 'yes');
  assert.ok(m.edges.some((e) => e.from === 'D' && e.to === 'E'));
});

test('dot: digraph, rankdir, attrs', () => {
  const m = fromDot('digraph G { rankdir=LR; a -> b [label="hi"]; b -> c; c [label="End" shape=diamond]; }');
  assert.equal(m.direction, 'LR');
  assert.equal(m.edges.find((e) => e.from === 'a').label, 'hi');
  assert.equal(m.nodes.find((n) => n.id === 'c').shape, 'diamond');
  assert.equal(m.nodes.find((n) => n.id === 'c').label, 'End');
});

test('never throws on junk', () => {
  for (const s of ['', 'graph', 'digraph {}', 'garbage']) {
    assert.doesNotThrow(() => fromMermaid(s));
    assert.doesNotThrow(() => fromDot(s));
  }
});
