// Mermaid flowchart → VizEngine graph model (parseGraph-compatible), so it
// renders in any theme. Supports node shapes, edge types, labels, chains.
// Tolerant: unknown lines skipped, never throws.

const CONN = /(-\.->|-->|--x|--o|---|-\.-|==>|===)/;

function parseNode(token) {
  const t = token.trim();
  const m = /^([A-Za-z0-9_.-]+)\s*([\s\S]*)$/.exec(t);
  if (!m) return { id: null };
  const id = m[1];
  const rest = m[2].trim();
  const shapes = [
    [/^\(\(([\s\S]*)\)\)$/, 'stadium'],
    [/^\(\[([\s\S]*)\]\)$/, 'stadium'],
    [/^\[\[([\s\S]*)\]\]$/, 'container'],
    [/^\{([\s\S]*)\}$/, 'diamond'],
    [/^\[([\s\S]*)\]$/, 'box'],
    [/^\(([\s\S]*)\)$/, 'stadium'],
    [/^>([\s\S]*)\]$/, 'box'],
  ];
  for (const [re, shape] of shapes) {
    const mm = re.exec(rest);
    if (mm) return { id, shape, label: mm[1].replace(/^["']|["']$/g, ''), hasShape: true };
  }
  return { id, shape: 'box', label: id, hasShape: false };
}

export function fromMermaid(text) {
  const model = { direction: 'TD', projection: null, interactive: false, animate: null, three: false, nodes: [], edges: [] };
  const map = new Map();
  const ensure = (n) => {
    const existing = map.get(n.id);
    if (!existing) map.set(n.id, { id: n.id, shape: n.shape, label: n.label, parent: null, title: null, icon: null });
    else if (n.hasShape) {
      existing.shape = n.shape;
      existing.label = n.label;
    }
  };

  for (let raw of String(text ?? '').split('\n')) {
    let line = raw.trim();
    if (!line || line.startsWith('%%')) continue;
    const dir = /^(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/i.exec(line);
    if (dir) {
      let dd = dir[1].toUpperCase();
      if (dd === 'TB') dd = 'TD';
      model.direction = dd;
      line = line.slice(dir[0].length).trim();
      if (!line) continue;
    } else if (/^(?:flowchart|graph)\b/i.test(line)) {
      continue;
    }
    for (const stmt of line.split(';')) {
      const s = stmt.trim();
      if (!s) continue;
      const parts = s.split(CONN);
      if (parts.length === 1) {
        const n = parseNode(parts[0]);
        if (n.id) ensure(n);
        continue;
      }
      let prevId = null;
      let kind = 'arrow';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          kind = ['---', '-.-', '==='].includes(parts[i]) ? 'line' : 'arrow';
          continue;
        }
        let tok = parts[i].trim();
        let label = null;
        const lm = /^\|([\s\S]*?)\|\s*([\s\S]*)$/.exec(tok);
        if (lm) {
          label = lm[1].trim();
          tok = lm[2].trim();
        }
        const n = parseNode(tok);
        if (!n.id) continue;
        ensure(n);
        if (prevId) model.edges.push({ from: prevId, to: n.id, label, kind, variant: null });
        prevId = n.id;
      }
    }
  }
  model.nodes = [...map.values()];
  return model;
}
