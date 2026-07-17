import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTree } from '../src/parse/tree.js';

test('nesting by 2-space indentation, 3 levels', () => {
  const t = parseTree(['services.exe', '  svchost.exe', '    conhost.exe', '  malware.exe'].join('\n'));
  assert.equal(t.roots.length, 1);
  const root = t.roots[0];
  assert.equal(root.label, 'services.exe');
  assert.equal(root.children.length, 2);
  assert.equal(root.children[0].label, 'svchost.exe');
  assert.equal(root.children[0].children[0].label, 'conhost.exe');
  assert.equal(root.children[1].label, 'malware.exe');
});

test('multiple roots', () => {
  const t = parseTree('a\nb\n  b1');
  assert.equal(t.roots.length, 2);
  assert.equal(t.roots[1].children[0].label, 'b1');
});

test('default shape box; [stadium]/[diamond] suffix overrides', () => {
  const t = parseTree('a\n  done [stadium]\n  q [diamond]');
  assert.equal(t.roots[0].shape, 'box');
  assert.equal(t.roots[0].children[0].shape, 'stadium');
  assert.equal(t.roots[0].children[0].label, 'done');
  assert.equal(t.roots[0].children[1].shape, 'diamond');
});

test('blank lines skipped; over-indent clamps to deepest open level', () => {
  const t = parseTree('a\n\n      way-deep\n  normal');
  assert.equal(t.roots[0].children[0].label, 'way-deep');
  assert.equal(t.roots[0].children[1].label, 'normal');
});

test('never throws on junk', () => {
  for (const s of ['', '   ', '\n\n', '  orphan-indent']) {
    assert.doesNotThrow(() => parseTree(s));
  }
});
