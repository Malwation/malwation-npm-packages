import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBars } from '../src/parse/bars.js';
import { layoutPie } from '../src/layout/pie.js';

const lay = (src) => layoutPie(parseBars(src));

test('one slice path per row', () => {
  const l = lay('a: 50\nb: 30\nc: 20');
  const paths = l.decor.filter((d) => d.type === 'path');
  assert.equal(paths.length, 3);
  for (const p of paths) assert.doesNotMatch(p.d, /NaN/);
});

test('single row covers the full circle without NaN', () => {
  const l = lay('all: 10');
  const paths = l.decor.filter((d) => d.type === 'path');
  assert.ok(paths.length >= 2, 'full circle split into halves');
  for (const p of paths) assert.doesNotMatch(p.d, /NaN/);
});

test('legend: chip + label + value per row, fills cycle', () => {
  const l = lay('a: 60\nb: 40');
  const chips = l.decor.filter((d) => d.type === 'rect-fill');
  assert.equal(chips.length, 2);
  assert.notEqual(chips[0].cls, chips[1].cls);
  const texts = l.decor.filter((d) => d.type === 'text');
  assert.ok(texts.some((t) => t.text.includes('a')));
  assert.ok(texts.some((t) => t.text.includes('60')));
});

test('never throws on junk / zero totals', () => {
  for (const s of ['', 'a: 0\nb: 0', 'x: abc', '#']) assert.doesNotThrow(() => lay(s));
});
