// Layered digraph layout in character-cell units (integers).
// Containers are laid out recursively and treated as big nodes by their
// parent scope; edges route between the actual (possibly nested) node rects
// as orthogonal elbows.

const MARGIN = 2;
const PAD = 2; // container inner padding
const GAP = {
  TD: { rank: 5, cross: 4 },
  LR: { rank: 8, cross: 2 },
};

// widths round up to even so integer centers sit on cell boundaries
const even = (w) => w + (w & 1);

export function nodeSize(node) {
  const len = (node.label ?? '').length + (node.icon ? 4 : 0);
  switch (node.shape) {
    case 'stadium':
      return { w: even(len + 6), h: 3 };
    case 'diamond':
      return { w: even(len + 8), h: 5 };
    default:
      return { w: even(len + 4), h: 3 };
  }
}

// Orthogonal elbow between two rects. dir 'TD' leaves bottom→top, 'LR' right→left.
export function routeElbow(s, t, dir) {
  if (dir === 'LR') {
    const sy = s.y + (s.h >> 1);
    const ty = t.y + (t.h >> 1);
    if (t.x >= s.x + s.w) {
      const sx = s.x + s.w;
      const tx = t.x;
      if (sy === ty) return [{ x: sx, y: sy }, { x: tx, y: ty }];
      const mx = sx + ((tx - sx) >> 1);
      return [{ x: sx, y: sy }, { x: mx, y: sy }, { x: mx, y: ty }, { x: tx, y: ty }];
    }
    const sx = s.x;
    const tx = t.x + t.w;
    if (sy === ty && tx <= sx) return [{ x: sx, y: sy }, { x: tx, y: ty }];
    const mx = tx + ((sx - tx) >> 1);
    return [{ x: sx, y: sy }, { x: mx, y: sy }, { x: mx, y: ty }, { x: tx, y: ty }];
  }
  const sx = s.x + (s.w >> 1);
  const tx = t.x + (t.w >> 1);
  if (t.y >= s.y + s.h) {
    const sy = s.y + s.h;
    const ty = t.y;
    if (sx === tx) return [{ x: sx, y: sy }, { x: tx, y: ty }];
    const my = sy + ((ty - sy) >> 1);
    return [{ x: sx, y: sy }, { x: sx, y: my }, { x: tx, y: my }, { x: tx, y: ty }];
  }
  const sy = s.y;
  const ty = t.y + t.h;
  if (sx === tx && ty <= sy) return [{ x: sx, y: sy }, { x: tx, y: ty }];
  const my = ty + ((sy - ty) >> 1);
  return [{ x: sx, y: sy }, { x: sx, y: my }, { x: tx, y: my }, { x: tx, y: ty }];
}

