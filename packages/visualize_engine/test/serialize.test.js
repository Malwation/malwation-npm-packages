import test from 'node:test';
import assert from 'node:assert/strict';
import { modelToSource, sourceToModel } from '../src/editor/serialize.js';

test('modelToSource emits graph DSL with shapes/icons/edges', () => {
  const src = modelToSource({
    direction: 'TD',
    nodes: [
      { id: 'a', label: 'loader', shape: 'box', icon: 'gear' },
      { id: 'b', label: 'C2', shape: 'stadium', icon: null },
    ],
    edges: [{ from: 'a', to: 'b', label: 'beacon', kind: 'arrow', variant: 'err' }],
  });
  assert.match(src, /^graph TD/);
  assert.match(src, /a:\s*\[\s*@gear loader\s*\]/);
  assert.match(src, /b:\s*\(\s*C2\s*\)/);
  assert.match(src, /a -> b : "beacon" \[err\]/);
});

test('shape brackets: box [] stadium () diamond {} container [[]]', () => {
  const src = modelToSource({
    direction: 'TD',
    nodes: [
      { id: 'w', label: 'W', shape: 'box' },
      { id: 'x', label: 'X', shape: 'diamond' },
      { id: 'y', label: 'Y', shape: 'container' },
    ],
    edges: [],
  });
  assert.match(src, /w:\s*\[\s*W\s*\]/);
  assert.match(src, /x:\s*\{\s*X\s*\}/);
  assert.match(src, /y:\s*\[\[\s*Y\s*\]\]/);
});

test('round-trips through parseGraph', () => {
  const src = modelToSource({
    direction: 'LR',
    nodes: [{ id: 'x', label: 'X', shape: 'box' }, { id: 'y', label: 'Y', shape: 'diamond' }],
    edges: [{ from: 'x', to: 'y', kind: 'line' }],
  });
  const m = sourceToModel(src);
  assert.equal(m.direction, 'LR');
  assert.equal(m.nodes.find((n) => n.id === 'y').shape, 'diamond');
  assert.equal(m.edges[0].kind, 'line');
  for (const n of m.nodes) {
    assert.equal(typeof n.x, 'number');
    assert.equal(typeof n.y, 'number');
  }
});

test('sourceToModel never throws on junk', () => {
  for (const s of ['', 'graph', 'garbage ->']) assert.doesNotThrow(() => sourceToModel(s));
});
