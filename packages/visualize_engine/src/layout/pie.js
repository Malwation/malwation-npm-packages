// Donut chart. Slice paths are computed in raw px (decor type 'path') so the
// CW≠CH cell scale cannot distort the circle; legend stays in cell units.
// Reuses the bars line grammar (`label: value`).

import { CW, CH } from '../units.js';

const MARGIN = 2;
const R = 72; // outer radius px
const RI = 42; // inner radius px

function pt(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
}

function slicePath(cx, cy, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  return (
    `M ${pt(cx, cy, R, a0)} A ${R} ${R} 0 ${large} 1 ${pt(cx, cy, R, a1)} ` +
    `L ${pt(cx, cy, RI, a1)} A ${RI} ${RI} 0 ${large} 0 ${pt(cx, cy, RI, a0)} Z`
  );
}

export function layoutPie(model) {
  const rows = (model.rows ?? []).filter((r) => r.value > 0);
  const decor = [];
  const empty = { width: MARGIN * 2, height: MARGIN * 2, nodes: [], containers: [], edges: [], decor };
  if (!rows.length) return empty;
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (total <= 0) return empty;

  const cx = MARGIN * CW + R;
  const cy = MARGIN * CH + R;
  const pad = rows.length > 1 ? 0.8 : 0; // degree gap between slices

  let angle = -90;
  rows.forEach((r, i) => {
    const sweep = (360 * r.value) / total;
    const a0 = angle + pad;
    const a1 = angle + sweep - pad;
    if (a1 - a0 > 180) {
      const mid = (a0 + a1) / 2;
      decor.push({ type: 'path', d: slicePath(cx, cy, a0, mid), cls: i % 6 });
      decor.push({ type: 'path', d: slicePath(cx, cy, mid, a1), cls: i % 6 });
    } else if (a1 > a0) {
      decor.push({ type: 'path', d: slicePath(cx, cy, a0, a1), cls: i % 6 });
    }
    angle += sweep;
  });

  // legend
  const legendX = Math.ceil((cx + R) / CW) + 2;
  let maxLen = 0;
  rows.forEach((r, i) => {
    const y = MARGIN + i * 2;
    const pct = Math.round((100 * r.value) / total);
    const text = `${r.label}  ${r.value} (${pct}%)`;
    maxLen = Math.max(maxLen, text.length);
    decor.push({ type: 'rect-fill', x: legendX, y: y + 0.15, w: 1.6, h: 0.7, cls: i % 6 });
    decor.push({ type: 'text', x: legendX + 2.4, y: y + 0.5, text, anchor: 'start' });
  });

  return {
    width: legendX + 3 + maxLen + MARGIN,
    height: Math.max(Math.ceil((cy + R) / CH) + MARGIN, MARGIN + rows.length * 2 + 1),
    nodes: [],
    containers: [],
    edges: [],
    decor,
  };
}
