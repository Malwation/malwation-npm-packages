// Interactive drag-drop graph editor. Mounts an editable SVG canvas; supports
// adding nodes, moving them, connecting edges, editing labels and deleting.
// Serializes live to VizEngine graph DSL via editor.toSource().
//
//   const ed = new VizEngine.Editor(el, { onChange: (src) => panel.render(src) });
//   ed.setTool('add'); ed.palette.shape = 'diamond';

import { modelToSource, sourceToModel } from './serialize.js';
import { ICONS } from '../render/icons.js';

const NS = 'http://www.w3.org/2000/svg';
const NW = 128;
const NH = 46;

const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const EDITOR_CSS = `
.viz-editor{font-family:ui-monospace,'SF Mono',Menlo,monospace;background:#fbfbfb;
  background-image:linear-gradient(#eee 1px,transparent 1px),linear-gradient(90deg,#eee 1px,transparent 1px);
  background-size:20px 20px;outline:none;touch-action:none}
.viz-ed-shape{fill:#fff;stroke:#1a1a1a;stroke-width:1.5}
.viz-ed-shape.dashed{stroke-dasharray:5 3;fill:none}
.viz-ed-shape.sel{stroke:#1e6fff;stroke-width:2.5;fill:#eef4ff}
.viz-ed-label{fill:#1a1a1a;font-size:14px;pointer-events:none}
.viz-ed-icon path{stroke:#1a1a1a;fill:none;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.viz-ed-icon circle{fill:#1a1a1a}
.viz-ed-node{cursor:grab}
.viz-ed-line{stroke:#1a1a1a;stroke-width:1.5;fill:none}
.viz-ed-line.sel{stroke:#1e6fff;stroke-width:2.5}
.viz-ed-head{fill:#1a1a1a}
.viz-ed-elabel{fill:#555;font-size:12px;pointer-events:none;paint-order:stroke;stroke:#fbfbfb;stroke-width:4}
.viz-ed-temp{stroke:#1e6fff;stroke-width:2;stroke-dasharray:4 4;fill:none;pointer-events:none}
.viz-ed-ok,.viz-ed-head.viz-ed-ok{stroke:#1a7f37} polygon.viz-ed-head.viz-ed-ok{fill:#1a7f37;stroke:none}
.viz-ed-warn,.viz-ed-head.viz-ed-warn{stroke:#b58900} polygon.viz-ed-head.viz-ed-warn{fill:#b58900;stroke:none}
.viz-ed-err,.viz-ed-head.viz-ed-err{stroke:#b00020} polygon.viz-ed-head.viz-ed-err{fill:#b00020;stroke:none}
.viz-ed-accent,.viz-ed-head.viz-ed-accent{stroke:#1e6fff} polygon.viz-ed-head.viz-ed-accent{fill:#1e6fff;stroke:none}
`;

function ensureEditorStyles() {
  if (typeof document === 'undefined' || document.getElementById('vizengine-editor-styles')) return;
  const s = document.createElement('style');
  s.id = 'vizengine-editor-styles';
  s.textContent = EDITOR_CSS;
  document.head.appendChild(s);
}

export class Editor {
  static get icons() {
    return Object.keys(ICONS);
  }

  constructor(container, opts = {}) {
    if (!container) throw new Error('VizEngine.Editor: container element required');
    ensureEditorStyles();
    this.el = container;
    this.opts = opts;
    this.tool = 'select';
    this.palette = { shape: 'box', icon: null, edgeKind: 'arrow', variant: null };
    this.model = { direction: 'TD', nodes: [], edges: [] };
    this._seq = 0;
    this._selected = null; // {type:'node'|'edge', id}|{type:'edge', index}
    this._drag = null;
    this._connect = null;

    this.svg = el('svg', { class: 'viz-editor', width: '100%', height: '100%', tabindex: '0' });
    this.el.appendChild(this.svg);

    this._onDown = (e) => this._pointerDown(e);
    this._onMove = (e) => this._pointerMove(e);
    this._onUp = (e) => this._pointerUp(e);
    this._onDbl = (e) => this._dblClick(e);
    this._onKey = (e) => this._keyDown(e);
    this.svg.addEventListener('pointerdown', this._onDown);
    this.svg.addEventListener('pointermove', this._onMove);
    this.svg.addEventListener('pointerup', this._onUp);
    this.svg.addEventListener('dblclick', this._onDbl);
    this.svg.addEventListener('keydown', this._onKey);

    this._render();
  }

  // --- public API ---
  setTool(name) {
    this.tool = name;
    this.svg.style.cursor = name === 'add' ? 'crosshair' : name === 'connect' ? 'alias' : 'default';
  }

