// Sankey DSL → {nodes:[{id,label}], links:[{from,to,value}]}.
//   src -> dst : 30      (weight, default 1)
// Nodes are auto-created from links. Never throws.
const RE_LINK = /^(.+?)\s*->\s*(.+?)(?:\s*:\s*(\d+(?:\.\d+)?))?$/;

export function parseSankey(text) {
  const order = [];
  const seen = new Set();
  const links = [];
  const ensure = (id) => {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = RE_LINK.exec(line);
    if (!m) continue;
    const from = m[1].trim();
    const to = m[2].trim();
    if (!from || !to) continue;
    ensure(from);
    ensure(to);
    links.push({ from, to, value: m[3] != null ? Number(m[3]) : 1 });
  }
  return { nodes: order.map((id) => ({ id, label: id })), links };
}
