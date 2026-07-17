import test from 'node:test';
import assert from 'node:assert/strict';
import * as VizEngine from '../src/index.js';

test('version is a semver-ish string', () => {
  assert.equal(typeof VizEngine.version, 'string');
  assert.match(VizEngine.version, /^\d+\.\d+\.\d+/);
});

test('public api surface', () => {
  assert.equal(typeof VizEngine.Panel, 'function');
  assert.equal(typeof VizEngine.render, 'function');
  assert.equal(typeof VizEngine.parseDoc, 'function');
  assert.equal(typeof VizEngine.parseGraph, 'function');
  assert.equal(typeof VizEngine.parseTree, 'function');
  assert.equal(typeof VizEngine.Panel.prototype.setTheme, 'function');
});

test('themes list exposes all 20 design languages', () => {
  assert.equal(VizEngine.themes.length, 20);
  for (const t of ['sketch', 'dracula', 'nord', 'solarized', 'synthwave', 'hologram', 'kraft', 'wireframe', 'crt-amber', 'midnight', 'mono-print']) {
    assert.ok(VizEngine.themes.includes(t), `themes includes ${t}`);
  }
});
