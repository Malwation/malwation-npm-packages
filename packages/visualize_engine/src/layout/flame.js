// Flame / icicle graph: root row on top, children stacked below within the
// parent's x-range, width ∝ value. Frames are filled bars with labels.

const MARGIN = 2;
const W = 60;
const ROW = 2.4; // cells per stack level

export function layoutFlame(model) {
  const roots = model.roots ?? [];
  if (!roots.length) return { width: 6, height: 6, nodes: [], containers: [], edges: [], decor: [] };
  const root = { label: 'all', value: roots.reduce((s, r) => s + r.value, 0), children: roots };
  const decor = [];
  let maxDepth = 0;
  let colorSeed = 0;

  const place = (node, x, w, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const y = MARGIN + depth * ROW;
    const cls = colorSeed++ % 6;
    decor.push({ type: 'rect-fill', x, y, w, h: ROW - 0.35, cls, opacity: 0.85 });
    decor.push({ type: 'rect', x, y, w, h: ROW - 0.35 });
    if (w >= node.label.length * 0.6 + 1) {
      decor.push({ type: 'text', x: x + 0.6, y: y + (ROW - 0.35) / 2, text: node.label, anchor: 'start', muted: false });
    }
    let cx = x;
    for (const c of node.children) {
      const cw = node.value > 0 ? w * (c.value / node.value) : 0;
      place(c, cx, cw, depth + 1);
      cx += cw;
    }
  };

  place(root, MARGIN, W, 0);
  return {
    width: W + MARGIN * 2,
    height: MARGIN + (maxDepth + 1) * ROW + MARGIN,
    nodes: [],
    containers: [],
    edges: [],
    decor,
  };
}
