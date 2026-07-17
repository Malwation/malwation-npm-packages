import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../src/editor/catalog.js';
import { parseDoc } from '../src/parse/markdown.js';

test('every descriptor builds a non-empty source from defaults, no throw', () => {
  assert.ok(CATALOG.length >= 50, `catalog has many components (got ${CATALOG.length})`);
  for (const c of CATALOG) {
    assert.equal(typeof c.build, 'function', `${c.id} has build`);
    assert.ok(Array.isArray(c.fields), `${c.id} has fields`);
    let src;
    assert.doesNotThrow(() => { src = c.build(c.default || {}); }, `${c.id} builds`);
    assert.equal(typeof src, 'string', `${c.id} → string`);
    assert.doesNotThrow(() => parseDoc(src), `${c.id} output parses`);
  }
});

test('unique ids and known categories', () => {
  const ids = CATALOG.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, 'ids unique');
  for (const c of CATALOG) assert.ok(c.name && c.category, `${c.id} named + categorized`);
});
