// Tree DSL → {roots}. One node per line, nesting by 2-space indentation,
// optional trailing [box]/[stadium]/[diamond] shape override. Never throws.

import { extractIcon } from '../util/icon.js';

const RE_SHAPE_SUFFIX = /\s+\[(box|stadium|diamond)\]\s*$/;

export function parseTree(text) {
  const roots = [];
  const stack = []; // stack[level] = last node at that level

  for (const raw of String(text ?? '').split('\n')) {
    if (!raw.trim()) continue;
    const indent = raw.match(/^ */)[0].length;
    let label = raw.trim();
    let shape = 'box';
    const m = RE_SHAPE_SUFFIX.exec(label);
    if (m) {
      shape = m[1];
      label = label.slice(0, m.index).trim();
    }
    const ic = extractIcon(label);
    const node = { label: ic.label, shape, icon: ic.icon, children: [] };

    // Clamp to the deepest currently-open level (+1); orphan indents become roots.
    const level = Math.min(Math.floor(indent / 2), stack.length);
    if (level === 0 || !stack[level - 1]) {
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
    } else {
      stack[level - 1].children.push(node);
      stack.length = level;
      stack[level] = node;
    }
  }
  return { roots };
}
