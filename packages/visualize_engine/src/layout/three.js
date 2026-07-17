// Real 3D graph layout: nodes get true (x,y,z) coordinates — ranked onto
// stacked Y-layers, spread on a circle in the XZ plane per layer. The renderer
// rotates + perspective-projects these each frame.

export function layoutGraph3d(model) {
  const nodes = model.nodes.filter((n) => n.shape !== 'container');
  if (!nodes.length) return null;
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = model.edges.filter((e) => idx.has(e.from) && idx.has(e.to));

  // longest-path ranks (cycle-bounded)
  const rank = nodes.map(() => 0);
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const e of edges) {
      const a = idx.get(e.from);
      const b = idx.get(e.to);
      if (rank[b] < rank[a] + 1) {
        rank[b] = rank[a] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const maxRank = Math.max(0, ...rank);

  const byRank = new Map();
  nodes.forEach((_, i) => {
    if (!byRank.has(rank[i])) byRank.set(rank[i], []);
    byRank.get(rank[i]).push(i);
  });

  const LAYER = 82;
  const pos = nodes.map(() => ({ x: 0, y: 0, z: 0 }));
  for (const [r, list] of byRank) {
    const k = list.length;
    const R = k === 1 ? 0 : Math.max(70, k * 24);
    list.forEach((ni, j) => {
      const a = (2 * Math.PI * j) / k + r * 0.5; // twist layers for depth interest
      pos[ni] = { x: R * Math.cos(a), y: (maxRank / 2 - r) * LAYER, z: R * Math.sin(a) };
    });
  }

  return {
    three: true,
    animate: model.animate ?? 'default',
    nodes: nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      icon: n.icon ?? null,
      shape: n.shape,
      title: n.title ?? null,
      x3: pos[i].x,
      y3: pos[i].y,
      z3: pos[i].z,
    })),
    edges,
  };
}
