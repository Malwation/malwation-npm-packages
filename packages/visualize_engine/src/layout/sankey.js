// Sankey layout: nodes ranked into columns; node height ∝ its flow; links are
// weighted ribbons. Everything is decor (thin node bars + ribbons + labels).

const MARGIN = 2;
const COL_W = 30; // cells between columns
const NODE_W = 1.5; // node bar width (cells)
const H = 34; // target chart height (cells)
const GAP = 1.5; // vertical gap between stacked nodes (cells)

export function layoutSankey(model) {
  const nodes = model.nodes ?? [];
  const links = model.links ?? [];
  const empty = { width: 6, height: 6, nodes: [], containers: [], edges: [], decor: [] };
  if (!nodes.length || !links.length) return empty;

  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  // longest-path ranks (column assignment)
  const rank = nodes.map(() => 0);
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const l of links) {
      const a = idx.get(l.from);
      const b = idx.get(l.to);
      if (a == null || b == null) continue;
      if (rank[b] < rank[a] + 1) {
        rank[b] = rank[a] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const maxRank = Math.max(0, ...rank);

  // node value = max(sum in, sum out)
  const inSum = nodes.map(() => 0);
  const outSum = nodes.map(() => 0);
  for (const l of links) {
    const a = idx.get(l.from);
    const b = idx.get(l.to);
    if (a != null) outSum[a] += l.value;
    if (b != null) inSum[b] += l.value;
  }
  const value = nodes.map((_, i) => Math.max(inSum[i], outSum[i], 1));

  // group by column, compute scale so the tallest column fits H
  const cols = [];
  nodes.forEach((_, i) => {
    (cols[rank[i]] ??= []).push(i);
  });
  const colValue = cols.map((c) => c.reduce((s, i) => s + value[i], 0) + GAP * (c.length - 1));
  const scale = (H - MARGIN) / Math.max(...colValue.map((v, ci) => v - GAP * (cols[ci].length - 1)), 1);

  // node rects (cells)
  const rect = nodes.map(() => null);
  cols.forEach((c, ci) => {
    // sort by value desc for tidiness
    c.sort((a, b) => value[b] - value[a]);
    const totalH = c.reduce((s, i) => s + value[i] * scale, 0) + GAP * (c.length - 1);
    let y = MARGIN + (H - totalH) / 2;
    const x = MARGIN + ci * COL_W;
    for (const i of c) {
      const h = value[i] * scale;
      rect[i] = { x, y, w: NODE_W, h, cx: x + NODE_W, cy: y + h / 2 };
      y += h + GAP;
    }
  });

  const decor = [];
  // ribbons first (behind bars)
  const outOff = nodes.map(() => 0);
  const inOff = nodes.map(() => 0);
  links.forEach((l) => {
    const a = idx.get(l.from);
    const b = idx.get(l.to);
    if (a == null || b == null || !rect[a] || !rect[b]) return;
    const w = l.value * scale;
    const y0 = rect[a].y + outOff[a] + w / 2;
    const y1 = rect[b].y + inOff[b] + w / 2;
    outOff[a] += w;
    inOff[b] += w;
    decor.push({ type: 'ribbon', x0: rect[a].x + NODE_W, y0, x1: rect[b].x, y1, w, cls: a % 6, opacity: 0.4 });
  });

  // node bars + labels
  let maxX = 0;
  nodes.forEach((n, i) => {
    const r = rect[i];
    if (!r) return;
    decor.push({ type: 'rect-fill', x: r.x, y: r.y, w: r.w, h: r.h, cls: i % 6 });
    const lastCol = rank[i] === maxRank;
    decor.push({
      type: 'text',
      x: lastCol ? r.x - 0.7 : r.x + NODE_W + 0.7,
      y: r.cy,
      text: `${n.label} ${value[i]}`,
      anchor: lastCol ? 'end' : 'start',
      muted: false,
    });
    maxX = Math.max(maxX, r.x + NODE_W + (lastCol ? 0 : n.label.length + 6));
  });

  return { width: Math.ceil(maxX + MARGIN + 6), height: H + MARGIN, nodes: [], containers: [], edges: [], decor };
}
