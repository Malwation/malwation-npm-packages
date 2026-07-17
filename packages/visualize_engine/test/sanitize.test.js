import test from 'node:test';
import assert from 'node:assert/strict';
import { safeUrl } from '../src/util/sanitize.js';

test('allows http/https', () => {
  assert.equal(safeUrl('https://x.y/a.gif'), 'https://x.y/a.gif');
  assert.equal(safeUrl('http://x.y/'), 'http://x.y/');
});

test('blocks javascript: and vbscript:', () => {
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('JaVaScRiPt:alert(1)'), null);
  assert.equal(safeUrl(' javascript:alert(1)'), null);
  assert.equal(safeUrl('vbscript:x'), null);
});

test('blocks non-image data urls, allows image data urls', () => {
  assert.equal(safeUrl('data:text/html;base64,x'), null);
  assert.notEqual(safeUrl('data:image/png;base64,iVBOR'), null);
  assert.notEqual(safeUrl('data:image/gif;base64,R0lGOD'), null);
  assert.notEqual(safeUrl('data:image/webp;base64,x'), null);
});

test('allows relative, root-relative and fragment urls', () => {
  assert.notEqual(safeUrl('./rel/a.png'), null);
  assert.notEqual(safeUrl('../up/a.png'), null);
  assert.notEqual(safeUrl('/abs/path'), null);
  assert.notEqual(safeUrl('#frag'), null);
  assert.notEqual(safeUrl('plain/relative.png'), null);
});

test('handles junk input', () => {
  assert.equal(safeUrl(''), null);
  assert.equal(safeUrl(null), null);
  assert.equal(safeUrl(undefined), null);
});
