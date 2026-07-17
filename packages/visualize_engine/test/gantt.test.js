import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGantt } from '../src/parse/gantt.js';
import { layoutGantt } from '../src/layout/gantt.js';

const lay = (src) => layoutGantt(parseGantt(src));

test('label: start duration parses', () => {
  const m = parseGantt('unpack: 0 3\nbeacon: 3 7');
  assert.deepEqual(m.tasks[0], { label: 'unpack', start: 0, dur: 3 });
  assert.deepEqual(m.tasks[1], { label: 'beacon', start: 3, dur: 7 });
});

test('bar geometry: x = labelCol + start*2, w = dur*2', () => {
  const l = lay('a: 2 5');
  const fill = l.decor.find((d) => d.type === 'rect-fill');
  const track = l.decor.find((d) => d.type === 'rect');
  assert.equal(fill.x - track.x, 4);
  assert.equal(fill.w, 10);
});

test('unit ticks every 5 along the top', () => {
  const l = lay('a: 0 12');
  const ticks = l.decor.filter((d) => d.type === 'text' && /^\d+$/.test(d.text));
  assert.deepEqual(ticks.map((t) => t.text), ['0', '5', '10']);
});

test('never throws on junk', () => {
  for (const s of ['', 'a: 1', 'a: x y', ':::']) assert.doesNotThrow(() => lay(s));
});
