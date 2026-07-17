import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHierarchy } from '../src/parse/hierarchy.js';
import { layoutTreemap } from '../src/layout/treemap.js';
import { layoutFlame } from '../src/layout/flame.js';

test('parse nested values; parent = sum of children', () => {
  const m = parseHierarchy('a\n  b: 3\n  c: 7\nd: 5');
  assert.equal(m.roots[0].value, 10);
  assert.equal(m.roots[0].children[1].value, 7);
  assert.equal(m.roots[1].value, 5);
});

test('treemap emits filled leaf rects with borders', () => {
  const l = layoutTreemap(parseHierarchy('root\n  a: 40\n  b: 30\n  c: 20\n  d: 10'));
  assert.equal(l.decor.filter((d) => d.type === 'rect-fill').length, 4);
  assert.ok(l.decor.some((d) => d.type === 'rect'));
});

test('flame stacks by depth', () => {
  const l = layoutFlame(parseHierarchy('main: 100\n  parse: 40\n  render: 60\n    layout: 30'));
  const bars = l.decor.filter((d) => d.type === 'rect-fill');
  assert.ok(bars.length >= 4);
  assert.ok(l.height > 0);
});

test('never throws on junk', () => {
  for (const s of ['', '   ', '#c']) {
    assert.doesNotThrow(() => layoutTreemap(parseHierarchy(s)));
    assert.doesNotThrow(() => layoutFlame(parseHierarchy(s)));
  }
});
