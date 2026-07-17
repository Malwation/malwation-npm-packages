// Real 3D renderer: rotate every node's (x,y,z) around the Y axis each frame,
// perspective-project to screen, size/fade by depth, painter-sort front-to-back.
// A requestAnimationFrame loop drives ~7s/revolution; hover pauses; destroy
// cancels the loop (registered by the panel).

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (d, name, attrs = {}) => {
  const n = d.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const W = 540;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const FOCAL = 780; // higher focal = flatter perspective, bigger readable nodes
const CAM_Z = 300;

export function renderThree(layout, ctx) {
  const d = ctx.document;
  const win = d.defaultView;
  const svg = el(d, 'svg', { class: 'viz-diagram viz-three', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  const viewport = el(d, 'g', { class: 'viz-viewport' });
  svg.appendChild(viewport);

  const edgeEls = layout.edges.map((e) => {
    const line = el(d, 'line', { class: 'viz-edge' + (e.variant ? ` viz-edge-${e.variant}` : '') });
    viewport.appendChild(line);
    return { e, line };
  });

  const nodeEls = layout.nodes.map((n) => {
    const g = el(d, 'g', { class: 'viz-node', 'data-id': n.id });
    const bw = Math.max(60, n.label.length * 9 + 22);
    const bh = 30;
    g.appendChild(el(d, 'rect', { class: 'viz-shape viz-box', x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 4 }));
    const label = el(d, 'text', {
      class: 'viz-label',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 15,
      'paint-order': 'stroke',
      stroke: 'var(--viz-paper)',
      'stroke-width': 3.5,
    });
    label.textContent = n.label;
    g.appendChild(label);
    g.appendChild(el(d, 'rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, fill: 'transparent' }));
    viewport.appendChild(g);
    return { n, g };
  });

  const nodeIndex = new Map(
    layout.nodes.map((n) => [n.id, { id: n.id, label: n.label, shape: n.shape, title: n.title ?? null }]),
  );

  let theta = 0.6;
  let raf = 0;
  let running = true;
  const reduced = win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const pos = new Map();

  const project = (x, y, z) => {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const xr = x * c + z * s;
    const zr = -x * s + z * c;
    const scale = FOCAL / (FOCAL + zr + CAM_Z);
    return { sx: CX + xr * scale, sy: CY - y * scale, scale, depth: zr };
  };

  const draw = () => {
    for (const n of layout.nodes) pos.set(n.id, project(n.x3, n.y3, n.z3));
    for (const { n, g } of nodeEls) {
      const p = pos.get(n.id);
      g.setAttribute('transform', `translate(${p.sx.toFixed(1)} ${p.sy.toFixed(1)}) scale(${p.scale.toFixed(3)})`);
      g.style.opacity = (0.4 + 0.6 * p.scale).toFixed(2);
    }
    for (const { e, line } of edgeEls) {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      line.setAttribute('x1', a.sx.toFixed(1));
      line.setAttribute('y1', a.sy.toFixed(1));
      line.setAttribute('x2', b.sx.toFixed(1));
      line.setAttribute('y2', b.sy.toFixed(1));
      line.style.opacity = (0.18 + 0.4 * Math.min(a.scale, b.scale)).toFixed(2);
    }
    // painter's order: far nodes first so near ones draw on top
    [...nodeEls]
      .sort((p, q) => pos.get(q.n.id).depth - pos.get(p.n.id).depth)
      .forEach(({ g }) => viewport.appendChild(g));
  };

  const frame = () => {
    draw();
    if (running && !reduced && win) {
      theta += (2 * Math.PI) / (7 * 60); // ~7s per revolution
      raf = win.requestAnimationFrame(frame);
    }
  };
  if (win?.requestAnimationFrame) raf = win.requestAnimationFrame(frame);
  else draw();

  const onEnter = () => {
    running = false;
  };
  const onLeave = () => {
    if (!running && !reduced && win) {
      running = true;
      raf = win.requestAnimationFrame(frame);
    }
  };
  svg.addEventListener('mouseenter', onEnter);
  svg.addEventListener('mouseleave', onLeave);

  return {
    svg,
    nodeIndex,
    destroy() {
      running = false;
      if (raf && win?.cancelAnimationFrame) win.cancelAnimationFrame(raf);
      svg.removeEventListener('mouseenter', onEnter);
      svg.removeEventListener('mouseleave', onLeave);
    },
  };
}
