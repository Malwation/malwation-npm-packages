// Editor model <-> VizEngine graph DSL.
// model = {direction, nodes:[{id,label,shape,x,y,icon}], edges:[{from,to,label,kind,variant}]}

import { parseGraph } from '../parse/graph.js';

const OPEN = { box: '[ ', stadium: '( ', diamond: '{ ', container: '[[ ' };
const CLOSE = { box: ' ]', stadium: ' )', diamond: ' }', container: ' ]]' };
const CONN = { arrow: '->', both: '<->', line: '--' };

export function modelToSource(model, opts = {}) {
  const dir = model.direction || 'TD';
  const lines = [`graph ${dir}${opts.flags ? ' ' + opts.flags : ''}`];
  for (const n of model.nodes) {
    const shape = OPEN[n.shape] ? n.shape : 'box';
    const label = (n.icon ? `@${n.icon} ` : '') + (n.label ?? n.id);
    lines.push(`${n.id}: ${OPEN[shape]}${label}${CLOSE[shape]}`);
  }
  for (const e of model.edges) {
    const conn = CONN[e.kind] || '->';
    let line = `${e.from} ${conn} ${e.to}`;
    if (e.label) line += ` : "${e.label}"`;
    if (e.variant) line += ` [${e.variant}]`;
    lines.push(line);
  }
  return lines.join('\n');
}

// Parse DSL back to an editable model, assigning grid positions by rank.
export function sourceToModel(text) {
  const g = parseGraph(text);
  const idx = new Map(g.nodes.map((n, i) => [n.id, i]));
  const rank = g.nodes.map(() => 0);
  for (let p = 0; p < g.nodes.length; p++) {
    let changed = false;
    for (const e of g.edges) {
      const a = idx.get(e.from);
      const b = idx.get(e.to);
      if (a != null && b != null && rank[b] < rank[a] + 1) {
        rank[b] = rank[a] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const perRank = {};
  const nodes = g.nodes.map((n, i) => {
    const rk = rank[i];
    const pos = (perRank[rk] = (perRank[rk] || 0) + 1) - 1;
    return {
      id: n.id,
      label: n.label,
      shape: OPEN[n.shape] ? n.shape : 'box',
      icon: n.icon ?? null,
      x: 90 + pos * 200,
      y: 70 + rk * 130,
    };
  });
  return {
    direction: g.direction || 'TD',
    nodes,
    edges: g.edges.map((e) => ({
      from: e.from,
      to: e.to,
      label: e.label ?? null,
      kind: e.kind || 'arrow',
      variant: e.variant ?? null,
    })),
  };
}
