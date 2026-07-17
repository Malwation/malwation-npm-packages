import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGraph } from '../src/parse/graph.js';
import { layoutGraph3d } from '../src/layout/three.js';

const node = (g, id) => g.nodes.find((n) => n.id === id);

test('direction: default TD, first-line header, info arg', () => {
  assert.equal(parseGraph('a: [x]').direction, 'TD');
  assert.equal(parseGraph('graph LR\na: [x]').direction, 'LR');
  assert.equal(parseGraph('a: [x]', 'LR').direction, 'LR');
});

test('shapes from bracket type', () => {
  const g = parseGraph(['a: [ explorer.exe ]', 'c: (Done)', 'd: {Packed?}', 's: [[ Sandbox ]]'].join('\n'));
  assert.equal(node(g, 'a').shape, 'box');
  assert.equal(node(g, 'a').label, 'explorer.exe');
  assert.equal(node(g, 'c').shape, 'stadium');
  assert.equal(node(g, 'c').label, 'Done');
  assert.equal(node(g, 'd').shape, 'diamond');
  assert.equal(node(g, 's').shape, 'container');
  assert.equal(node(g, 's').label, 'Sandbox');
});

test('dot-path nesting sets parent; missing parent auto-created as container', () => {
  const g = parseGraph('s.p: [mal.exe]');
  assert.equal(node(g, 's.p').parent, 's');
  assert.equal(node(g, 's.p').label, 'mal.exe');
  assert.equal(node(g, 's').shape, 'container');
  assert.equal(node(g, 's').parent, null);
});

test('edges with quoted, bare and no label', () => {
  const g = parseGraph(['a: [A]', 'b: [B]', 'a -> b : "tcp/443"', 'b -> a : plain tail', 'a -> a2'].join('\n'));
  assert.deepEqual(g.edges[0], { from: 'a', to: 'b', label: 'tcp/443', kind: 'arrow', variant: null });
  assert.deepEqual(g.edges[1], { from: 'b', to: 'a', label: 'plain tail', kind: 'arrow', variant: null });
  assert.deepEqual(g.edges[2], { from: 'a', to: 'a2', label: null, kind: 'arrow', variant: null });
});

test('edge endpoints auto-create box nodes labeled by id', () => {
  const g = parseGraph('x -> y');
  assert.equal(node(g, 'x').shape, 'box');
  assert.equal(node(g, 'x').label, 'x');
  assert.equal(node(g, 'y').label, 'y');
});

test('trailing quoted string after shape is a tooltip title', () => {
  const g = parseGraph('x: [ L ] "tooltip here"');
  assert.equal(node(g, 'x').title, 'tooltip here');
  assert.equal(node(g, 'x').label, 'L');
  assert.equal(parseGraph('y: [L]').nodes[0].title, null);
});

test('comments, blanks and garbage lines are skipped', () => {
  const g = parseGraph(['# comment', '', 'a: [A]', 'a ->', 'b: [B]'].join('\n'));
  assert.equal(g.nodes.length, 2);
  assert.equal(g.edges.length, 0);
});

test('anim flag + mode on info and header', () => {
  assert.equal(parseGraph('a: [x]', 'TD anim').animate, 'default');
  assert.equal(parseGraph('graph LR flow\na -> b').animate, 'flow');
  assert.equal(parseGraph('graph TD pulse\na -> b').animate, 'pulse');
  assert.equal(parseGraph('a: [x]').animate, null);
});

test('three/3d flag on info and header', () => {
  assert.equal(parseGraph('a: [x]', 'three').three, true);
  assert.equal(parseGraph('graph 3d\na -> b').three, true);
  assert.equal(parseGraph('a: [x]').three, false);
});

test('layoutGraph3d assigns true 3D coords, ranked on Y layers', () => {
  const l = layoutGraph3d(parseGraph('a: [A]\nb: [B]\nc: [C]\na -> b\na -> c'));
  assert.equal(l.three, true);
  assert.equal(l.nodes.length, 3);
  for (const n of l.nodes) {
    for (const k of ['x3', 'y3', 'z3']) assert.equal(typeof n[k], 'number');
  }
  const a = l.nodes.find((n) => n.id === 'a');
  const b = l.nodes.find((n) => n.id === 'b');
  assert.ok(a.y3 > b.y3, 'source is on a higher Y layer than its children');
});

test('interactive flag on info and header', () => {
  assert.equal(parseGraph('a: [x]', 'TD interactive').interactive, true);
  assert.equal(parseGraph('graph LR interactive\na -> b').interactive, true);
  assert.equal(parseGraph('a: [x]').interactive, false);
});

test('iso flag on fence info and header; direction preserved', () => {
  assert.equal(parseGraph('a: [x]', 'TD iso').projection, 'iso');
  assert.equal(parseGraph('graph LR iso\na -> b').projection, 'iso');
  assert.equal(parseGraph('graph LR iso\na -> b').direction, 'LR');
  assert.equal(parseGraph('a: [x]').projection, null);
});

test('edge kinds: arrow, bidirectional, plain line', () => {
  const g = parseGraph('a -> b\nc <-> d\ne -- f');
  assert.equal(g.edges[0].kind, 'arrow');
  assert.equal(g.edges[1].kind, 'both');
  assert.equal(g.edges[2].kind, 'line');
});

test('edge variant tags with and without label', () => {
  const g = parseGraph('a -> b : "exfil" [err]\nc -- d [ok]\ne -> f : plain\ng -> h');
  assert.equal(g.edges[0].variant, 'err');
  assert.equal(g.edges[0].label, 'exfil');
  assert.equal(g.edges[1].variant, 'ok');
  assert.equal(g.edges[1].label, null);
  assert.equal(g.edges[2].variant, null);
  assert.equal(g.edges[2].label, 'plain');
  assert.equal(g.edges[3].variant, null);
});

test('never throws on junk', () => {
  for (const s of ['', '::::', 'a: [unclosed', '->', 'graph', 'a: ()', '\n\n', 'a <-> ', 'a -- ']) {
    assert.doesNotThrow(() => parseGraph(s));
  }
});