// Port + lane aware orthogonal routing between placed rects.
// Ports: edges sharing a node side spread across it (ordered by counterpart
// position) instead of stacking on the center. Lanes: elbows departing from
// the same coordinate take distinct mid lines so horizontal runs never overlap.
function routeEdges(modelEdges, rectOf, dir) {
  const routed = [];
  for (const e of modelEdges) {
    if (e.from === e.to) continue; // self-loops unsupported in graph layout
    const s = rectOf.get(e.from);
    const t = rectOf.get(e.to);
    if (!s || !t) continue;
    const r = { e, s, t };
    if (dir === 'TD') {
      r.forward = t.y >= s.y + s.h;
      r.sy = r.forward ? s.y + s.h : s.y;
      r.ty = r.forward ? t.y : t.y + t.h;
      r.sx = s.x + s.w / 2;
      r.tx = t.x + t.w / 2;
    } else {
      r.forward = t.x >= s.x + s.w;
      r.sx = r.forward ? s.x + s.w : s.x;
      r.tx = r.forward ? t.x : t.x + t.w;
      r.sy = s.y + s.h / 2;
      r.ty = t.y + t.h / 2;
    }
    routed.push(r);
  }

  // --- ports: group by (node, side), spread across the side ---
  const sideGroups = new Map();
  const addToSide = (key, entry) => {
    if (!sideGroups.has(key)) sideGroups.set(key, []);
    sideGroups.get(key).push(entry);
  };
  for (const r of routed) {
    const srcSide = dir === 'TD' ? (r.forward ? 'b' : 't') : r.forward ? 'r' : 'l';
    const dstSide = dir === 'TD' ? (r.forward ? 't' : 'b') : r.forward ? 'l' : 'r';
    addToSide(`${r.e.from}|${srcSide}`, { r, role: 'src' });
    addToSide(`${r.e.to}|${dstSide}`, { r, role: 'dst' });
  }
  for (const list of sideGroups.values()) {
    if (list.length < 2) continue; // single edge keeps the exact center
    const counterpart = (it) =>
      dir === 'TD'
        ? it.role === 'src'
          ? it.r.tx
          : it.r.sx
        : it.role === 'src'
          ? it.r.ty
          : it.r.sy;
    list.sort((p, q) => counterpart(p) - counterpart(q));
    list.forEach((it, i) => {
      const rect = it.role === 'src' ? it.r.s : it.r.t;
      const frac = (i + 1) / (list.length + 1);
      if (dir === 'TD') it.r[it.role === 'src' ? 'sx' : 'tx'] = rect.x + rect.w * frac;
      else it.r[it.role === 'src' ? 'sy' : 'ty'] = rect.y + rect.h * frac;
    });
  }

  // --- lanes: group elbows by departure line ---
  const laneGroups = new Map();
  for (const r of routed) {
    r.straight = dir === 'TD' ? Math.abs(r.sx - r.tx) < 0.01 : Math.abs(r.sy - r.ty) < 0.01;
    if (r.straight) continue;
    const key = dir === 'TD' ? `${r.sy}|${r.forward ? 'f' : 'b'}` : `${r.sx}|${r.forward ? 'f' : 'b'}`;
    if (!laneGroups.has(key)) laneGroups.set(key, []);
    laneGroups.get(key).push(r);
  }
  const MAX_LANES = 4;
  for (const list of laneGroups.values()) {
    list.sort((a, b) => (dir === 'TD' ? a.tx - b.tx : a.ty - b.ty));
    list.forEach((r, i) => {
      const lane = 1 + (i % MAX_LANES);
      if (dir === 'TD') {
        r.mid = r.forward
          ? Math.min(r.sy + lane, r.ty - 1)
          : Math.max(r.sy - lane, r.ty + 1);
      } else {
        r.mid = r.forward
          ? Math.min(r.sx + lane * 2, r.tx - 1)
          : Math.max(r.sx - lane * 2, r.tx + 1);
      }
    });
  }

  return routed.map((r) => {
    let points;
    if (r.straight) {
      points =
        dir === 'TD'
          ? [{ x: r.sx, y: r.sy }, { x: r.sx, y: r.ty }]
          : [{ x: r.sx, y: r.sy }, { x: r.tx, y: r.sy }];
    } else if (dir === 'TD') {
      const my = r.mid ?? r.sy + ((r.ty - r.sy) >> 1);
      points = [
        { x: r.sx, y: r.sy },
        { x: r.sx, y: my },
        { x: r.tx, y: my },
        { x: r.tx, y: r.ty },
      ];
    } else {
      const mx = r.mid ?? r.sx + ((r.tx - r.sx) >> 1);
      points = [
        { x: r.sx, y: r.sy },
        { x: mx, y: r.sy },
        { x: mx, y: r.ty },
        { x: r.tx, y: r.ty },
      ];
    }
    const kind = r.e.kind ?? 'arrow';
    return {
      from: r.e.from,
      to: r.e.to,
      label: r.e.label ?? null,
      arrow: kind !== 'line',
      both: kind === 'both',
      variant: r.e.variant ?? null,
      points,
    };
  });
}

