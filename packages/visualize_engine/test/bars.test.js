import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBars } from '../src/parse/bars.js';
import { layoutBars } from '../src/layout/bars.js';

const lay = (src) => layoutBars(parseBars(src));

test('label: value with optional / max', () => {
  const m = parseBars('behavior: 92\nstealth: 45 / 200');
  assert.deepEqual(m.rows[0], { label: 'behavior', value: 92, max: null });
  assert.deepEqual(m.rows[1], { label: 'stealth', value: 45, max: 200 });
});

test('fill width proportional to value/max, track is 30 cells', () => {
  const l = lay('a: 50');
  const track = l.decor.find((d) => d.type === 'rect');
  const fill = l.decor.find((d) => d.type === 'rect-fill');
  assert.equal(track.w, 30);
  assert.equal(fill.w, 15); // 50/100 default max
});

test('global max grows when a value exceeds 100; clamp applies', () => {
  const l = lay('a: 150\nb: 75');
  const fills = l.decor.filter((d) => d.type === 'rect-fill');
  assert.equal(fills[0].w, 30); // 150/150
  assert.equal(fills[1].w, 15); // 75/150
  const c = lay('x: 500 / 100');
  const f = c.decor.find((d) => d.type === 'rect-fill');
  assert.equal(f.w, 30); // clamped to row max
});

test('label and value texts emitted', () => {
  const l = lay('score: 92');
  const texts = l.decor.filter((d) => d.type === 'text');
  assert.equal(texts.length, 2);
  assert.ok(texts.some((t) => t.text === 'score'));
  assert.ok(texts.some((t) => t.text === '92'));
});

test('never throws on junk', () => {
  for (const s of ['', 'x:', 'x: abc', ': 5', '\n#\n']) assert.doesNotThrow(() => lay(s));
});
