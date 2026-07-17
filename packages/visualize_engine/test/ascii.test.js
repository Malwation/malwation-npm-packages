import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAscii } from '../src/export/ascii.js';
import { parseGraph } from '../src/parse/graph.js';
import { layoutGraph } from '../src/layout/layered.js';

test('renders a graph to ASCII box-art with arrows', () => {
  const s = renderAscii(layoutGraph(parseGraph('a: [A]\nb: [B]\na -> b')));
  assert.equal(typeof s, 'string');
  assert.ok(s.includes('+') && s.includes('-') && s.includes('|'), 'has box chars');
  assert.ok(/[v^<>]/.test(s), 'has an arrowhead');
  assert.ok(s.includes('A') && s.includes('B'), 'has labels');
});

test('returns null for empty / non-asciifiable', () => {
  assert.equal(renderAscii(null), null);
  assert.equal(renderAscii({ nodes: [], containers: [], edges: [] }), null);
  assert.equal(renderAscii({ nodes: [{}], projection: 'iso' }), null);
});
