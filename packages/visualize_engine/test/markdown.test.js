import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDoc } from '../src/parse/markdown.js';

const block = (src, i = 0) => parseDoc(src).blocks[i];

test('headings h1-h4', () => {
  assert.deepEqual(block('# Hi').type, 'heading');
  assert.equal(block('# Hi').level, 1);
  assert.equal(block('#### Deep').level, 4);
  assert.equal(block('# Hi').inlines[0].text, 'Hi');
});

test('paragraph with strong/em/code/link inlines', () => {
  const b = block('a **b** *c* `d` [e](https://x.y)');
  assert.equal(b.type, 'para');
  const types = b.inlines.map((i) => i.type);
  assert.deepEqual(types, ['text', 'strong', 'text', 'em', 'text', 'code', 'text', 'link']);
  assert.equal(b.inlines[1].children[0].text, 'b');
  assert.equal(b.inlines[5].text, 'd');
  assert.equal(b.inlines[7].href, 'https://x.y');
  assert.equal(b.inlines[7].children[0].text, 'e');
});

test('code span wins over strong inside it', () => {
  const b = block('`a **b**`');
  assert.equal(b.inlines[0].type, 'code');
  assert.equal(b.inlines[0].text, 'a **b**');
});

test('unclosed strong falls back to literal text', () => {
  const b = block('a **b');
  const flat = b.inlines.map((i) => i.text ?? '').join('');
  assert.equal(flat, 'a **b');
});

test('unordered and ordered lists, nesting', () => {
  const b = block('- one\n- two\n  - two.a\n- three');
  assert.equal(b.type, 'list');
  assert.equal(b.ordered, false);
  assert.equal(b.items.length, 3);
  assert.equal(b.items[1].children[0].type, 'list');
  assert.equal(b.items[1].children[0].items[0].inlines[0].text, 'two.a');
  const o = block('1. a\n2. b');
  assert.equal(o.ordered, true);
  assert.equal(o.items.length, 2);
});

test('adjacent ul and ol stay separate lists', () => {
  const doc = parseDoc('- a\n- b\n1. one\n2. two');
  assert.equal(doc.blocks.length, 2);
  assert.equal(doc.blocks[0].ordered, false);
  assert.equal(doc.blocks[0].items.length, 2);
  assert.equal(doc.blocks[1].ordered, true);
  assert.equal(doc.blocks[1].items.length, 2);
});

test('blockquote contains blocks', () => {
  const b = block('> quoted **text**');
  assert.equal(b.type, 'quote');
  assert.equal(b.blocks[0].type, 'para');
});

test('gfm table with aligns', () => {
  const b = block('| a | b |\n|:--|--:|\n| 1 | 2 |\n| 3 | 4 |');
  assert.equal(b.type, 'table');
  assert.deepEqual(b.aligns, ['left', 'right']);
  assert.equal(b.header[0][0].text, 'a');
  assert.equal(b.rows.length, 2);
  assert.equal(b.rows[1][1][0].text, '4');
});

test('closed and unterminated code fences', () => {
  const c = block('```js\nlet x=1;\n```');
  assert.equal(c.type, 'code');
  assert.equal(c.lang, 'js');
  assert.equal(c.text, 'let x=1;');
  assert.equal(c.closed, true);
  const u = block('```js\nlet x=1;');
  assert.equal(u.closed, false);
});

test('viz fences: graph and tree', () => {
  const g = block('```graph LR\na -> b\n```');
  assert.equal(g.type, 'viz');
  assert.equal(g.kind, 'graph');
  assert.equal(g.info, 'LR');
  assert.equal(g.text, 'a -> b');
  const t = block('```tree\nroot\n  kid\n```');
  assert.equal(t.kind, 'tree');
});

test('unknown fence lang stays a code block', () => {
  const b = block('```brainfuck\n+++\n```');
  assert.equal(b.type, 'code');
  assert.equal(b.lang, 'brainfuck');
});

test('standalone image becomes figure; inline image stays inline', () => {
  const f = block('![cap](a.gif)');
  assert.equal(f.type, 'figure');
  assert.equal(f.src, 'a.gif');
  assert.equal(f.alt, 'cap');
  const p = block('see ![icon](i.png) here');
  assert.equal(p.type, 'para');
  assert.equal(p.inlines[1].type, 'image');
});

test('hr', () => {
  assert.equal(block('---').type, 'hr');
});

test('mixed document integrates', () => {
  const doc = parseDoc('# T\n\npara\n\n```graph\na -> b\n```\n\n- l1\n');
  assert.deepEqual(
    doc.blocks.map((b) => b.type),
    ['heading', 'para', 'viz', 'list'],
  );
});

