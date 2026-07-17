import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSankey } from '../src/parse/sankey.js';
import { layoutSankey } from '../src/layout/sankey.js';

test('parse links with weights, auto-create nodes in order', () => {
  const m = parseSankey('a -> b : 30\nb -> c : 20\na -> c');
  assert.deepEqual(m.nodes.map((n) => n.id), ['a', 'b', 'c']);
  assert.deepEqual(m.links[0], { from: 'a', to: 'b', value: 30 });
  assert.equal(m.links[2].value, 1);
});

test('layout emits ribbons + node bars as decor', () => {
  const l = layoutSankey(parseSankey('a -> b : 30\nb -> c : 20'));
  const ribbons = l.decor.filter((d) => d.type === 'ribbon');
  const bars = l.decor.filter((d) => d.type === 'rect-fill');
  assert.equal(ribbons.length, 2);
  assert.equal(bars.length, 3);
  assert.ok(l.width > 0 && l.height > 0);
});

test('never throws on junk', () => {
  for (const s of ['', '->', 'a ->', '#c\n\n']) assert.doesNotThrow(() => layoutSankey(parseSankey(s)));
});
