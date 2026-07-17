// 3D bar chart — isometric extruded columns (front + side + top faces),
// static. Reuses the bars parser; emits px 'path' decor for the faces.

import { CW, CH } from '../units.js';

const ISOX = 0.9;
const ISOY = 0.5;

export function layoutBars3d(model) {
  const rows = model.rows ?? [];
  const empty = { width: 4, height: 4, nodes: [], containers: [], edges: [], decor: [] };
  if (!rows.length) return empty;

  const globalMax = Math.max(100, ...rows.map((r) => (r.max == null ? r.value : 0)));
  const bw = 36;
  const bd = 24;
  const gap = 22;
  const maxH = 150;
  const ox = 50;
  const oy = 210;
  const decor = [];
  let maxSX = 0;
  let maxSY = 0;

  const P = (x, y, z) => ({ x: ox + (x - z) * ISOX, y: oy + (x + z) * ISOY - y });
  const face = (pts, cls, opacity) => ({
    type: 'path',
    d: 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L') + ' Z',
    cls,
    opacity,
  });

  rows.forEach((r, i) => {
    const maxI = r.max ?? globalMax;
    const h = Math.min(1, Math.max(0, r.value / maxI)) * maxH;
    const x0 = i * (bw + gap);
    const A = P(x0, 0, 0);
    const B = P(x0 + bw, 0, 0);
    const C = P(x0 + bw, 0, bd);
    const A2 = P(x0, h, 0);
    const B2 = P(x0 + bw, h, 0);
    const C2 = P(x0 + bw, h, bd);
    const D2 = P(x0, h, bd);
    const cls = i % 6;
    decor.push(face([A, B, B2, A2], cls, 0.9)); // front
    decor.push(face([B, C, C2, B2], cls, 0.6)); // side
    decor.push(face([A2, B2, C2, D2], cls, 1)); // top
    const top = P(x0 + bw / 2, h, bd / 2);
    const base = P(x0 + bw / 2, 0, bd / 2);
    decor.push({ type: 'text', x: top.x / CW, y: (top.y - 10) / CH, text: String(r.value), anchor: 'middle', muted: false });
    decor.push({ type: 'text', x: base.x / CW, y: (base.y + 13) / CH, text: r.label, anchor: 'middle' });
    for (const p of [A, B, C, A2, B2, C2, D2]) {
      maxSX = Math.max(maxSX, p.x);
      maxSY = Math.max(maxSY, p.y);
    }
  });

  return {
    width: Math.ceil((maxSX + 40) / CW),
    height: Math.ceil((maxSY + 30) / CH),
    nodes: [],
    containers: [],
    edges: [],
    decor,
  };
}