  toSource() {
    return modelToSource(this.model);
  }

  // add a node at canvas coords (used by drag-drop palette)
  addNode(x, y, opts = {}) {
    const id = `n${++this._seq}`;
    this.model.nodes.push({
      id,
      label: opts.label || id,
      shape: opts.shape || this.palette.shape,
      icon: opts.icon ?? this.palette.icon,
      x,
      y,
    });
    this._selected = { type: 'node', id };
    this._render();
    this._emit();
    return id;
  }

  // map client (mouse/drop) coords → canvas coords
  pointFromClient(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = this.svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
  }

  load(sourceOrModel) {
    this.model = typeof sourceOrModel === 'string' ? sourceToModel(sourceOrModel) : sourceOrModel;
    this._seq = this.model.nodes.reduce((m, n) => Math.max(m, +(/(\d+)$/.exec(n.id)?.[1] || 0)), 0);
    this._selected = null;
    this._render();
  }

  setDirection(dir) {
    this.model.direction = dir;
    this._emit();
  }

  clear() {
    this.model = { direction: this.model.direction, nodes: [], edges: [] };
    this._selected = null;
    this._render();
    this._emit();
  }

  destroy() {
    this.svg.removeEventListener('pointerdown', this._onDown);
    this.svg.removeEventListener('pointermove', this._onMove);
    this.svg.removeEventListener('pointerup', this._onUp);
    this.svg.removeEventListener('dblclick', this._onDbl);
    this.svg.removeEventListener('keydown', this._onKey);
    this.el.replaceChildren();
  }

  // --- internals ---
  _emit() {
    this.opts.onChange?.(this.toSource());
  }

