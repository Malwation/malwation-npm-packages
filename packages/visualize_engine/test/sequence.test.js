import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSequence } from '../src/parse/sequence.js';
import { layoutSequence } from '../src/layout/sequence.js';

const lay = (src) => layoutSequence(parseSequence(src));

test('actors auto-collected in order of first appearance', () => {
  const m = parseSequence('a -> b : "hi"\nc -> a');
  assert.deepEqual(m.actors.map((a) => a.id), ['a', 'b', 'c']);
  assert.equal(m.messages.length, 2);
  assert.equal(m.messages[0].label, 'hi');
});

test('label declaration via box syntax', () => {
  const m = parseSequence('a: [ Client ]\nb: [ Server ]\na -> b : SYN');
  assert.equal(m.actors[0].label, 'Client');
  assert.equal(m.actors[1].label, 'Server');
});

test('layout: actor boxes on top row, messages step 3 rows', () => {
  const l = lay('a -> b : one\nb -> a : two');
  assert.equal(l.nodes.length, 2);
  for (const n of l.nodes) assert.equal(n.y, 2);
  const [m1, m2] = l.edges;
  assert.equal(m1.points[0].y, 7);
  assert.equal(m2.points[0].y, 10);
  assert.equal(m1.points.length, 2);
  assert.ok(m1.arrow);
  // horizontal
  assert.equal(m1.points[0].y, m1.points[1].y);
});

test('self-message renders a 4-point loop', () => {
  const l = lay('a -> a : retry');
  assert.equal(l.edges[0].points.length, 4);
});

test('lifelines emitted as dashed decor lines per actor', () => {
  const l = lay('a -> b');
  const lines = (l.decor ?? []).filter((d) => d.type === 'line');
  assert.equal(lines.length, 2);
  assert.ok(lines.every((d) => d.dash));
});

test('never throws on junk', () => {
  for (const s of ['', '->', 'a:', '::', 'a -> ', '\n\n#c\n']) {
    assert.doesNotThrow(() => lay(s));
  }
});
