import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeline } from '../src/parse/timeline.js';
import { layoutTimeline } from '../src/layout/timeline.js';

const lay = (src) => layoutTimeline(parseTimeline(src));

test('stamp is the first token, rest is the text', () => {
  const m = parseTimeline('00:00 detonation\n00:04 drops payload');
  assert.deepEqual(m.events[0], { stamp: '00:00', text: 'detonation' });
  assert.equal(m.events[1].text, 'drops payload');
});

test('single-token line becomes text without stamp', () => {
  const m = parseTimeline('boom');
  assert.deepEqual(m.events[0], { stamp: '', text: 'boom' });
});

test('layout: event nodes ev0..n stepping 4 rows', () => {
  const l = lay('a one\nb two\nc three');
  assert.deepEqual(l.nodes.map((n) => n.id), ['ev0', 'ev1', 'ev2']);
  assert.equal(l.nodes[1].y - l.nodes[0].y, 4);
  assert.equal(l.nodes[0].h, 3);
});

test('layout: spine, ticks and stamps as decor', () => {
  const l = lay('00:00 a\n00:05 b');
  const lines = l.decor.filter((d) => d.type === 'line');
  const texts = l.decor.filter((d) => d.type === 'text');
  assert.equal(lines.length, 1 + 2, 'spine + one tick per event');
  assert.equal(texts.length, 2, 'stamp per event');
  assert.ok(texts.every((t) => t.anchor === 'end'));
});

test('never throws on junk', () => {
  for (const s of ['', '   ', '\n\n', '# c']) assert.doesNotThrow(() => lay(s));
});
