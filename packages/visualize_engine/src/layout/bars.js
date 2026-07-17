// Bar chart: muted label column, 30-cell outlined tracks, accent fills.
// Everything is decor (no clickable nodes). Global max defaults to 100 and
// grows to the largest value; explicit `/ max` overrides per row.

const MARGIN = 2;
const TRACK = 30;
const STEP = 2; // 1-row bar + 1-row gap

export function layoutBars(model) {
  const rows = model.rows ?? [];
  const decor = [];
  if (!rows.length) return { width: MARGIN * 2, height: MARGIN * 2, nodes: [], containers: [], edges: [], decor };

  const labelW = Math.max(...rows.map((r) => r.label.length));
  const globalMax = Math.max(100, ...rows.map((r) => (r.max == null ? r.value : 0)));
  const x0 = MARGIN + labelW + 1;
  let valueW = 0;

  rows.forEach((r, i) => {
    const y = MARGIN + i * STEP;
    const cy = y + 0.5;
    const max = r.max ?? globalMax;
    const frac = max > 0 ? Math.min(1, Math.max(0, r.value / max)) : 0;
    decor.push({ type: 'text', x: x0 - 1, y: cy, text: r.label, anchor: 'end' });
    decor.push({ type: 'rect', x: x0, y, w: TRACK, h: 1 });
    if (frac > 0) decor.push({ type: 'rect-fill', x: x0, y, w: Math.round(frac * TRACK * 2) / 2, h: 1 });
    const valueText = String(r.value);
    decor.push({ type: 'text', x: x0 + TRACK + 1, y: cy, text: valueText, anchor: 'start' });
    valueW = Math.max(valueW, valueText.length);
  });

  return {
    width: x0 + TRACK + 1 + valueW + MARGIN,
    height: MARGIN + rows.length * STEP + 1,
    nodes: [],
    containers: [],
    edges: [],
    decor,
  };
}
