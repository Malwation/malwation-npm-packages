// Geomap layout: equirectangular projection of lat/lon onto a wide canvas,
// with a graticule, simplified continent outlines, pins and connection arcs.

import { CW, CH } from '../units.js';
import { CONTINENTS } from '../parse/worldmap.js';

const MARGIN = 2;
const W = 108; // cells wide (≈ 360°)
const H = 54; // cells tall (≈ 180°), 2:1 equirectangular

const projX = (lon) => MARGIN + ((lon + 180) / 360) * W;
const projY = (lat) => MARGIN + ((90 - lat) / 180) * H;

export function layoutGeomap(model) {
  const nodes = model.nodes ?? [];
  const decor = [];

  // continents (px path)
  for (const ring of CONTINENTS) {
    const d = 'M ' + ring.map(([lon, lat]) => `${(projX(lon) * CW).toFixed(1)} ${(projY(lat) * CH).toFixed(1)}`).join(' L ') + ' Z';
    decor.push({ type: 'landmass', d });
  }
  // graticule
  for (let lon = -180; lon <= 180; lon += 30) {
    decor.push({ type: 'line', muted: true, points: [{ x: projX(lon), y: MARGIN }, { x: projX(lon), y: MARGIN + H }] });
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    decor.push({ type: 'line', muted: true, points: [{ x: MARGIN, y: projY(lat) }, { x: MARGIN + W, y: projY(lat) }] });
  }

  const pos = new Map(nodes.map((n) => [n.id, { x: projX(n.lon), y: projY(n.lat) }]));

  // arcs (behind pins) — arrowheads, labels and line styles
  for (const e of model.edges ?? []) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    decor.push({ type: 'arc', x0: a.x, y0: a.y, x1: b.x, y1: b.y, variant: e.variant, arrow: true, label: e.label, dash: e.dash });
  }

  // pins (icon if given, else dot) + labels
  for (const n of nodes) {
    const p = pos.get(n.id);
    if (n.icon) decor.push({ type: 'icon', name: n.icon, x: p.x, y: p.y - 1.1, size: 15 });
    else decor.push({ type: 'pin', x: p.x, y: p.y, r: 3.5 });
    decor.push({ type: 'text', x: p.x + (n.icon ? 1.3 : 0.8), y: p.y + (n.icon ? 1.4 : -0.6), text: n.label, anchor: 'start', muted: false, size: 12 });
  }

  return { width: W + MARGIN * 2, height: H + MARGIN * 2, nodes: [], containers: [], edges: [], decor };
}
