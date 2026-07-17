// Render a graph/tree layout to copy-pasteable monospace ASCII art. The layout
// is already on an integer character grid, so nodes map to cells directly.
// Returns null for kinds that can't be ASCII-ified (3d, iso, decor-only).

export function renderAscii(layout) {
  if (!layout || layout.three || layout.projection) return null;
  const hasNodes = (layout.nodes?.length || 0) + (layout.containers?.length || 0) > 0;
  if (!hasNodes) return null;

  const W = Math.max(1, Math.round(layout.width));
  const H = Math.max(1, Math.round(layout.height));
  const grid = Array.from({ length: H }, () => new Array(W).fill(' '));
  const set = (x, y, ch) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = ch;
  };
  const hline = (x0, x1, y, ch) => {
    for (let x = Math.round(Math.min(x0, x1)); x <= Math.round(Math.max(x0, x1)); x++) set(x, y, ch);
  };
  const vline = (y0, y1, x, ch) => {
    for (let y = Math.round(Math.min(y0, y1)); y <= Math.round(Math.max(y0, y1)); y++) set(x, y, ch);
  };

  const box = (n, dashed) => {
    const x = n.x;
    const y = n.y;
    const x1 = n.x + n.w - 1;
    const y1 = n.y + n.h - 1;
    const hc = dashed ? '.' : '-';
    hline(x, x1, y, hc);
    hline(x, x1, y1, hc);
    vline(y, y1, x, '|');
    vline(y, y1, x1, '|');
    set(x, y, '+');
    set(x1, y, '+');
    set(x, y1, '+');
    set(x1, y1, '+');
    const lbl = (n.label || '').slice(0, Math.max(0, n.w - 2));
    const lx = x + Math.floor((n.w - lbl.length) / 2);
    const ly = y + Math.floor(n.h / 2);
    for (let i = 0; i < lbl.length; i++) set(lx + i, ly, lbl[i]);
  };

  for (const c of layout.containers) box(c, true);
  for (const n of layout.nodes) {
    box(n, false);
    if (n.shape === 'stadium') {
      const my = n.y + Math.floor(n.h / 2);
      set(n.x, my, '(');
      set(n.x + n.w - 1, my, ')');
    }
  }

  for (const e of layout.edges) {
    const pts = e.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (Math.round(a.x) === Math.round(b.x)) vline(a.y, b.y, Math.round(a.x), '|');
      else hline(a.x, b.x, Math.round(a.y), '-');
      if (i > 0) set(a.x, a.y, '+');
    }
    if (e.arrow) {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2] ?? last;
      const dx = Math.sign(last.x - prev.x);
      const dy = Math.sign(last.y - prev.y);
      set(last.x, last.y, dy > 0 ? 'v' : dy < 0 ? '^' : dx > 0 ? '>' : '<');
    }
    if (e.both) {
      const first = pts[0];
      const next = pts[1] ?? first;
      const dx = Math.sign(first.x - next.x);
      const dy = Math.sign(first.y - next.y);
      set(first.x, first.y, dy > 0 ? 'v' : dy < 0 ? '^' : dx > 0 ? '>' : '<');
    }
  }

  return grid.map((row) => row.join('').replace(/\s+$/, '')).join('\n');
}
