import test from 'node:test';
import assert from 'node:assert/strict';
import { extractIcon } from '../src/util/icon.js';
import { ICONS } from '../src/render/icons.js';
import { parseGraph } from '../src/parse/graph.js';
import { parseTree } from '../src/parse/tree.js';
import { parseSequence } from '../src/parse/sequence.js';
import { layoutGraph, nodeSize } from '../src/layout/layered.js';

test('extractIcon splits @name prefix; plain labels pass through', () => {
  assert.deepEqual(extractIcon('@server Web Server'), { icon: 'server', label: 'Web Server' });
  assert.deepEqual(extractIcon('plain label'), { icon: null, label: 'plain label' });
  assert.deepEqual(extractIcon('@skull'), { icon: 'skull', label: '' });
  assert.deepEqual(extractIcon(''), { icon: null, label: '' });
});

test('registry: all 16 icons exist with path data', () => {
  const names = ['server', 'database', 'file', 'gear', 'globe', 'user', 'shield', 'bug', 'folder', 'lock', 'alert', 'terminal', 'chip', 'cloud', 'mail', 'skull'];
  assert.deepEqual(Object.keys(ICONS).sort(), [...names].sort());
  for (const n of names) {
    assert.ok(ICONS[n].d.length >= 1, `${n} has paths`);
    for (const d of ICONS[n].d) assert.match(d, /^M/, `${n} path starts with M`);
  }
});

test('graph nodes carry icon; label stripped', () => {
  const g = parseGraph('a: [ @server Web ]\nb: ( @globe C2 )');
  assert.equal(g.nodes[0].icon, 'server');
  assert.equal(g.nodes[0].label, 'Web');
  assert.equal(g.nodes[1].icon, 'globe');
});

test('tree and sequence labels carry icons', () => {
  const t = parseTree('@gear services.exe\n  @skull mal.exe [diamond]');
  assert.equal(t.roots[0].icon, 'gear');
  assert.equal(t.roots[0].children[0].icon, 'skull');
  assert.equal(t.roots[0].children[0].shape, 'diamond');
  const s = parseSequence('c: [ @user Client ]\nc -> s');
  assert.equal(s.actors[0].icon, 'user');
  assert.equal(s.actors[0].label, 'Client');
});

test('icon adds 3 cells of width; layout passes icon through', () => {
  const plain = nodeSize({ label: 'Web', shape: 'box' });
  const iconed = nodeSize({ label: 'Web', shape: 'box', icon: 'server' });
  assert.ok(iconed.w >= plain.w + 3, 'at least 3 cells wider');
  assert.equal(iconed.w % 2, 0, 'still even');
  const l = layoutGraph(parseGraph('a: [ @server Web ]'));
  assert.equal(l.nodes[0].icon, 'server');
});
