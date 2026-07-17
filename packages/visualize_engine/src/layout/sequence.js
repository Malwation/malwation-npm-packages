// Sequence layout: actor boxes across the top, dashed lifelines, horizontal
// message arrows stepping down. Standard layout-result contract + decor.

import { nodeSize } from './layered.js';

const MARGIN = 2;
const ACTOR_Y = 2;
const ACTOR_GAP = 4;
const MSG_Y0 = 7; // actor y + h + 2
const MSG_STEP = 3;

export function layoutSequence(model) {
  const nodes = [];
  const centers = new Map();
  let cursor = MARGIN;

  for (const a of model.actors) {
    const size = nodeSize({ label: a.label, shape: 'box', icon: a.icon });
    nodes.push({ id: a.id, label: a.label, shape: 'box', title: null, icon: a.icon ?? null, x: cursor, y: ACTOR_Y, ...size });
    centers.set(a.id, cursor + size.w / 2);
    cursor += size.w + ACTOR_GAP;
  }

  const edges = [];
  model.messages.forEach((msg, i) => {
    const y = MSG_Y0 + i * MSG_STEP;
    const ax = centers.get(msg.from);
    const bx = centers.get(msg.to);
    if (ax == null || bx == null) return;
    const points =
      msg.from === msg.to
        ? [
            { x: ax, y },
            { x: ax + 3, y },
            { x: ax + 3, y: y + 2 },
            { x: ax, y: y + 2 },
          ]
        : [
            { x: ax, y },
            { x: bx, y },
          ];
    edges.push({ from: msg.from, to: msg.to, label: msg.label ?? null, arrow: true, points });
  });

  const bottom = MSG_Y0 + Math.max(1, model.messages.length) * MSG_STEP;
  const decor = [];
  for (const n of nodes) {
    decor.push({
      type: 'line',
      dash: true,
      points: [
        { x: centers.get(n.id), y: n.y + n.h },
        { x: centers.get(n.id), y: bottom },
      ],
    });
  }

  let maxX = cursor - ACTOR_GAP + MARGIN;
  for (const e of edges) for (const p of e.points) maxX = Math.max(maxX, p.x + MARGIN);
  return {
    width: Math.ceil(maxX),
    height: bottom + MARGIN,
    nodes,
    containers: [],
    edges,
    decor,
  };
}
