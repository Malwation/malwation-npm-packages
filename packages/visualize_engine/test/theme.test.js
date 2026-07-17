import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, THEME_NAMES, buildCSS } from '../src/core/theme.js';

const REQUIRED = [
  '--viz-paper',
  '--viz-grid',
  '--viz-ink',
  '--viz-muted',
  '--viz-accent',
  '--viz-shadow',
  '--viz-font',
  '--viz-font-mono',
  '--viz-dash-frame',
  '--viz-dash-edge',
  '--viz-stroke-w',
  '--viz-radius',
  '--viz-ok',
  '--viz-warn',
  '--viz-err',
  '--viz-paper-style',
  '--viz-node-fill',
  '--viz-node-filter',
  '--viz-bg-layer',
  '--viz-elev',
  '--viz-node-style',
];

const EXPECTED_NAMES = [
  'sketch', 'sketch-dark', 'blueprint', 'neon', 'notebook', 'glass',
  'terminal', 'carbon', '8bit', 'ink',
  'crt-amber', 'synthwave', 'midnight', 'solarized', 'dracula', 'nord',
  'mono-print', 'hologram', 'kraft', 'wireframe',
];

test('all 20 themes exist with the full token schema', () => {
  assert.deepEqual(THEME_NAMES, EXPECTED_NAMES);
  for (const name of THEME_NAMES) {
    const t = THEMES[name];
    assert.ok(t, `${name} theme exists`);
    for (const k of REQUIRED) {
      assert.ok(t[k] != null && t[k] !== '', `${name} defines ${k}`);
    }
  }
});

test('diagram/code font is always monospace', () => {
  for (const name of THEME_NAMES) {
    assert.match(THEMES[name]['--viz-font-mono'], /monospace/, `${name} mono stack`);
  }
});

test('buildCSS emits every theme selector and semantic svg classes', () => {
  const css = buildCSS();
  for (const name of THEME_NAMES) {
    assert.ok(css.includes(`.vizengine.viz-theme-${name}`), `selector for ${name}`);
  }
  for (const cls of ['.viz-shape', '.viz-frame', '.viz-edge', '.viz-arrowhead', '.viz-gridline', '.viz-figure', '.viz-tooltip', '.viz-code']) {
    assert.ok(css.includes(cls), `css for ${cls}`);
  }
});

test('back-compat aliases still resolve', () => {
  assert.equal(THEMES.kind, THEMES.sketch);
  assert.equal(THEMES['kind-dark'], THEMES['sketch-dark']);
});

test('themes use varied fonts (not all monospace)', () => {
  const fonts = new Set(THEME_NAMES.map((n) => THEMES[n]['--viz-font']));
  assert.ok(fonts.size >= 4, 'at least 4 distinct font stacks across themes');
});

test('themes use varied node shapes (not all rectangles)', () => {
  const shapes = new Set(THEME_NAMES.map((n) => THEMES[n]['--viz-node-style']));
  assert.ok(shapes.size >= 5, 'at least 5 distinct node shapes across themes');
});
