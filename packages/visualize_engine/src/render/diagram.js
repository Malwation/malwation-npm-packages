// Layout (cell units) → themed SVG. Cell = CW×CH px; grid squares are CW px,
// two per row, so everything sits on the graph paper like hand-set type.
// All strokes/fills/dashes come from semantic classes styled by the theme CSS
// (viz-gridline, viz-shape, viz-frame, viz-edge, viz-arrowhead, viz-label*).

import { CW, CH } from '../units.js';
import { ICONS } from './icons.js';
export { CW, CH };

const SVG_NS = 'http://www.w3.org/2000/svg';
const FONT_SIZE = 15;
let uid = 0;

function el(d, name, attrs = {}) {
  const node = d.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

const ISO = { kx: 0.866, ky: 0.5 };
const ISO_DEPTH = 12; // extrusion depth in px

export function renderDiagram(layout, ctx) {
  const d = ctx.document;
  const iso = layout.projection === 'iso';

  // px-domain projection: identity in 2D, 30° isometric otherwise.
  // The translate keeps everything in the positive quadrant.
  let shiftX = 0;
  if (iso) shiftX = layout.height * CH * ISO.kx;
  const project = iso
    ? (px, py) => ({ x: (px - py) * ISO.kx + shiftX, y: (px + py) * ISO.ky })
    : (px, py) => ({ x: px, y: py });

  // viewBox from the projected content bounds
  const W = layout.width * CW;
  const H = layout.height * CH;
  const corners = [project(0, 0), project(W, 0), project(0, H), project(W, H)];
  const vbW = Math.max(...corners.map((c) => c.x)) + (iso ? ISO_DEPTH : 0);
  const vbH = Math.max(...corners.map((c) => c.y)) + (iso ? ISO_DEPTH : 0);

  const svg = el(d, 'svg', { class: 'viz-diagram', viewBox: `0 0 ${vbW} ${vbH}`, width: vbW, height: vbH });
  svg.appendChild(isoFilters(d)); // node soft-shadow + glow filters (theme opt-in)
  const viewport = el(d, 'g', { class: 'viz-viewport' });
  svg.appendChild(viewport);

  const paperStyle = ctx.paperStyle || 'grid';
  if (iso) {
    viewport.appendChild(isoGrid(d, W, H, project));
  } else if (paperStyle !== 'plain') {
    const patternId = `viz-paper-${++uid}`;
    const defs = el(d, 'defs');
    defs.appendChild(buildPaperPattern(d, paperStyle, patternId));
    svg.appendChild(defs);
    viewport.appendChild(
      el(d, 'rect', {
        class: 'viz-paperbg',
        x: -40 * CW,
        y: -40 * CH,
        width: W + 80 * CW,
        height: H + 80 * CH,
        fill: `url(#${patternId})`,
      }),
    );
  }

  for (const dcr of layout.decor ?? []) {
    const eln = renderDecor(d, dcr);
    if (eln) viewport.appendChild(eln);
  }

  const nodeIndex = new Map();

  for (const c of layout.containers) {
    viewport.appendChild(iso ? isoContainer(d, c, project) : renderContainer(d, c));
    nodeIndex.set(c.id, {
      id: c.id,
      label: c.label,
      shape: 'container',
      title: null,
      rectPx: { x: c.x * CW, y: c.y * CH, w: c.w * CW, h: c.h * CH },
    });
  }

  const nodeStyle = ctx.nodeStyle || 'plain';
  for (const n of layout.nodes) {
    viewport.appendChild(iso ? renderIsoNode(d, n, project) : renderNode(d, n, nodeStyle));
    nodeIndex.set(n.id, {
      id: n.id,
      label: n.label,
      shape: n.shape,
      title: n.title ?? null,
      rectPx: { x: n.x * CW, y: n.y * CH, w: n.w * CW, h: n.h * CH },
    });
  }

  // In iso, orthogonal 2D elbows project to messy diagonals that miss the slab
  // centers. Reroute each edge as a straight center-to-center segment clipped
  // to the node cell-rects, then project — so arrows land on the slab faces.
  let isoRects = null;
  if (iso) {
    isoRects = new Map();
    for (const n of [...layout.nodes, ...layout.containers]) {
      isoRects.set(n.id, { cx: n.x + n.w / 2, cy: n.y + n.h / 2, hw: n.w / 2, hh: n.h / 2 });
    }
  }
  for (const e of layout.edges) {
    let edge = e;
    if (isoRects) {
      const a = isoRects.get(e.from);
      const b = isoRects.get(e.to);
      if (a && b) edge = { ...e, points: [clipCell(a, b.cx, b.cy), clipCell(b, a.cx, a.cy)] };
    }
    viewport.appendChild(renderEdge(d, edge, project));
  }

  if (layout.animate) applyAnimation(d, viewport, layout.animate);

  return { svg, nodeIndex };
}

// Apply CSS-driven motion to a rendered diagram. Modes:
// flow (marching edges) · draw (staggered reveal) · pulse · beacon · trace.
function applyAnimation(d, viewport, mode) {
  const nodeGs = [...viewport.querySelectorAll('.viz-node:not(.viz-container)')];
  const edgeGs = [...viewport.querySelectorAll('.viz-edge-g')];
  const edgeLines = [...viewport.querySelectorAll('.viz-edge')];

  if (mode === 'default' || mode === 'flow' || mode === 'draw') {
    edgeLines.forEach((e) => e.classList.add('viz-anim-flow'));
  }
  if (mode === 'default' || mode === 'draw') {
    // containers reveal first, then their contents, then edges
    const containerGs = [...viewport.querySelectorAll('.viz-container')];
    containerGs.forEach((g, i) => {
      g.classList.add('viz-anim-in');
      g.style.animationDelay = `${(i * 0.2).toFixed(2)}s`;
    });
    const base = containerGs.length * 0.2;
    nodeGs.forEach((g, i) => {
      g.classList.add('viz-anim-in');
      g.style.animationDelay = `${(base + i * 0.3).toFixed(2)}s`;
    });
    edgeGs.forEach((g, i) => {
      g.classList.add('viz-anim-in');
      g.style.animationDelay = `${(base + 0.2 + i * 0.3).toFixed(2)}s`;
    });
  }
  if (mode === 'pulse') {
    nodeGs.forEach((g, i) => {
      g.classList.add('viz-anim-pulse');
      g.style.animationDelay = `${(i * 0.25).toFixed(2)}s`;
    });
  }
  if (mode === 'trace') {
    edgeLines.forEach((e, i) => {
      e.classList.add('viz-anim-trace');
      e.style.animationDelay = `${(i * 0.6).toFixed(2)}s`;
    });
  }
  if (mode === 'beacon') {
    for (const g of nodeGs) {
      const hit = g.querySelector('rect[fill="transparent"], polygon[fill="transparent"]');
      const bb = hit ? { x: +hit.getAttribute('x') || 0, y: +hit.getAttribute('y') || 0, w: +hit.getAttribute('width') || 0, h: +hit.getAttribute('height') || 0 } : null;
      if (!bb) continue;
      const ring = el(d, 'circle', {
        class: 'viz-beacon-ring',
        cx: bb.x + bb.w / 2,
        cy: bb.y + bb.h / 2,
        r: Math.min(bb.w, bb.h) / 2,
      });
      g.insertBefore(ring, g.firstChild);
    }
  }
}

// SVG filter defs shared by every diagram; themes opt in via --viz-node-filter.
function isoFilters(d) {
  const defs = el(d, 'defs');
  const soft = el(d, 'filter', { id: 'viz-soft', x: '-20%', y: '-20%', width: '140%', height: '140%' });
  soft.appendChild(el(d, 'feDropShadow', { dx: '0', dy: '3', stdDeviation: '3', 'flood-color': 'rgba(0,0,0,0.20)' }));
  const glow = el(d, 'filter', { id: 'viz-glow', x: '-60%', y: '-60%', width: '220%', height: '220%' });
  glow.appendChild(el(d, 'feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '2.4', result: 'b' }));
  const merge = el(d, 'feMerge');
  merge.appendChild(el(d, 'feMergeNode', { in: 'b' }));
  merge.appendChild(el(d, 'feMergeNode', { in: 'b' }));
  merge.appendChild(el(d, 'feMergeNode', { in: 'SourceGraphic' }));
  glow.appendChild(merge);
  defs.append(soft, glow);
  return defs;
}

// theme paper texture → SVG <pattern>
function buildPaperPattern(d, style, id) {
  if (style === 'dots') {
    const p = el(d, 'pattern', { id, width: 12, height: 12, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el(d, 'circle', { class: 'viz-griddot', cx: 6, cy: 6, r: 1.1 }));
    return p;
  }
  if (style === 'scanline') {
    const p = el(d, 'pattern', { id, width: 6, height: 3, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el(d, 'path', { class: 'viz-gridline', d: 'M 0 2.5 H 6' }));
    return p;
  }
  if (style === 'blueprint') {
    // plus-tick at each 22px intersection
    const p = el(d, 'pattern', { id, width: 22, height: 22, patternUnits: 'userSpaceOnUse' });
    p.appendChild(el(d, 'path', { class: 'viz-gridline', d: 'M 8 11 h6 M 11 8 v6' }));
    return p;
  }
  // grid (default)
  const p = el(d, 'pattern', { id, width: CW, height: CW, patternUnits: 'userSpaceOnUse' });
  p.appendChild(el(d, 'path', { class: 'viz-gridline', d: `M ${CW} 0 L 0 0 0 ${CW}` }));
  return p;
}

function renderContainer(d, c) {
  const g = el(d, 'g', { class: 'viz-node viz-container', 'data-id': c.id });
  g.appendChild(
    el(d, 'rect', { class: 'viz-shape viz-frame', x: c.x * CW, y: c.y * CH, width: c.w * CW, height: c.h * CH }),
  );
  if (c.label) {
    const lx = (c.x + 1.4) * CW;
    const ly = (c.y + 1) * CH;
    const lw = (c.label.length * 0.62 + 1.4) * (FONT_SIZE - 3);
    // paper-filled tab so the label never crosses the frame stroke
    g.appendChild(el(d, 'rect', { class: 'viz-container-tab', x: lx - 5, y: ly - 8, width: lw, height: 16 }));
    const t = el(d, 'text', {
      class: 'viz-label-muted',
      x: lx,
      y: ly,
      'font-size': FONT_SIZE - 3,
      'dominant-baseline': 'central',
    });
    t.textContent = c.label;
    g.appendChild(t);
  }
  return g;
}

// --- isometric helpers ---

function poly(pts) {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

// point where the ray from a rect center toward (tx,ty) exits the rect (cells)
function clipCell(r, tx, ty) {
  const dx = tx - r.cx;
  const dy = ty - r.cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: r.cx, y: r.cy };
  const t = Math.min(Math.abs(dx) > 1e-6 ? r.hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? r.hh / Math.abs(dy) : Infinity);
  return { x: r.cx + dx * t, y: r.cy + dy * t };
}

// rhombic grid: two families of parallel lines along the iso axes
function isoGrid(d, W, H, project) {
  const g = el(d, 'g');
  const stepX = CW * 3;
  const stepY = CH * 1.5;
  for (let px = 0; px <= W + 1; px += stepX) {
    const a = project(px, 0);
    const b = project(px, H);
    g.appendChild(el(d, 'line', { class: 'viz-gridline', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
  }
  for (let py = 0; py <= H + 1; py += stepY) {
    const a = project(0, py);
    const b = project(W, py);
    g.appendChild(el(d, 'line', { class: 'viz-gridline', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
  }
  return g;
}

function isoContainer(d, c, project) {
  const g = el(d, 'g', { class: 'viz-node viz-container', 'data-id': c.id });
  const x = c.x * CW;
  const y = c.y * CH;
  const w = c.w * CW;
  const h = c.h * CH;
  const top = [project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)];
  g.appendChild(el(d, 'polygon', { class: 'viz-shape viz-frame', points: poly(top) }));
  if (c.label) {
    const p = project(x + 2.4 * CW, y + CH);
    const lw = (c.label.length * 0.62 + 1.4) * (FONT_SIZE - 3);
    g.appendChild(el(d, 'rect', { class: 'viz-container-tab', x: p.x - 5, y: p.y - 8, width: lw, height: 16 }));
    const t = el(d, 'text', {
      class: 'viz-label-muted',
      x: p.x,
      y: p.y,
      'font-size': FONT_SIZE - 3,
      'dominant-baseline': 'central',
    });
    t.textContent = c.label;
    g.appendChild(t);
  }
  return g;
}

function renderIsoNode(d, n, project) {
  const g = el(d, 'g', { class: 'viz-node', 'data-id': n.id });
  const x = n.x * CW;
  const y = n.y * CH;
  const w = n.w * CW;
  const h = n.h * CH;
  const TL = project(x, y);
  const TR = project(x + w, y);
  const BR = project(x + w, y + h);
  const BL = project(x, y + h);
  const down = (p) => ({ x: p.x, y: p.y + ISO_DEPTH });

  // side walls (behind the top face)
  g.appendChild(el(d, 'polygon', { class: 'viz-iso-side', points: poly([BL, BR, down(BR), down(BL)]) }));
  g.appendChild(el(d, 'polygon', { class: 'viz-iso-side', points: poly([BR, TR, down(TR), down(BR)]) }));

  // top face — stroke pattern encodes shape identity in iso
  const topCls =
    n.shape === 'stadium' || n.shape === 'diamond' ? 'viz-shape viz-iso-top viz-frame' : 'viz-shape viz-iso-top';
  const topFace = el(d, 'polygon', { class: topCls, points: poly([TL, TR, BR, BL]) });
  if (n.shape === 'stadium') topFace.setAttribute('stroke-dasharray', '1.5 4.5');
  g.appendChild(topFace);

  // billboarded icon + label on the projected top-face centre. The label uses
  // text-anchor:middle so it is EXACTLY centred (no width estimate to drift);
  // the icon sits just left of it and a paper plate wraps the pair so it reads
  // crisply on the slanted slab.
  const icon = n.icon ? ICONS[n.icon] : null;
  const c = project(x + w / 2, y + h / 2);
  const labelPx = (n.label?.length ?? 0) * (FONT_SIZE - 1) * 0.62;
  const shift = icon ? 11 : 0; // nudge label right to make room for the icon
  const leftEdge = c.x + shift - labelPx / 2 - (icon ? 22 : 4);
  const rightEdge = c.x + shift + labelPx / 2 + 4;
  // subtle plate wrapping the label pair — the slab top face is already paper,
  // so keep it light so the label reads as sitting ON the slab, not floating
  g.appendChild(
    el(d, 'rect', { class: 'viz-iso-plate', x: leftEdge, y: c.y - 8.5, width: rightEdge - leftEdge, height: 17, rx: 8.5 }),
  );
  if (icon) {
    const ig = el(d, 'g', { class: 'viz-icon', transform: `translate(${leftEdge + 3} ${c.y - 8}) scale(1.05)` });
    for (const dd of icon.d) ig.appendChild(el(d, 'path', { class: 'viz-icon-stroke', d: dd }));
    for (const [dcx, dcy, dr] of icon.dots) {
      ig.appendChild(el(d, 'circle', { class: 'viz-icon-dot', cx: dcx, cy: dcy, r: dr }));
    }
    g.appendChild(ig);
  }
  const label = el(d, 'text', {
    class: 'viz-label',
    x: c.x + shift,
    y: c.y,
    'font-size': FONT_SIZE - 1,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'paint-order': 'stroke',
    stroke: 'var(--viz-paper)',
    'stroke-width': '3',
  });
  label.textContent = n.label;
  g.appendChild(label);

  // hit target
  g.appendChild(el(d, 'polygon', { points: poly([TL, TR, BR, BL]), fill: 'transparent' }));
  return g;
}

// Generic decorations drawn beneath nodes/edges. Coordinates are in cells,
// except 'path' whose d is raw px (circles must not be distorted by CW≠CH).
function renderDecor(d, dcr) {
  switch (dcr.type) {
    case 'line': {
      const attrs = {
        class: dcr.muted === false ? 'viz-edge' : 'viz-decor-line',
        points: dcr.points.map((p) => `${p.x * CW},${p.y * CH}`).join(' '),
      };
      if (dcr.dash) attrs['stroke-dasharray'] = '4 4';
      return el(d, 'polyline', attrs);
    }
    case 'text': {
      const t = el(d, 'text', {
        class: dcr.muted === false ? 'viz-label' : 'viz-label-muted',
        x: dcr.x * CW,
        y: dcr.y * CH,
        'font-size': dcr.size ?? 12,
        'text-anchor': dcr.anchor ?? 'start',
        'dominant-baseline': 'central',
      });
      t.textContent = dcr.text ?? '';
      return t;
    }
    case 'rect': {
      const attrs = {
        class: 'viz-shape',
        x: dcr.x * CW,
        y: dcr.y * CH,
        width: dcr.w * CW,
        height: dcr.h * CH,
      };
      if (dcr.dash) attrs['stroke-dasharray'] = '4 3';
      return el(d, 'rect', attrs);
    }
    case 'rect-fill':
      return el(d, 'rect', {
        class: `viz-bar-fill viz-fill-${dcr.cls ?? 0}`,
        x: dcr.x * CW,
        y: dcr.y * CH,
        width: dcr.w * CW,
        height: dcr.h * CH,
      });
    case 'path': {
      const attrs = { class: `viz-bar-fill viz-fill-${dcr.cls ?? 0}`, d: dcr.d };
      if (dcr.opacity != null) attrs['fill-opacity'] = dcr.opacity;
      return el(d, 'path', attrs);
    }
    case 'ribbon': {
      const x0 = dcr.x0 * CW;
      const y0 = dcr.y0 * CH;
      const x1 = dcr.x1 * CW;
      const y1 = dcr.y1 * CH;
      const w = (dcr.w * CH) / 2;
      const mx = (x0 + x1) / 2;
      const path =
        `M ${x0} ${y0 - w} C ${mx} ${y0 - w}, ${mx} ${y1 - w}, ${x1} ${y1 - w} ` +
        `L ${x1} ${y1 + w} C ${mx} ${y1 + w}, ${mx} ${y0 + w}, ${x0} ${y0 + w} Z`;
      const attrs = { class: `viz-bar-fill viz-fill-${dcr.cls ?? 0}`, d: path, 'fill-opacity': dcr.opacity ?? 0.45 };
      return el(d, 'path', attrs);
    }
    case 'landmass':
      return el(d, 'path', { class: 'viz-geo-land', d: dcr.d });
    case 'pin':
      return el(d, 'circle', { class: 'viz-pin', cx: dcr.x * CW, cy: dcr.y * CH, r: dcr.r ?? 3.5 });
    case 'icon': {
      const ic = ICONS[dcr.name];
      if (!ic) return null;
      const s = (dcr.size ?? 16) / 16;
      const g = el(d, 'g', { transform: `translate(${dcr.x * CW - 8 * s} ${dcr.y * CH - 8 * s}) scale(${s})` });
      for (const dd of ic.d) g.appendChild(el(d, 'path', { class: 'viz-icon-stroke', d: dd }));
      for (const [cx, cy, r] of ic.dots) g.appendChild(el(d, 'circle', { class: 'viz-icon-dot', cx, cy, r }));
      return g;
    }
    case 'arc': {
      const x0 = dcr.x0 * CW;
      const y0 = dcr.y0 * CH;
      const x1 = dcr.x1 * CW;
      const y1 = dcr.y1 * CH;
      const mx = (x0 + x1) / 2;
      const my = Math.min(y0, y1) - Math.abs(x1 - x0) * 0.28 - 14;
      const g = el(d, 'g');
      const cls = dcr.variant ? `viz-arc viz-edge-${dcr.variant}` : 'viz-arc';
      const attrs = { class: cls, d: `M ${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`, fill: 'none' };
      if (dcr.dash === 'dashed') attrs['stroke-dasharray'] = '6 4';
      else if (dcr.dash === 'dotted') attrs['stroke-dasharray'] = '1.5 4';
      g.appendChild(el(d, 'path', attrs));
      if (dcr.arrow) {
        const ang = Math.atan2(y1 - my, x1 - mx);
        const back = { x: x1 - 10 * Math.cos(ang), y: y1 - 10 * Math.sin(ang) };
        const nx = Math.cos(ang + Math.PI / 2) * 5;
        const ny = Math.sin(ang + Math.PI / 2) * 5;
        const hc = dcr.variant ? `viz-arrowhead viz-arrowhead-${dcr.variant}` : 'viz-arrowhead';
        g.appendChild(el(d, 'polygon', { class: hc, points: `${x1},${y1} ${back.x + nx},${back.y + ny} ${back.x - nx},${back.y - ny}` }));
      }
      if (dcr.label) {
        const t = el(d, 'text', {
          class: 'viz-label-muted',
          x: mx,
          y: my + 1,
          'text-anchor': 'middle',
          'font-size': 11,
          'paint-order': 'stroke',
          stroke: 'var(--viz-paper)',
          'stroke-width': '4',
        });
        t.textContent = dcr.label;
        g.appendChild(t);
      }
      return g;
    }
    default:
      return null;
  }
}

// Per-theme box geometry. All shapes inscribe within [x,y,w,h]; layout is
// theme-agnostic, so only the drawing differs. Returns element(s).
function renderBoxShape(d, style, x, y, w, h) {
  const cy = y + h / 2;
  const box = (rx = 0, cls = 'viz-shape viz-box') =>
    el(d, 'rect', rx ? { class: cls, x, y, width: w, height: h, rx } : { class: cls, x, y, width: w, height: h });
  switch (style) {
    case 'rounded':
      return [box(8)];
    case 'pill':
      return [box(h / 2)];
    case 'bracket': {
      const L = Math.min(w, h) * 0.3;
      const seg = (pts) => el(d, 'polyline', { class: 'viz-shape', points: pts, fill: 'none' });
      return [
        seg(`${x},${y + L} ${x},${y} ${x + L},${y}`),
        seg(`${x + w - L},${y} ${x + w},${y} ${x + w},${y + L}`),
        seg(`${x + w},${y + h - L} ${x + w},${y + h} ${x + w - L},${y + h}`),
        seg(`${x + L},${y + h} ${x},${y + h} ${x},${y + h - L}`),
      ];
    }
    case 'window': {
      const bar = y + 9;
      const out = [box(3)];
      out.push(el(d, 'line', { class: 'viz-shape', x1: x, y1: bar, x2: x + w, y2: bar }));
      for (let k = 0; k < 3; k++) out.push(el(d, 'circle', { class: 'viz-icon-dot', cx: x + 7 + k * 6, cy: y + 4.5, r: 1.4 }));
      return out;
    }
    case 'cut': {
      const c = Math.min(9, h * 0.32);
      return [
        el(d, 'polygon', {
          class: 'viz-shape',
          points: `${x + c},${y} ${x + w - c},${y} ${x + w},${y + c} ${x + w},${y + h - c} ${x + w - c},${y + h} ${x + c},${y + h} ${x},${y + h - c} ${x},${y + c}`,
        }),
      ];
    }
    case 'hex': {
      const inset = Math.min(15, w * 0.18);
      return [
        el(d, 'polygon', {
          class: 'viz-shape',
          points: `${x + inset},${y} ${x + w - inset},${y} ${x + w},${cy} ${x + w - inset},${y + h} ${x + inset},${y + h} ${x},${cy}`,
        }),
      ];
    }
    case 'double':
      return [
        box(0),
        el(d, 'rect', { class: 'viz-shape', x: x + 3, y: y + 3, width: w - 6, height: h - 6, fill: 'none' }),
      ];
    case 'underline':
      return [el(d, 'line', { class: 'viz-shape', x1: x + 2, y1: y + h - 3, x2: x + w - 2, y2: y + h - 3 })];
    case 'tag': {
      const n = h * 0.5;
      return [
        el(d, 'polygon', {
          class: 'viz-shape',
          points: `${x + n},${y} ${x + w},${y} ${x + w},${y + h} ${x + n},${y + h} ${x},${cy}`,
        }),
        el(d, 'circle', { class: 'viz-shape', cx: x + n * 0.55, cy, r: 2, fill: 'none' }),
      ];
    }
    default:
      return [box(0)];
  }
}

function renderNode(d, n, nodeStyle = 'plain') {
  const g = el(d, 'g', { class: 'viz-node', 'data-id': n.id });
  const x = n.x * CW;
  const y = n.y * CH;
  const w = n.w * CW;
  const h = n.h * CH;
  const cx = x + w / 2;
  const cy = y + h / 2;

  if (n.shape === 'stadium') {
    // ASCII stadium: dotted top/bottom rules with ( ) endcap glyphs.
    // The dot pattern is engine signature — deliberately not theme-driven.
    const inset = 1.5 * CW;
    for (const yy of [y, y + h]) {
      g.appendChild(
        el(d, 'line', {
          class: 'viz-shape',
          x1: x + inset,
          y1: yy,
          x2: x + w - inset,
          y2: yy,
          'stroke-dasharray': '1.5 4.5',
          'stroke-linecap': 'round',
        }),
      );
    }
    for (const [glyph, gx] of [['(', x + CW * 0.5], [')', x + w - CW * 0.5]]) {
      const t = el(d, 'text', {
        class: 'viz-label',
        x: gx,
        y: cy,
        'font-size': Math.round(h * 0.62),
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
      });
      t.textContent = glyph;
      g.appendChild(t);
    }
  } else if (n.shape === 'diamond') {
    g.appendChild(
      el(d, 'polygon', {
        class: 'viz-shape viz-frame',
        points: `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`,
      }),
    );
  } else {
    for (const shp of renderBoxShape(d, nodeStyle, x, y, w, h)) g.appendChild(shp);
  }

  const icon = n.icon ? ICONS[n.icon] : null;
  if (icon) {
    const scale = 20 / 16;
    const ig = el(d, 'g', {
      class: 'viz-icon',
      transform: `translate(${x + 1.2 * CW} ${cy - 10}) scale(${scale})`,
    });
    for (const dd of icon.d) ig.appendChild(el(d, 'path', { class: 'viz-icon-stroke', d: dd }));
    for (const [dcx, dcy, dr] of icon.dots) {
      ig.appendChild(el(d, 'circle', { class: 'viz-icon-dot', cx: dcx, cy: dcy, r: dr }));
    }
    g.appendChild(ig);
  }

  const label = el(d, 'text', {
    class: 'viz-label',
    x: icon ? cx + 1.5 * CW : cx,
    y: cy,
    'font-size': FONT_SIZE,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
  });
  label.textContent = n.label;
  g.appendChild(label);

  // invisible hit target so hover/click covers the whole cell rect
  g.appendChild(el(d, 'rect', { x, y, width: w, height: h, fill: 'transparent' }));
  return g;
}

const ARROW = 11;

// Rotation-aware arrowhead: a filled triangle pointing from `from` toward
// `tip`. Works for any angle (used by 2D axis-aligned edges and iso edges).
function arrowhead(d, tip, from, cls) {
  const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
  const back = { x: tip.x - ARROW * Math.cos(ang), y: tip.y - ARROW * Math.sin(ang) };
  const half = 5;
  const nx = Math.cos(ang + Math.PI / 2) * half;
  const ny = Math.sin(ang + Math.PI / 2) * half;
  return el(d, 'polygon', {
    class: cls,
    points: `${tip.x},${tip.y} ${back.x + nx},${back.y + ny} ${back.x - nx},${back.y - ny}`,
  });
}

// shorten a segment endpoint by ARROW px toward its neighbor
function pullBack(tip, from) {
  const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
  return { x: tip.x - ARROW * Math.cos(ang), y: tip.y - ARROW * Math.sin(ang) };
}

export function renderEdge(d, e, project = (x, y) => ({ x, y })) {
  const g = el(d, 'g', { class: 'viz-edge-g' });
  const pts = e.points.map((p) => project(p.x * CW, p.y * CH));
  const first = pts[0];
  const second = pts[1] ?? first;
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2] ?? last;

  const headCls = e.variant ? `viz-arrowhead viz-arrowhead-${e.variant}` : 'viz-arrowhead';
  const lineCls = e.variant ? `viz-edge viz-edge-${e.variant}` : 'viz-edge';

  const linePts = pts.slice();
  if (e.arrow) linePts[linePts.length - 1] = pullBack(last, prev);
  if (e.both) linePts[0] = pullBack(first, second);

  g.appendChild(el(d, 'polyline', { class: lineCls, points: linePts.map((p) => `${p.x},${p.y}`).join(' ') }));
  if (e.arrow) g.appendChild(arrowhead(d, last, prev, headCls));
  if (e.both) g.appendChild(arrowhead(d, first, second, headCls));

  if (e.label) {
    const [a, b] = pts.length >= 4 ? [pts[1], pts[2]] : [pts[0], last];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (Math.abs(a.y - b.y) < 0.5) mid.y -= 10;
    const t = el(d, 'text', {
      class: 'viz-label-muted',
      x: mid.x,
      y: mid.y,
      'font-size': FONT_SIZE - 3,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'paint-order': 'stroke',
      stroke: 'var(--viz-paper)',
      'stroke-width': '6',
    });
    t.textContent = e.label;
    g.appendChild(t);
  }
  return g;
}