export function layoutGraph(model) {
  // BT/RL are computed in their base orientation, then mirrored after routing.
  const requested = model.direction ?? 'TD';
  const dir = requested === 'LR' || requested === 'RL' ? 'LR' : 'TD';
  const flipY = requested === 'BT';
  const flipX = requested === 'RL';
  const gap = GAP[dir];
  const byId = new Map(model.nodes.map((n) => [n.id, n]));

  const childrenOf = new Map();
  for (const n of model.nodes) {
    const p = n.parent != null && byId.has(n.parent) ? n.parent : null;
    if (!childrenOf.has(p)) childrenOf.set(p, []);
    childrenOf.get(p).push(n);
  }

  // Lay out the direct children of `parentId`; returns relative placements.
  function layoutScope(parentId) {
    const kids = childrenOf.get(parentId) ?? [];
    const items = kids.map((n) => {
      if (n.shape === 'container') {
        const inner = layoutScope(n.id);
        const labelRows = n.label ? 2 : 0;
        return {
          node: n,
          inner,
          labelRows,
          w: Math.max(inner.w + PAD * 2, (n.label?.length ?? 0) + 6),
          h: inner.h + PAD * 2 + labelRows,
        };
      }
      return { node: n, ...nodeSize(n) };
    });
    if (!items.length) return { w: 0, h: 0, placed: [] };

    // --- rank assignment (longest-path relaxation, cycle-bounded) ---
    const idxOf = new Map(items.map((it, i) => [it.node.id, i]));
    const localAncestor = (id) => {
      let cur = id;
      while (cur != null && !idxOf.has(cur)) cur = byId.get(cur)?.parent ?? null;
      return cur;
    };
    const localEdges = [];
    for (const e of model.edges) {
      const a = localAncestor(e.from);
      const b = localAncestor(e.to);
      if (a != null && b != null && a !== b) localEdges.push([idxOf.get(a), idxOf.get(b)]);
    }
    let ranks = new Array(items.length).fill(0);
    for (let pass = 0; pass < items.length; pass++) {
      let changed = false;
      for (const [a, b] of localEdges) {
        if (ranks[b] < ranks[a] + 1) {
          ranks[b] = ranks[a] + 1;
          changed = true;
        }
      }
      if (!changed) break;
    }
    // compact rank values to 0..k
    const uniq = [...new Set(ranks)].sort((a, b) => a - b);
    const compact = new Map(uniq.map((r, i) => [r, i]));
    ranks = ranks.map((r) => compact.get(r));

    // --- in-rank ordering (barycenter sweeps) ---
    const groups = uniq.map(() => []);
    items.forEach((_, i) => groups[ranks[i]].push(i));
    const preds = items.map(() => []);
    const succs = items.map(() => []);
    for (const [a, b] of localEdges) {
      succs[a].push(b);
      preds[b].push(a);
    }
    const posIn = new Array(items.length).fill(0);
    const refreshPos = () => groups.forEach((g) => g.forEach((idx, p) => (posIn[idx] = p)));
    refreshPos();
    for (let sweep = 0; sweep < 4; sweep++) {
      const usePreds = sweep % 2 === 0;
      const gis = groups.map((_, i) => i);
      if (!usePreds) gis.reverse();
      for (const gi of gis) {
        const g = groups[gi];
        const bary = g.map((idx) => {
          const nb = usePreds ? preds[idx] : succs[idx];
          if (!nb.length) return posIn[idx];
          return nb.reduce((sum, n) => sum + posIn[n], 0) / nb.length;
        });
        groups[gi] = g
          .map((idx, k) => k)
          .sort((x, y) => bary[x] - bary[y] || x - y)
          .map((k) => g[k]);
        refreshPos();
      }
    }

    // --- coordinates ---
    const main = dir === 'TD' ? 'h' : 'w';
    const cross = dir === 'TD' ? 'w' : 'h';
    const rankSizes = groups.map((g) => Math.max(...g.map((i) => items[i][main])));
    const rankSpans = groups.map((g) =>
      g.reduce((sum, i) => sum + items[i][cross], 0) + gap.cross * (g.length - 1),
    );
    const maxSpan = Math.max(...rankSpans);
    let mainCursor = 0;
    groups.forEach((g, gi) => {
      let crossCursor = (maxSpan - rankSpans[gi]) >> 1;
      for (const i of g) {
        if (dir === 'TD') {
          items[i].x = crossCursor;
          items[i].y = mainCursor;
        } else {
          items[i].x = mainCursor;
          items[i].y = crossCursor;
        }
        crossCursor += items[i][cross] + gap.cross;
      }
      mainCursor += rankSizes[gi] + gap.rank;
    });
    const w = dir === 'TD' ? maxSpan : mainCursor - gap.rank;
    const h = dir === 'TD' ? mainCursor - gap.rank : maxSpan;
    return { w, h, placed: items };
  }

  // --- absolutize + emit ---
  const top = layoutScope(null);
  const nodes = [];
  const containers = [];
  const rectOf = new Map();
  (function emit(placed, ox, oy) {
    for (const it of placed) {
      const abs = { x: it.x + ox, y: it.y + oy, w: it.w, h: it.h };
      rectOf.set(it.node.id, abs);
      if (it.node.shape === 'container') {
        containers.push({ id: it.node.id, label: it.node.label ?? '', ...abs });
        emit(it.inner.placed, abs.x + PAD, abs.y + PAD + it.labelRows);
      } else {
        nodes.push({
          id: it.node.id,
          label: it.node.label ?? '',
          shape: it.node.shape,
          title: it.node.title ?? null,
          icon: it.node.icon ?? null,
          ...abs,
        });
      }
    }
  })(top.placed, MARGIN, MARGIN);

  const edges = routeEdges(model.edges, rectOf, dir);

  let maxX = 0;
  let maxY = 0;
  for (const r of rectOf.values()) {
    maxX = Math.max(maxX, r.x + r.w);
    maxY = Math.max(maxY, r.y + r.h);
  }
  for (const e of edges) {
    for (const p of e.points) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  const width = maxX + MARGIN;
  const height = maxY + MARGIN;

  if (flipY || flipX) {
    for (const r of [...nodes, ...containers]) {
      if (flipY) r.y = height - r.y - r.h;
      if (flipX) r.x = width - r.x - r.w;
    }
    for (const e of edges) {
      for (const p of e.points) {
        if (flipY) p.y = height - p.y;
        if (flipX) p.x = width - p.x;
      }
    }
  }

  return {
    width,
    height,
    nodes,
    containers,
    edges,
    projection: model.projection ?? null,
    interactive: model.interactive ?? false,
    animate: model.animate ?? null,
    three: model.three ?? false,
  };
}
