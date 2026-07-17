// Gantt: muted label column, outlined track per task, accent fill from
// start→start+dur (1 unit = 2 cells), muted unit ticks every 5 units.

const MARGIN = 2;
const UNIT = 2; // cells per time unit
const STEP = 2; // 1-row bar + 1-row gap

export function layoutGantt(model) {
  const tasks = model.tasks ?? [];
  const decor = [];
  if (!tasks.length) return { width: MARGIN * 2, height: MARGIN * 2, nodes: [], containers: [], edges: [], decor };

  const labelW = Math.max(...tasks.map((t) => t.label.length));
  const span = Math.max(...tasks.map((t) => t.start + t.dur), 1);
  const x0 = MARGIN + labelW + 1;
  const y0 = MARGIN + 1; // leave a row for the tick labels

  for (let u = 0; u <= span; u += 5) {
    decor.push({ type: 'text', x: x0 + u * UNIT, y: y0 - 0.7, text: String(u), anchor: 'middle' });
  }

  tasks.forEach((t, i) => {
    const y = y0 + i * STEP;
    decor.push({ type: 'text', x: x0 - 1, y: y + 0.5, text: t.label, anchor: 'end' });
    decor.push({ type: 'rect', x: x0, y, w: span * UNIT, h: 1 });
    const w = Math.max(0, Math.min(t.dur, span - t.start)) * UNIT;
    if (w > 0) decor.push({ type: 'rect-fill', x: x0 + t.start * UNIT, y, w, h: 1 });
  });

  return {
    width: x0 + span * UNIT + MARGIN,
    height: y0 + tasks.length * STEP + 1,
    nodes: [],
    containers: [],
    edges: [],
    decor,
  };
}
