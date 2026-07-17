// Force-directed network layout (Fruchterman–Reingold). Deterministic: nodes
// seed on a golden-angle spiral (no randomness), then relax over fixed
// iterations. Edges are straight, clipped to node boxes.

import { nodeSize } from './layered.js';

const MARGIN = 2;
const TARGET = 64; // target span in cells

function clip(cx, cy, hw, hh, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: cx, y: cy };
  const t = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

export function layoutNetwork(model) {
  const nodes = model.nodes.filter((n) => n.shape !== 'container');
  const empty = { width: 6, height: 6, nodes: [], containers: [], edges: [], decor: [] };
  if (!nodes.length) return empty;
  const N = nodes.length;
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = model.edges.filter((e) => idx.has(e.from) && idx.has(e.to));
  const adj = edges.map((e) => [idx.get(e.from), idx.get(e.to)]);
  const size = nodes.map((n) => nodeSize(n));

  // seed on a golden-angle spiral
  const GA = Math.PI * (3 - Math.sqrt(5));
  const px = new Array(N);
  const py = new Array(N);
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(i + 0.5) * 24;
    px[i] = Math.cos(i * GA) * r;
    py[i] = Math.sin(i * GA) * r;
  }

  const k = 62; // ideal edge length
  let temp = 130;
  for (let it = 0; it < 280; it++) {
    const fx = new Array(N).fill(0);
    const fy = new Array(N).fill(0);
    // repulsion
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let ddx = px[i] - px[j];
        let ddy = py[i] - py[j];
        let d2 = ddx * ddx + ddy * ddy;
        if (d2 < 0.01) {
          ddx = ((i - j) % 3) - 1 || 1;
          ddy = 1;
          d2 = ddx * ddx + ddy * ddy;
        }
        const d = Math.sqrt(d2);
        const f = (k * k) / d;
        fx[i] += (ddx / d) * f;
        fy[i] += (ddy / d) * f;
        fx[j] -= (ddx / d) * f;
        fy[j] -= (ddy / d) * f;
      }
    }
    // attraction along edges
    for (const [a, b] of adj) {
      const ddx = px[a] - px[b];
      const ddy = py[a] - py[b];
      const d = Math.sqrt(ddx * ddx + ddy * ddy) || 0.01;
      const f = (d * d) / k;
      fx[a] -= (ddx / d) * f;
      fy[a] -= (ddy / d) * f;
      fx[b] += (ddx / d) * f;
      fy[b] += (ddy / d) * f;
    }
    for (let i = 0; i < N; i++) {
      const d = Math.sqrt(fx[i] * fx[i] + fy[i] * fy[i]) || 1;
      const m = Math.min(d, temp);
      px[i] += (fx[i] / d) * m;
      py[i] += (fy[i] / d) * m;
    }
    temp *= 0.965;
  }

  // scale to cells
  const minX = Math.min(...px);
  const maxX = Math.max(...px);
  const minY = Math.min(...py);
  const maxY = Math.max(...py);
  const s = TARGET / Math.max(maxX - minX, maxY - minY, 1);
  const cx = px.map((v) => MARGIN + (v - minX) * s + 8);
  const cy = py.map((v) => MARGIN + (v - minY) * s + 8);

  const outNodes = nodes.map((n, i) => ({
    id: n.id,
    label: n.label,
    shape: n.shape,
    title: n.title ?? null,
    icon: n.icon ?? null,
    w: size[i].w,
    h: size[i].h,
    x: Math.round(cx[i] - size[i].w / 2),
    y: Math.round(cy[i] - size[i].h / 2),
  }));
  const center = new Map(outNodes.map((n) => [n.id, { cx: n.x + n.w / 2, cy: n.y + n.h / 2, hw: n.w / 2, hh: n.h / 2 }]));

  const outEdges = edges.map((e) => {
    const a = center.get(e.from);
    const b = center.get(e.to);
    const p0 = clip(a.cx, a.cy, a.hw, a.hh, b.cx, b.cy);
    const p1 = clip(b.cx, b.cy, b.hw, b.hh, a.cx, a.cy);
    return { from: e.from, to: e.to, label: e.label ?? null, arrow: e.kind !== 'line', both: e.kind === 'both', variant: e.variant ?? null, points: [p0, p1] };
  });

  let maxCX = 0;
  let maxCY = 0;
  for (const n of outNodes) {
    maxCX = Math.max(maxCX, n.x + n.w);
    maxCY = Math.max(maxCY, n.y + n.h);
  }
  return { width: maxCX + MARGIN + 8, height: maxCY + MARGIN + 8, nodes: outNodes, containers: [], edges: outEdges, decor: [] };
}
