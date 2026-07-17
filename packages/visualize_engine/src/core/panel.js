// Panel: mounts into a container element, renders/streams the document
// format, owns diagram interactivity, node events and export.

import { ensureStyles, THEMES } from './theme.js';
import { parseDoc } from '../parse/markdown.js';
import { KINDS } from '../kinds.js';
import { renderBlocks } from '../render/blocks.js';
import { renderDiagram } from '../render/diagram.js';
import { renderThree } from '../render/three.js';
import { attachViewport } from '../interact/viewport.js';
import { attachTooltip } from '../interact/tooltip.js';
import { attachGraphTools } from '../interact/graphtools.js';
import { svgToString, svgToPng } from '../export.js';
import { renderAscii } from '../export/ascii.js';

export class Panel {
  constructor(el, opts = {}) {
    if (!el) throw new Error('VizEngine.Panel: container element required');
    this.el = el;
    this.opts = opts;
    this.theme = THEMES[opts.theme] ? opts.theme : 'kind';
    this._buf = '';
    this._diagrams = [];
    this._cleanups = [];
    this._raf = 0;
    this._hoverEl = null;

    ensureStyles(el.ownerDocument);
    el.classList.add('vizengine', `viz-theme-${this.theme}`);

    this._onClick = (ev) => {
      if (!this.opts.onNodeClick) return;
      const g = ev.target.closest?.('.viz-node');
      if (!g) return;
      const data = this._lookup(g);
      if (data) this.opts.onNodeClick(data, ev);
    };
    this._onMove = (ev) => {
      if (!this.opts.onNodeHover) return;
      const g = ev.target.closest?.('.viz-node') ?? null;
      if (g === this._hoverEl) return;
      this._hoverEl = g;
      this.opts.onNodeHover(g ? this._lookup(g) : null, ev);
    };
    el.addEventListener('click', this._onClick);
    el.addEventListener('mousemove', this._onMove);
  }

  _lookup(g) {
    const id = g.getAttribute('data-id');
    const svg = g.closest('svg.viz-diagram');
    for (const d of this._diagrams) {
      if (d.svg === svg) {
        const n = d.nodeIndex.get(id);
        if (n) return { id: n.id, label: n.label, shape: n.shape, title: n.title };
      }
    }
    return null;
  }

  render(source) {
    this._buf = String(source ?? '');
    this._renderNow();
  }

  // live theme switch — pure CSS, no re-render needed
  setTheme(name) {
    const next = THEMES[name] ? name : 'kind';
    this.el.classList.remove(`viz-theme-${this.theme}`);
    this.theme = next;
    this.el.classList.add(`viz-theme-${next}`);
  }

  stream(chunk) {
    this._buf += String(chunk ?? '');
    if (this._raf) return;
    const win = this.el.ownerDocument.defaultView;
    const raf = win?.requestAnimationFrame?.bind(win) ?? ((fn) => setTimeout(fn, 16));
    this._raf = raf(() => {
      this._raf = 0;
      this._renderNow();
    });
  }

  clear() {
    this._buf = '';
    this._teardownDiagrams();
    this.el.replaceChildren();
  }

  destroy() {
    this._teardownDiagrams();
    this.el.removeEventListener('click', this._onClick);
    this.el.removeEventListener('mousemove', this._onMove);
    this.el.replaceChildren();
    this.el.classList.remove('vizengine', `viz-theme-${this.theme}`);
  }

  exportSVG(index = 0) {
    const d = this._diagrams[index];
    if (!d) {
      console.warn(`VizEngine: no diagram at index ${index}`);
      return null;
    }
    return svgToString(d.svg);
  }

  exportPNG(index = 0, scale = 2) {
    const d = this._diagrams[index];
    if (!d) return Promise.reject(new Error(`VizEngine: no diagram at index ${index}`));
    return svgToPng(d.svg, scale);
  }

  // nth diagram as copy-pasteable ASCII art (graph/tree only; null otherwise)
  toAscii(index = 0) {
    const d = this._diagrams[index];
    if (!d) {
      console.warn(`VizEngine: no diagram at index ${index}`);
      return null;
    }
    return renderAscii(d.layout);
  }

  _teardownDiagrams() {
    for (const fn of this._cleanups) fn();
    this._cleanups = [];
    this._diagrams = [];
    this._hoverEl = null;
  }

  _renderNow() {
    const doc = this.el.ownerDocument;
    this._teardownDiagrams();
    const ast = parseDoc(this._buf);
    const frag = renderBlocks(ast, {
      document: doc,
      renderViz: (block) => this._renderViz(block, doc),
    });
    this.el.replaceChildren(frag);
  }

  _renderViz(block, doc) {
    const make = KINDS[block.kind];
    const layout = make ? make(block.text, block.info) : null;
    if (!layout) return null;
    if (this.opts.interactive && block.kind === 'graph') layout.interactive = true;
    const tokens = THEMES[this.theme] || {};
    const paperStyle = tokens['--viz-paper-style'] || 'grid';
    const nodeStyle = tokens['--viz-node-style'] || 'plain';
    let svg;
    let nodeIndex;
    let threeDestroy = () => {};
    if (layout.three) {
      const r = renderThree(layout, { document: doc });
      ({ svg, nodeIndex } = r);
      threeDestroy = r.destroy;
    } else {
      ({ svg, nodeIndex } = renderDiagram(layout, { document: doc, paperStyle, nodeStyle }));
    }
    const wrap = doc.createElement('div');
    wrap.className = 'viz-diagram-wrap';
    wrap.appendChild(svg);
    const vp = attachViewport(svg);
    const tt = attachTooltip(svg, nodeIndex, this.el);
    const gt = layout.three ? { destroy() {} } : attachGraphTools(svg, nodeIndex, layout);
    this._diagrams.push({ svg, nodeIndex, layout });
    this._cleanups.push(vp.destroy, tt.destroy, gt.destroy, threeDestroy);
    return wrap;
  }
}
