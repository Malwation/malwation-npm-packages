// Vertical timeline: muted stamp column, dashed spine, tick per event into a
// clickable event box. Standard layout-result contract + decor.

import { nodeSize } from './layered.js';

const MARGIN = 2;
const STEP = 4;

export function layoutTimeline(model) {
  const events = model.events ?? [];
  const nodes = [];
  const decor = [];
  if (!events.length) return { width: MARGIN * 2, height: MARGIN * 2, nodes, containers: [], edges: [], decor };

  const stampW = Math.max(...events.map((e) => e.stamp.length), 0);
  const spineX = MARGIN + stampW + 1;
  const boxX = spineX + 2;

  events.forEach((e, i) => {
    const y = MARGIN + i * STEP;
    const cy = y + 1.5;
    const size = nodeSize({ label: e.text || e.stamp, shape: 'box' });
    nodes.push({
      id: `ev${i}`,
      label: e.text || e.stamp,
      shape: 'box',
      title: e.stamp || null,
      x: boxX,
      y,
      ...size,
    });
    decor.push({
      type: 'line',
      points: [
        { x: spineX, y: cy },
        { x: boxX, y: cy },
      ],
    });
    if (e.stamp) {
      decor.push({ type: 'text', x: spineX - 1, y: cy, text: e.stamp, anchor: 'end' });
    }
  });

  const lastCy = MARGIN + (events.length - 1) * STEP + 1.5;
  decor.unshift({
    type: 'line',
    dash: true,
    points: [
      { x: spineX, y: MARGIN - 1 },
      { x: spineX, y: lastCy + 2 },
    ],
  });

  const width = Math.max(...nodes.map((n) => n.x + n.w)) + MARGIN;
  const height = MARGIN + (events.length - 1) * STEP + 3 + MARGIN;
  return { width, height, nodes, containers: [], edges: [], decor };
}