test('callouts from [!kind] quotes; warning→warn; plain quotes unchanged', () => {
  const b = block('> [!warn] Heads up\n> body text');
  assert.equal(b.type, 'callout');
  assert.equal(b.kind, 'warn');
  assert.equal(b.title, 'Heads up');
  assert.equal(b.blocks[0].type, 'para');
  assert.equal(block('> [!warning]').kind, 'warn');
  assert.equal(block('> [!danger] X').kind, 'danger');
  assert.equal(block('> plain').type, 'quote');
});

test('task list items', () => {
  const b = block('- [x] done thing\n- [ ] todo thing\n- normal');
  assert.equal(b.items[0].task, 'done');
  assert.equal(b.items[0].inlines[0].text, 'done thing');
  assert.equal(b.items[1].task, 'todo');
  assert.equal(b.items[2].task, null);
});

test('inline badges with variants; ignored inside code spans', () => {
  const b = block('risk [[high]] and [[!crit]] and [[+ok]] and [[~med]]');
  const badges = b.inlines.filter((i) => i.type === 'badge');
  assert.deepEqual(badges.map((x) => x.variant), ['neutral', 'err', 'ok', 'warn']);
  assert.equal(badges[1].text, 'crit');
  const c = block('`[[not-badge]]`');
  assert.equal(c.inlines[0].type, 'code');
});

test('definition lists from term :: def lines', () => {
  const b = block('SHA-256 :: 9f86d0\nC2 :: 1.2.3.4:443');
  assert.equal(b.type, 'dl');
  assert.equal(b.items.length, 2);
  assert.equal(b.items[0].term, 'SHA-256');
  assert.equal(b.items[1].def[0].text, '1.2.3.4:443');
});

test('collapsible +++ sections; unterminated marked open', () => {
  const b = block('+++ Details\ninner para\n+++');
  assert.equal(b.type, 'collapse');
  assert.equal(b.summary, 'Details');
  assert.equal(b.closed, true);
  assert.equal(b.blocks[0].type, 'para');
  const u = block('+++ Pending\nstill streaming');
  assert.equal(u.closed, false);
});

test('inline progress and severity', () => {
  const p = block('load [[progress 60]] and [[progress 3/5]]');
  const kinds = p.inlines.map((i) => i.type);
  assert.ok(kinds.includes('progress'));
  const prog = p.inlines.filter((i) => i.type === 'progress');
  assert.deepEqual({ value: prog[0].value, max: prog[0].max }, { value: 60, max: 100 });
  assert.deepEqual({ value: prog[1].value, max: prog[1].max }, { value: 3, max: 5 });
  const s = block('risk [[sev 3/5]]');
  const sev = s.inlines.find((i) => i.type === 'sev');
  assert.deepEqual({ n: sev.n, m: sev.m }, { n: 3, m: 5 });
});

test('badges still work alongside progress/sev', () => {
  const b = block('[[!crit]] [[+ok]] [[plain]]');
  assert.deepEqual(
    b.inlines.filter((i) => i.type === 'badge').map((x) => [x.variant, x.text]),
    [['err', 'crit'], ['ok', 'ok'], ['neutral', 'plain']],
  );
});

test('filetree and diff fences', () => {
  const f = block('```filetree\nroot/\n  a.txt\n```');
  assert.equal(f.type, 'filetree');
  assert.match(f.text, /a\.txt/);
  const dff = block('```diff\n+added\n-removed\n context\n```');
  assert.equal(dff.type, 'diff');
});

test('directive blocks: name, args, lines, closed', () => {
  const b = block(':::tabs\n== One\na\n== Two\nb\n:::');
  assert.equal(b.type, 'directive');
  assert.equal(b.name, 'tabs');
  assert.deepEqual(b.lines, ['== One', 'a', '== Two', 'b']);
  assert.equal(b.closed, true);
  const s = block(':::stat main\n1 | a\n:::');
  assert.equal(s.name, 'stat');
  assert.equal(s.args, 'main');
  const u = block(':::meta\nx :: y');
  assert.equal(u.closed, false);
  const one = block(':::chips a, b, c :::');
  assert.equal(one.name, 'chips');
  assert.equal(one.args, 'a, b, c');
  assert.equal(one.closed, true);
  assert.deepEqual(one.lines, []);
});

test('never throws on junk', () => {
  for (const s of ['', '****', '``', '|||\n|-|', '> \n> ', '![](', '```', '\n\n\n']) {
    assert.doesNotThrow(() => parseDoc(s));
  }
});
