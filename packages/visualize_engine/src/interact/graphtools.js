// Interactive graph tools (opt-in via `graph … interactive`):
//   • drag nodes — incident edges re-route live
//   • hover-focus — dim everything except the hovered node + its neighbors
//   • collapsible containers — click the ▸/▾ toggle to fold descendants
// All operate on an already-rendered diagram; nothing here changes layout math.

import { routeElbow, nodeSize } from '../layout/layered.js';
import { CW, CH, renderEdge } from '../render/diagram.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function attachGraphTools(svg, nodeIndex, layout) {
  if (!layout || !layout.interactive) return { destroy() {} };
  const viewport = svg.querySelector('.viz-viewport');
  const doc = svg.ownerDocument;
  if (!viewport) return { destroy() {} };
  const iso = layout.projection === 'iso';

  // node state: rect in cells + drag offset in cells
  const nodes = new Map();
  for (const n of layout.nodes) {
    const g = viewport.querySelector(`.viz-node[data-id="${n.id}"]`);
    if (g) nodes.set(n.id, { g, rect: { x: n.x, y: n.y, w: n.w, h: n.h }, ox: 0, oy: 0 });
  }

  // edge state: mutable copies bound to their rendered <g>
  const edgeGs = [...viewport.querySelectorAll('.viz-edge-g')];
  const edges = layout.edges.map((e, i) => ({ ...e, g: edgeGs[i] })).filter((e) => e.g);
  const incident = new Map();
  const neighbors = new Map();
  const link = (map, k, v) => {
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(v);
  };
  for (const e of edges) {
    link(incident, e.from, e);
    link(incident, e.to, e);
    link(neighbors, e.from, e.to);
    link(neighbors, e.to, e.from);
  }

  const cleanups = [];

  // --- drag (disabled in iso) ---
  const curRect = (id) => {
    const s = nodes.get(id);
    return { x: s.rect.x + s.ox, y: s.rect.y + s.oy, w: s.rect.w, h: s.rect.h };
  };
  const reroute = (id) => {
    for (const e of incident.get(id) ?? []) {
      if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
      const s = curRect(e.from);
      const t = curRect(e.to);
      const dx = t.x + t.w / 2 - (s.x + s.w / 2);
      const dy = t.y + t.h / 2 - (s.y + s.h / 2);
      const dir = Math.abs(dy) >= Math.abs(dx) ? 'TD' : 'LR';
      const points = routeElbow(s, t, dir);
      const fresh = renderEdge(doc, { ...e, points });
      e.g.replaceWith(fresh);
      e.g = fresh;
    }
  };

  if (!iso) {
    let drag = null;
    const unit = () => {
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      return r.width ? vb.width / r.width : 1;
    };
    const onDown = (ev) => {
      const g = ev.target.closest?.('.viz-node');
      if (!g || g.classList.contains('viz-container')) return;
      const id = g.getAttribute('data-id');
      if (!nodes.has(id)) return;
      ev.stopPropagation(); // suppress viewport pan
      drag = { id, x: ev.clientX, y: ev.clientY, moved: false };
      svg.setPointerCapture?.(ev.pointerId);
    };
    const onMove = (ev) => {
      if (!drag) return;
      const k = unit();
      const s = nodes.get(drag.id);
      s.ox += ((ev.clientX - drag.x) * k) / CW;
      s.oy += ((ev.clientY - drag.y) * k) / CH;
      drag.x = ev.clientX;
      drag.y = ev.clientY;
      drag.moved = true;
      s.g.setAttribute('transform', `translate(${s.ox * CW} ${s.oy * CH})`);
      reroute(drag.id);
    };
    const onUp = (ev) => {
      if (drag) svg.releasePointerCapture?.(ev.pointerId);
      drag = null;
    };
    svg.addEventListener('pointerdown', onDown, true);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    cleanups.push(() => {
      svg.removeEventListener('pointerdown', onDown, true);
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerup', onUp);
      svg.removeEventListener('pointercancel', onUp);
    });
  }

  // --- hover-focus ---
  const allDimmable = () => [
    ...viewport.querySelectorAll('.viz-node'),
    ...viewport.querySelectorAll('.viz-edge-g'),
  ];
  const onOver = (ev) => {
    const g = ev.target.closest?.('.viz-node');
    if (!g || g.classList.contains('viz-container')) return;
    const id = g.getAttribute('data-id');
    const keep = new Set([id, ...(neighbors.get(id) ?? [])]);
    for (const el of allDimmable()) {
      if (el.classList.contains('viz-node')) {
        if (el.classList.contains('viz-container')) continue; // never dim structure
        el.classList.toggle('viz-dim', !keep.has(el.getAttribute('data-id')));
      } else {
        const i = edgeGs.indexOf(el);
        const e = edges.find((x) => x.g === el) ?? layout.edges[i];
        const touches = e && (e.from === id || e.to === id);
        el.classList.toggle('viz-dim', !touches);
      }
    }
  };
  const onOut = (ev) => {
    if (viewport.contains(ev.relatedTarget)) return;
    for (const el of allDimmable()) el.classList.remove('viz-dim');
  };
  viewport.addEventListener('mouseover', onOver);
  viewport.addEventListener('mouseout', onOut);
  cleanups.push(() => {
    viewport.removeEventListener('mouseover', onOver);
    viewport.removeEventListener('mouseout', onOut);
  });

  // --- collapsible containers ---
  for (const c of layout.containers) {
    const descendants = layout.nodes.filter((n) => n.id.startsWith(`${c.id}.`)).map((n) => n.id);
    const subContainers = layout.containers.filter((k) => k.id.startsWith(`${c.id}.`)).map((k) => k.id);
    if (!descendants.length) continue;
    const g = viewport.querySelector(`.viz-container[data-id="${c.id}"]`);
    if (!g) continue;
    const toggle = doc.createElementNS(SVG_NS, 'text');
    toggle.setAttribute('class', 'viz-label-muted viz-collapse-toggle');
    toggle.setAttribute('x', (c.x + 0.5) * CW);
    toggle.setAttribute('y', (c.y + 1) * CH);
    toggle.setAttribute('font-size', 13);
    toggle.setAttribute('dominant-baseline', 'central');
    toggle.style.cursor = 'pointer';
    toggle.textContent = '▾';
    let collapsed = false;
    const onClick = (ev) => {
      ev.stopPropagation();
      collapsed = !collapsed;
      toggle.textContent = collapsed ? '▸' : '▾';
      const hideIds = new Set([...descendants, ...subContainers]);
      for (const id of hideIds) {
        const ng = viewport.querySelector(`.viz-node[data-id="${id}"]`);
        if (ng) ng.classList.toggle('viz-collapsed-hidden', collapsed);
      }
      for (const e of layout.edges) {
        if (hideIds.has(e.from) || hideIds.has(e.to)) {
          const idx = layout.edges.indexOf(e);
          edgeGs[idx]?.classList.toggle('viz-collapsed-hidden', collapsed);
        }
      }
    };
    toggle.addEventListener('click', onClick);
    g.appendChild(toggle);
    cleanups.push(() => toggle.removeEventListener('click', onClick));
  }

  return {
    destroy() {
      for (const fn of cleanups) fn();
    },
  };
}

// re-exported so panel can size things if needed later
export { nodeSize };
