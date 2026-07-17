// Graphviz DOT → VizEngine graph model. Supports digraph/graph, edges with
// attrs, node attrs (label, shape), rankdir. Tolerant, never throws.

const SHAPE_MAP = { box: 'box', rect: 'box', rectangle: 'box', square: 'box', diamond: 'diamond', ellipse: 'stadium', oval: 'stadium', circle: 'stadium', stadium: 'stadium' };

function attrs(str) {
  const out = {};
  if (!str) return out;
  const re = /(\w+)\s*=\s*("(?:[^"\\]|\\.)*"|[^,\]\s]+)/g;
  let m;
  while ((m = re.exec(str))) out[m[1].toLowerCase()] = m[2].replace(/^"|"$/g, '').replace(/\\"/g, '"');
  return out;
}

const unquote = (s) => s.trim().replace(/^"|"$/g, '');

export function fromDot(text) {
  const model = { direction: 'TD', projection: null, interactive: false, animate: null, three: false, nodes: [], edges: [] };
  const map = new Map();
  const ensure = (id) => {
    if (!map.has(id)) map.set(id, { id, shape: 'box', label: id, parent: null, title: null, icon: null });
    return map.get(id);
  };

  let body = String(text ?? '');
  const brace = body.indexOf('{');
  if (brace !== -1) body = body.slice(brace + 1);
  body = body.replace(/\}\s*$/, '');

  if (/rankdir\s*=\s*"?LR"?/i.test(body)) model.direction = 'LR';
  else if (/rankdir\s*=\s*"?RL"?/i.test(body)) model.direction = 'RL';
  else if (/rankdir\s*=\s*"?BT"?/i.test(body)) model.direction = 'BT';

  const statements = body.split(/;|\n/).map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    if (/^(rankdir|node|edge|graph|label|bgcolor|size)\b/i.test(stmt) && !/-[->]/.test(stmt)) continue;
    const edge = /^("[^"]+"|[\w.-]+)\s*(->|--)\s*("[^"]+"|[\w.-]+)\s*(?:\[([^\]]*)\])?$/.exec(stmt);
    if (edge) {
      const from = unquote(edge[1]);
      const to = unquote(edge[3]);
      ensure(from);
      ensure(to);
      const a = attrs(edge[4]);
      model.edges.push({ from, to, label: a.label || null, kind: edge[2] === '--' ? 'line' : 'arrow', variant: null });
      continue;
    }
    const node = /^("[^"]+"|[\w.-]+)\s*\[([^\]]*)\]$/.exec(stmt);
    if (node) {
      const n = ensure(unquote(node[1]));
      const a = attrs(node[2]);
      if (a.label) n.label = a.label;
      if (a.shape && SHAPE_MAP[a.shape.toLowerCase()]) n.shape = SHAPE_MAP[a.shape.toLowerCase()];
    }
  }
  model.nodes = [...map.values()];
  return model;
}
