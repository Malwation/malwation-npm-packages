// Squarified treemap: recursively subdivide a rect among children by value.
// Leaves are filled; every cell gets a border; labels drawn when they fit.

const MARGIN = 2;
const W = 56;
const H = 34;

function worst(row, side) {
  const s = row.reduce((a, b) => a + b, 0);
  const mx = Math.max(...row);
  const mn = Math.min(...row);
  return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
}

// squarify `areas` into `rect`, pushing {x,y,w,h,i} placements into `out`
function squarify(areas, indices, rect, out) {
  const rem = areas.slice();
  const remI = indices.slice();
  let row = [];
  let rowI = [];
  const layoutRow = () => {
    // fill along the shorter side: tall rect → horizontal strips, wide → vertical
    const horizontal = rect.w <= rect.h;
    const total = row.reduce((a, b) => a + b, 0);
    if (horizontal) {
      const rh = total / rect.w;
      let x = rect.x;
      row.forEach((a, k) => {
        const w = a / rh;
        out.push({ x, y: rect.y, w, h: rh, i: rowI[k] });
        x += w;
      });
      rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
    } else {
      const rw = total / rect.h;
      let y = rect.y;
      row.forEach((a, k) => {
        const h = a / rw;
        out.push({ x: rect.x, y, w: rw, h, i: rowI[k] });
        y += h;
      });
      rect = { x: rect.x + rw, y: rect.y, w: rect.w - rw, h: rect.h };
    }
    row = [];
    rowI = [];
  };
  while (rem.length) {
    const side = Math.min(rect.w, rect.h);
    const next = row.concat(rem[0]);
    if (row.length === 0 || worst(next, side) <= worst(row, side)) {
      row = next;
      rowI = rowI.concat(remI[0]);
      rem.shift();
      remI.shift();
    } else {
      layoutRow();
    }
  }
  if (row.length) layoutRow();
}

export function layoutTreemap(model) {
  const roots = model.roots ?? [];
  if (!roots.length) return { width: 6, height: 6, nodes: [], containers: [], edges: [], decor: [] };
  const root = { label: '', value: roots.reduce((s, r) => s + r.value, 0), children: roots };
  const decor = [];
  let colorIdx = 0;

  const place = (node, rect, depth) => {
    if (!node.children.length) {
      const cls = colorIdx++ % 6;
      decor.push({ type: 'rect-fill', x: rect.x, y: rect.y, w: rect.w, h: rect.h, cls, opacity: 0.85 });
      decor.push({ type: 'rect', x: rect.x, y: rect.y, w: rect.w, h: rect.h });
      if (rect.w >= node.label.length * 0.62 + 1 && rect.h >= 1.6) {
        decor.push({ type: 'text', x: rect.x + rect.w / 2, y: rect.y + 0.9, text: node.label, anchor: 'middle', muted: false });
        if (rect.h >= 3) decor.push({ type: 'text', x: rect.x + rect.w / 2, y: rect.y + 2, text: String(node.value), anchor: 'middle' });
      }
      return;
    }
    if (rect.area <= 0) return;
    const scale = (rect.w * rect.h) / node.value;
    const areas = node.children.map((c) => Math.max(0.01, c.value * scale));
    const sub = [];
    squarify(areas, node.children.map((_, i) => i), { x: rect.x, y: rect.y, w: rect.w, h: rect.h }, sub);
    for (const s of sub) place(node.children[s.i], { x: s.x, y: s.y, w: s.w, h: s.h }, depth + 1);
  };

  place(root, { x: MARGIN, y: MARGIN, w: W, h: H }, 0);
  return { width: W + MARGIN * 2, height: H + MARGIN * 2, nodes: [], containers: [], edges: [], decor };
}
