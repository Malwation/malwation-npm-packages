import test from 'node:test';
import assert from 'node:assert/strict';
import { splitSections } from '../src/render/components.js';

test('splitSections splits on == headers, keeps body lines', () => {
  const secs = splitSections(['== Overview', 'line a', 'line b', '== Details', 'line c']);
  assert.equal(secs.length, 2);
  assert.equal(secs[0].label, 'Overview');
  assert.deepEqual(secs[0].lines, ['line a', 'line b']);
  assert.equal(secs[1].label, 'Details');
  assert.deepEqual(secs[1].lines, ['line c']);
});

test('splitSections ignores content before the first header', () => {
  assert.deepEqual(splitSections(['orphan', '== A', 'x']), [{ label: 'A', lines: ['x'] }]);
});

test('splitSections empty input → empty list', () => {
  assert.deepEqual(splitSections([]), []);
});
