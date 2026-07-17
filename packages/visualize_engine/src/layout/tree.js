// Tidy tree layout: every subtree owns a horizontal extent (its own width or
// its packed children, whichever is wider), siblings never overlap, parents
// are centered over their children. Row heights adapt to the tallest node
// per depth (diamonds are 5 rows). Same result contract as layoutGraph.

import { nodeSize, routeElbow } from './layered.js';

const MARGIN = 2;
const GAP_X = 2;
const GAP_Y = 2;

export function layoutTree(model) {
  const roots = model.roots ?? [];
  const nodes = [];
  const edges = [];
  let counter = 0;

  // pass 1: measure subtree extents and per-depth row heights
  const rowH = [];
  function measure(n, depth) {
    const size = nodeSize(n);
    rowH[depth] = Math.max(rowH[depth] ?? 0, size.h);
    const kids = (n.children ?? []).map((c) => measure(c, depth + 1));
    const kidsW = kids.length
      ? kids.reduce((sum, k) => sum + k.extent, 0) + GAP_X * (kids.length - 1)
      : 0;
    return { n, size, kids, depth, extent: Math.max(size.w, kidsW) };
  }
  const measured = roots.map((r) => measure(r, 0));

  const rowY = [MARGIN];
  for (let d = 0; d < rowH.length; d++) rowY[d + 1] = rowY[d] + (rowH[d] ?? 3) + GAP_Y;

  // pass 2: place each subtree inside its allocated extent
  function place(m, left) {
    const rec = {
      id: `n${counter++}`,
      label: m.n.label ?? '',
      shape: m.n.shape ?? 'box',
      title: null,
      icon: m.n.icon ?? null,
      w: m.size.w,
      h: m.size.h,
      y: rowY[m.depth] + ((rowH[m.depth] - m.size.h) >> 1),
      x: 0,
    };
    nodes.push(rec);
    if (!m.kids.length) {
      rec.x = left + ((m.extent - m.size.w) >> 1);
      return rec;
    }
    const kidsW = m.kids.reduce((sum, k) => sum + k.extent, 0) + GAP_X * (m.kids.length - 1);
    let cursor = left + ((m.extent - kidsW) >> 1);
    const placedKids = [];
    for (const k of m.kids) {
      placedKids.push(place(k, cursor));
      cursor += k.extent + GAP_X;
    }
    const first = placedKids[0];
    const last = placedKids[placedKids.length - 1];
    const mid = (first.x + last.x + last.w) >> 1;
    rec.x = Math.max(left, mid - (rec.w >> 1));
    for (const k of placedKids) {
      edges.push({ from: rec.id, to: k.id, label: null, arrow: false, points: routeElbow(rec, k, 'TD') });
    }
    return rec;
  }

  let cursor = MARGIN;
  for (const m of measured) {
    place(m, cursor);
    cursor += m.extent + GAP_X * 2;
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
  }
  return { width: maxX + MARGIN, height: maxY + MARGIN, nodes, containers: [], edges };
}