  _svgPoint(ev) {
    const pt = this.svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const ctm = this.svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: ev.offsetX, y: ev.offsetY };
  }

  _nodeAt(id) {
    return this.model.nodes.find((n) => n.id === id);
  }

  _hitNode(ev) {
    const g = ev.target.closest?.('.viz-ed-node');
    return g ? this._nodeAt(g.getAttribute('data-id')) : null;
  }

  _pointerDown(ev) {
    if (ev.button !== 0) return;
    const node = this._hitNode(ev);
    if (this.tool === 'add' && !node) {
      const p = this._svgPoint(ev);
      this.addNode(p.x, p.y);
      return;
    }
    if (node && this.tool === 'connect') {
      this._connect = { from: node.id };
      this.svg.setPointerCapture?.(ev.pointerId);
      return;
    }
    if (node) {
      this._selected = { type: 'node', id: node.id };
      const p = this._svgPoint(ev);
      this._drag = { id: node.id, dx: p.x - node.x, dy: p.y - node.y };
      this.svg.setPointerCapture?.(ev.pointerId);
      this._render();
      return;
    }
    // edge or empty
    const edgeG = ev.target.closest?.('.viz-ed-edge');
    if (edgeG) this._selected = { type: 'edge', index: +edgeG.getAttribute('data-i') };
    else this._selected = null;
    this._render();
  }

  _pointerMove(ev) {
    if (this._drag) {
      const p = this._svgPoint(ev);
      const n = this._nodeAt(this._drag.id);
      n.x = p.x - this._drag.dx;
      n.y = p.y - this._drag.dy;
      this._render();
    } else if (this._connect) {
      const p = this._svgPoint(ev);
      const a = this._nodeAt(this._connect.from);
      let temp = this.svg.querySelector('.viz-ed-temp');
      if (!temp) {
        temp = el('line', { class: 'viz-ed-temp' });
        this.svg.appendChild(temp);
      }
      temp.setAttribute('x1', a.x);
      temp.setAttribute('y1', a.y);
      temp.setAttribute('x2', p.x);
      temp.setAttribute('y2', p.y);
    }
  }

  _pointerUp(ev) {
    if (this._connect) {
      const target = this._hitNode(ev);
      if (target && target.id !== this._connect.from) {
        this.model.edges.push({
          from: this._connect.from,
          to: target.id,
          label: null,
          kind: this.palette.edgeKind,
          variant: this.palette.variant,
        });
        this._emit();
      }
      this._connect = null;
      this.svg.querySelector('.viz-ed-temp')?.remove();
      this._render();
    }
    if (this._drag) {
      this._drag = null;
      this._emit();
    }
  }

  _dblClick(ev) {
    const node = this._hitNode(ev);
    if (node) {
      const v = window.prompt('Node label', node.label ?? node.id);
      if (v != null) {
        node.label = v;
        this._render();
        this._emit();
      }
      return;
    }
    const edgeG = ev.target.closest?.('.viz-ed-edge');
    if (edgeG) {
      const e = this.model.edges[+edgeG.getAttribute('data-i')];
      const v = window.prompt('Edge label', e.label ?? '');
      if (v != null) {
        e.label = v || null;
        this._render();
        this._emit();
      }
    }
  }

  _keyDown(ev) {
    if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
    if (!this._selected) return;
    ev.preventDefault();
    if (this._selected.type === 'node') {
      const id = this._selected.id;
      this.model.nodes = this.model.nodes.filter((n) => n.id !== id);
      this.model.edges = this.model.edges.filter((e) => e.from !== id && e.to !== id);
    } else {
      this.model.edges.splice(this._selected.index, 1);
    }
    this._selected = null;
    this._render();
    this._emit();
  }

  _clip(a, b) {
    // exit point of segment a-center → b on a's NW×NH box
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (!dx && !dy) return { x: a.x, y: a.y };
    const t = Math.min(Math.abs(dx) > 1e-6 ? NW / 2 / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? NH / 2 / Math.abs(dy) : Infinity);
    return { x: a.x + dx * t, y: a.y + dy * t };
  }

  _render() {
    this.svg.replaceChildren();
    // edges under nodes
    this.model.edges.forEach((e, i) => {
      const a = this._nodeAt(e.from);
      const b = this._nodeAt(e.to);
      if (!a || !b) return;
      const p0 = this._clip(a, b);
      const p1 = this._clip(b, a);
      const g = el('g', { class: 'viz-ed-edge', 'data-i': String(i) });
      const cls = 'viz-ed-line' + (e.variant ? ` viz-ed-${e.variant}` : '') + (this._selected?.type === 'edge' && this._selected.index === i ? ' sel' : '');
      const dash = e.kind === 'line' ? '' : '';
      g.appendChild(el('line', { class: cls, x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y, 'stroke-dasharray': dash }));
      if (e.kind !== 'line') {
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const back = { x: p1.x - 10 * Math.cos(ang), y: p1.y - 10 * Math.sin(ang) };
        const nx = Math.cos(ang + Math.PI / 2) * 5;
        const ny = Math.sin(ang + Math.PI / 2) * 5;
        g.appendChild(el('polygon', { class: 'viz-ed-head' + (e.variant ? ` viz-ed-${e.variant}` : ''), points: `${p1.x},${p1.y} ${back.x + nx},${back.y + ny} ${back.x - nx},${back.y - ny}` }));
      }
      if (e.label) {
        const t = el('text', { class: 'viz-ed-elabel', x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 - 5, 'text-anchor': 'middle' });
        t.textContent = e.label;
        g.appendChild(t);
      }
      this.svg.appendChild(g);
    });
    // nodes
    for (const n of this.model.nodes) {
      const g = el('g', { class: 'viz-ed-node', 'data-id': n.id, transform: `translate(${n.x} ${n.y})` });
      const sel = this._selected?.type === 'node' && this._selected.id === n.id;
      const cls = 'viz-ed-shape' + (sel ? ' sel' : '');
      const x = -NW / 2;
      const y = -NH / 2;
      if (n.shape === 'stadium') g.appendChild(el('rect', { class: cls, x, y, width: NW, height: NH, rx: NH / 2 }));
      else if (n.shape === 'diamond') g.appendChild(el('polygon', { class: cls, points: `0,${y} ${NW / 2},0 0,${NH / 2} ${x},0` }));
      else if (n.shape === 'container') g.appendChild(el('rect', { class: cls + ' dashed', x, y, width: NW, height: NH, rx: 4 }));
      else g.appendChild(el('rect', { class: cls, x, y, width: NW, height: NH, rx: 4 }));
      let lx = 0;
      if (n.icon && ICONS[n.icon]) {
        const ig = el('g', { class: 'viz-ed-icon', transform: `translate(${x + 10} ${-9}) scale(1.1)` });
        for (const dd of ICONS[n.icon].d) ig.appendChild(el('path', { d: dd }));
        for (const [cx, cy, r] of ICONS[n.icon].dots) ig.appendChild(el('circle', { cx, cy, r }));
        g.appendChild(ig);
        lx = 11;
      }
      const t = el('text', { class: 'viz-ed-label', x: lx, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = n.label ?? n.id;
      g.appendChild(t);
      this.svg.appendChild(g);
    }
    if (this._connect) {
      // keep temp line visible during connect
      const a = this._nodeAt(this._connect.from);
      if (a) this.svg.appendChild(el('line', { class: 'viz-ed-temp', x1: a.x, y1: a.y, x2: a.x, y2: a.y }));
    }
  }
}
