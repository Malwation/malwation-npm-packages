export { version } from './version.js';
export { Panel } from './core/panel.js';
export { THEME_NAMES as themes } from './core/theme.js';
export { parseDoc } from './parse/markdown.js';
export { parseGraph } from './parse/graph.js';
export { parseTree } from './parse/tree.js';
export { fromMermaid } from './interop/mermaid.js';
export { fromDot } from './interop/dot.js';
export { renderAscii } from './export/ascii.js';
export { Editor } from './editor/editor.js';
export { CATALOG as catalog, CATALOG_CATEGORIES, catalogById } from './editor/catalog.js';

import { Panel } from './core/panel.js';
import { registerWebComponent } from './webcomponent.js';

// One-shot convenience: VizEngine.render(el, source, opts) → Panel
export function render(el, source, opts) {
  const panel = new Panel(el, opts);
  panel.render(source);
  return panel;
}

// auto-register the <viz-engine> custom element in browsers
registerWebComponent();
